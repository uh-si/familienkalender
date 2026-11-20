"""Sprachansagen: Lautsprecher (Mediaplayer über TTS) und Alexa (Echo).

- Mediaplayer: Aktion tts.speak mit der gewählten Sprachausgabe (TTS-Entität).
- Alexa (offizielle Integration „Alexa Devices“): notify.send_message an eine
  Notify-Entität, z. B. notify.echo_kueche_announce.
- Alexa Media Player (Community-Integration): Dienst notify.alexa_media_… mit type „announce“.
Während der Ruhezeit werden keine Ansagen abgespielt.
"""
from __future__ import annotations

import logging
from datetime import datetime, time
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import OPT_QUIET_END, OPT_QUIET_START, OPT_TTS_ENGINE

_LOGGER = logging.getLogger(__name__)


def _t(value: str | None, default: str) -> time:
    try:
        h, m = (value or default).split(":")[:2]
        return time(int(h), int(m))
    except ValueError:
        h, m = default.split(":")
        return time(int(h), int(m))


def in_quiet_time(options: dict[str, Any], now: datetime) -> bool:
    start, end = _t(options.get(OPT_QUIET_START), "21:00"), _t(options.get(OPT_QUIET_END), "07:00")
    if start == end:
        return False
    cur = now.time()
    return start <= cur < end if start < end else (cur >= start or cur < end)


class Announcer:
    def __init__(self, hass: HomeAssistant, options: dict[str, Any]) -> None:
        self.hass = hass
        self.options = options

    def _tts_engine(self) -> str | None:
        engine = self.options.get(OPT_TTS_ENGINE)
        if engine and self.hass.states.get(engine):
            return engine
        # Keine Auswahl: erste vorhandene Sprachausgabe nehmen
        ids = sorted(s.entity_id for s in self.hass.states.async_all("tts"))
        return ids[0] if ids else None

    async def async_announce(self, users: list[dict], texts: dict[str, str], respect_quiet: bool = True) -> int:
        """Ansage an alle Lautsprecher/Echos der angegebenen Personen. Gibt die Anzahl der Ziele zurück."""
        if respect_quiet and in_quiet_time(self.options, dt_util.now()):
            _LOGGER.debug("Familienkalender: Ruhezeit – keine Sprachansage")
            return 0
        media: dict[str, str] = {}
        alexa: dict[str, str] = {}
        for u in users:
            for e in u.get("speak_media") or []:
                media.setdefault(e, u.get("lang", "de"))
            for e in u.get("speak_alexa") or []:
                alexa.setdefault(e, u.get("lang", "de"))
        sent = 0
        # Lautsprecher, nach Sprache gruppiert
        if media:
            engine = self._tts_engine()
            if not engine:
                _LOGGER.warning("Familienkalender: Keine Sprachausgabe (TTS) eingerichtet – Lautsprecher-Ansage nicht möglich")
            else:
                by_lang: dict[str, list[str]] = {}
                for ent, lang in media.items():
                    by_lang.setdefault(lang, []).append(ent)
                for lang, ents in by_lang.items():
                    data = {"entity_id": engine, "media_player_entity_id": ents, "message": texts.get(lang) or texts["de"]}
                    try:
                        await self.hass.services.async_call("tts", "speak", {**data, "language": lang}, blocking=True)
                    except Exception:  # noqa: BLE001 – Sprache evtl. nicht unterstützt → Standardsprache der TTS
                        try:
                            await self.hass.services.async_call("tts", "speak", data, blocking=True)
                        except Exception as err:  # noqa: BLE001
                            _LOGGER.warning("Familienkalender: Ansage auf %s fehlgeschlagen: %s", ents, err)
                            continue
                    sent += len(ents)
        # Alexa
        for target, lang in alexa.items():
            msg = texts.get(lang) or texts["de"]
            try:
                if target.startswith("notify.") and self.hass.states.get(target) is not None:
                    await self.hass.services.async_call("notify", "send_message",
                                                        {"entity_id": target, "message": msg}, blocking=True)
                else:
                    name = target.split(".", 1)[-1]
                    if not self.hass.services.has_service("notify", name):
                        _LOGGER.warning("Familienkalender: Alexa-Ziel %s nicht gefunden", target)
                        continue
                    await self.hass.services.async_call("notify", name,
                                                        {"message": msg, "data": {"type": "announce"}}, blocking=True)
                sent += 1
            except Exception as err:  # noqa: BLE001 – ein Gerät darf die anderen nicht blockieren
                _LOGGER.warning("Familienkalender: Alexa-Ansage an %s fehlgeschlagen: %s", target, err)
        return sent
