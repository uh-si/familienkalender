"""Datenhaltung: Termine laden, prüfen, speichern, abfragen."""
from __future__ import annotations

import copy
import logging
import re
import uuid
from datetime import date, datetime, timedelta, tzinfo
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    DEFAULT_COLORS,
    CELEBRATION_ID,
    CELEBRATION_NAMES,
    HOUSEHOLD_ID,
    HOUSEHOLD_NAMES,
    MAX_USERS,
    OPT_USERS,
    SIGNAL_CHANGED,
    STORAGE_KEY_EVENTS,
    STORAGE_MINOR_EVENTS,
    STORAGE_VERSION_EVENTS,
    default_users,
)
from .model import EventError, Occurrence, clean_event, expand

_LOGGER = logging.getLogger(__name__)
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


class EventStore(Store):
    """Store mit Migrationspfad für spätere Datenformat-Versionen."""

    async def _async_migrate_func(self, old_major: int, old_minor: int, old_data: dict) -> dict:
        # Version 1.1 ist das erste Format. Künftige Umbauten kommen hierher,
        # damit alte Daten bei Updates automatisch übernommen werden.
        return old_data


def normalize_users(raw: list[dict] | None) -> list[dict]:
    """Benutzerliste aus den Optionen prüfen (10 Personen + Haushalt + Geburts-/Festtage)."""
    base = default_users()
    by_id = {u.get("id"): u for u in raw or [] if isinstance(u, dict)}
    out = []
    for i, d in enumerate(base):
        u = by_id.get(d["id"], {})
        hh = d["id"] == HOUSEHOLD_ID
        fe = d["id"] == CELEBRATION_ID
        color = str(u.get("color") or d["color"])
        name = str(u.get("name") or "").strip()[:40]
        out.append({
            "id": d["id"],
            "name": name,
            "color": color if HEX.match(color) else d["color"],
            # Haushalt braucht keinen Namen und ist standardmäßig aktiv
            "active": bool(u.get("active", True)) if hh or fe else (bool(u.get("active")) and bool(name)),
            "notify": [str(n) for n in (u.get("notify") or []) if isinstance(n, str)][:10],
            "lang": u.get("lang") if u.get("lang") in ("de", "hu", "en") else "de",
            # Sprachansagen: Lautsprecher (media_player.…) und Alexa (notify.…)
            "speak_media": [str(e) for e in (u.get("speak_media") or []) if str(e).startswith("media_player.")][:10],
            "speak_alexa": [str(e) for e in (u.get("speak_alexa") or []) if str(e).startswith("notify.")][:10],
            "household": hh,
            "celebration": fe,
        })
    return out


class CalendarData:
    """Alle Termine des Familienkalenders."""

    def __init__(self, hass: HomeAssistant, options: dict[str, Any]) -> None:
        self.hass = hass
        self.options = options
        self.users = normalize_users(options.get(OPT_USERS))
        self._store = EventStore(hass, STORAGE_VERSION_EVENTS, STORAGE_KEY_EVENTS,
                                 minor_version=STORAGE_MINOR_EVENTS, private=True, atomic_writes=True)
        self.events: dict[str, dict[str, Any]] = {}

    @property
    def tz(self) -> tzinfo:
        return dt_util.get_default_time_zone()

    @property
    def user_ids(self) -> set[str]:
        return {u["id"] for u in self.users}

    @property
    def active_ids(self) -> set[str]:
        return {u["id"] for u in self.users if u["active"]}

    def user_names(self, lang: str = "de") -> dict[str, str]:
        def special(uid: str) -> str:
            if uid == HOUSEHOLD_ID:
                return HOUSEHOLD_NAMES.get(lang, "Haushalt")
            if uid == CELEBRATION_ID:
                return CELEBRATION_NAMES.get(lang, "Geburts- & Festtage")
            return uid
        return {u["id"]: u["name"] or special(u["id"]) for u in self.users}

    async def async_load(self) -> None:
        raw = await self._store.async_load() or {}
        events = raw.get("events") if isinstance(raw, dict) else None
        skipped = 0
        for uid, ev in (events or {}).items():
            # Beim Laden genauso streng prüfen wie beim Speichern
            try:
                cleaned = clean_event(ev, self.user_ids, self.tz)
            except (EventError, TypeError, ValueError, AttributeError):
                skipped += 1
                _LOGGER.warning("Familienkalender: Termin %s ist beschädigt und wird ignoriert", uid)
                continue
            cleaned.update(self._meta(ev, uid))
            self.events[uid] = cleaned
        if skipped:
            # Beschädigte Rohdaten nicht überschreiben, sondern sichern
            backup = Store(self.hass, 1, f"{STORAGE_KEY_EVENTS}.defekt_{dt_util.now():%Y%m%d%H%M%S}", private=True)
            await backup.async_save(raw)

    @staticmethod
    def _meta(ev: dict[str, Any], uid: str) -> dict[str, Any]:
        exd = []
        for x in ev.get("exdates") or []:
            try:
                exd.append(date.fromisoformat(str(x)[:10]).isoformat())
            except ValueError:
                continue
        return {
            "uid": uid,
            "exdates": sorted(set(exd)),
            "ics_uid": str(ev["ics_uid"])[:300] if ev.get("ics_uid") else None,
            "created": ev.get("created"),
            "updated": ev.get("updated"),
            "created_by": ev.get("created_by"),
            # Herkunft eines aus einer Serie herausgelösten Einzeltermins
            "series_uid": str(ev["series_uid"])[:64] if ev.get("series_uid") else None,
        }

    @callback
    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"events": self.events}, 1.0)
        async_dispatcher_send(self.hass, SIGNAL_CHANGED, {"changed": True})

    async def async_flush(self) -> None:
        """Ausstehende Änderungen sofort schreiben (beim Entladen)."""
        await self._store.async_save({"events": self.events})

    # ------------------------------------------------------------ Ändern
    def create(self, raw: dict[str, Any], user_id: str | None, extra: dict | None = None) -> dict[str, Any]:
        ev = clean_event(raw, self.active_ids, self.tz)
        uid = uuid.uuid4().hex
        now = dt_util.utcnow().isoformat(timespec="seconds")
        ev.update({"uid": uid, "exdates": [], "ics_uid": None, "created": now, "updated": now, "created_by": user_id})
        if extra:
            ev.update(extra)
        self.events[uid] = ev
        self._save()
        return ev

    def update(self, uid: str, raw: dict[str, Any], occurrence: str | None = None,
               user_id: str | None = None) -> dict[str, Any]:
        old = self.events.get(uid)
        if not old:
            raise EventError("Der Termin existiert nicht mehr.", "gone")
        if occurrence and old.get("recurrence"):
            # Nur dieses Vorkommen ändern: aus der Serie herausnehmen, als Einzeltermin neu anlegen
            day = date.fromisoformat(occurrence[:10]).isoformat()
            single = clean_event({**raw, "recurrence": None}, self.active_ids | set(old["users"]), self.tz)
            old["exdates"] = sorted(set(old.get("exdates", [])) | {day})
            old["updated"] = dt_util.utcnow().isoformat(timespec="seconds")
            now = old["updated"]
            single.update({"uid": uuid.uuid4().hex, "exdates": [], "ics_uid": None, "created": now, "updated": now,
                           "created_by": user_id, "series_uid": uid})
            self.events[single["uid"]] = single
            self._save()
            return single
        ev = clean_event(raw, self.active_ids, self.tz)
        keep_ex = old.get("exdates", []) if ev.get("recurrence") and ev["start"] == old["start"] else []
        ev.update({"uid": uid, "exdates": keep_ex, "ics_uid": old.get("ics_uid"), "created": old.get("created"),
                   "created_by": old.get("created_by"), "series_uid": old.get("series_uid"),
                   "updated": dt_util.utcnow().isoformat(timespec="seconds")})
        self.events[uid] = ev
        self._save()
        return ev

    def delete(self, uid: str, occurrence: str | None = None) -> dict[str, Any]:
        """Löschen; gibt den vorherigen Stand zurück (für „Rückgängig“)."""
        ev = self.events.get(uid)
        if not ev:
            raise EventError("Der Termin existiert nicht mehr.", "gone")
        snapshot = copy.deepcopy(ev)
        if occurrence and ev.get("recurrence"):
            day = date.fromisoformat(occurrence[:10]).isoformat()
            ev["exdates"] = sorted(set(ev.get("exdates", [])) | {day})
        else:
            del self.events[uid]
        self._save()
        return snapshot

    def restore(self, snapshot: dict[str, Any]) -> None:
        """Gelöschten Termin bzw. gelöschtes Vorkommen wiederherstellen."""
        uid = str(snapshot.get("uid") or "")
        if not re.fullmatch(r"[0-9a-f]{32}", uid):
            raise EventError("Ungültige Daten.", "invalid")
        ev = clean_event(snapshot, self.user_ids, self.tz)
        ev.update(self._meta(snapshot, uid))
        self.events[uid] = ev
        self._save()

    def import_events(self, raws: list[dict[str, Any]], users: list[str], user_id: str | None) -> tuple[int, int]:
        """Importierte Termine anlegen; gleiche ICS-UID wird aktualisiert statt verdoppelt."""
        by_ics = {e["ics_uid"]: uid for uid, e in self.events.items() if e.get("ics_uid")}
        ok = failed = 0
        now = dt_util.utcnow().isoformat(timespec="seconds")
        for raw in raws:
            try:
                ev = clean_event({**raw, "users": users}, self.active_ids, self.tz)
            except EventError:
                failed += 1
                continue
            uid = by_ics.get(raw.get("ics_uid")) or uuid.uuid4().hex
            prev = self.events.get(uid, {})
            ev.update({"uid": uid, "exdates": raw.get("exdates", []), "ics_uid": raw.get("ics_uid"),
                       "created": prev.get("created", now), "updated": now, "created_by": prev.get("created_by", user_id)})
            ev.update(self._meta(ev, uid))
            ev["created"], ev["updated"], ev["created_by"] = prev.get("created", now), now, prev.get("created_by", user_id)
            self.events[uid] = ev
            ok += 1
        if ok:
            self._save()
        return ok, failed

    # ------------------------------------------------------------ Lesen
    def occurrences(self, start: datetime, end: datetime, user: str | None = None,
                    only_active: bool = True) -> list[Occurrence]:
        active = self.active_ids
        out: list[Occurrence] = []
        for ev in self.events.values():
            if user and user not in ev["users"]:
                continue
            if only_active and not any(u in active for u in ev["users"]):
                continue
            out.extend(expand(ev, start, end, self.tz))
        out.sort(key=lambda o: (o.start_dt(self.tz), not o.all_day))
        return out

    def range_from_dates(self, start: str, end: str) -> tuple[datetime, datetime]:
        s = dt_util.start_of_local_day(date.fromisoformat(start[:10]))
        e = dt_util.start_of_local_day(date.fromisoformat(end[:10]))
        if e <= s:
            e = s + timedelta(days=1)
        if (e - s).days > 400:
            raise EventError("Zeitraum zu groß.", "range")
        return s, e
