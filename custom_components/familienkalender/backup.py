"""Wöchentliche ICS-Sicherung aller Termine nach /config/familienkalender_backup/ics/."""
from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_call_later, async_track_time_change
from homeassistant.util import dt as dt_util

from .ics import build_ics

if TYPE_CHECKING:
    from .data import CalendarData

_LOGGER = logging.getLogger(__name__)
NAME_RE = re.compile(r"^familienkalender-(\d{4}-\d{2}-\d{2})\.ics$")
INTERVAL = timedelta(days=7)


class IcsBackup:
    def __init__(self, hass: HomeAssistant, data: CalendarData, keep: int = 8) -> None:
        self.hass = hass
        self.data = data
        self.keep = max(1, min(52, int(keep)))
        self.folder = Path(hass.config.path("familienkalender_backup", "ics"))
        self._unsubs: list = []

    def start(self) -> None:
        # täglich nachts prüfen, ob die letzte Sicherung älter als 7 Tage ist; kurz nach dem Start ebenfalls
        self._unsubs.append(async_track_time_change(self.hass, self._check, hour=3, minute=17, second=0))
        self._unsubs.append(async_call_later(self.hass, 300, self._check))

    def stop(self) -> None:
        for u in self._unsubs:
            u()
        self._unsubs.clear()

    @callback
    def _check(self, _now=None) -> None:
        self.hass.async_create_task(self.async_run())

    async def async_run(self, force: bool = False) -> Path | None:
        events = [dict(e) for e in self.data.events.values()]
        today = dt_util.now().date()
        return await self.hass.async_add_executor_job(self._write, events, today, force)

    def _write(self, events: list, today, force: bool) -> Path | None:
        self.folder.mkdir(parents=True, exist_ok=True)
        files = sorted((p for p in self.folder.iterdir() if NAME_RE.match(p.name)), key=lambda p: p.name)
        if files and not force:
            last = datetime.strptime(NAME_RE.match(files[-1].name).group(1), "%Y-%m-%d").date()
            if today - last < INTERVAL:
                return None
        text = build_ics(events, self.data.user_names(), self.data.tz)
        target = self.folder / f"familienkalender-{today.isoformat()}.ics"
        tmp = target.with_suffix(".tmp")
        tmp.write_text(text, encoding="utf-8")
        tmp.replace(target)
        files = sorted((p for p in self.folder.iterdir() if NAME_RE.match(p.name)), key=lambda p: p.name)
        for old in files[:-self.keep]:
            old.unlink(missing_ok=True)
        _LOGGER.info("Familienkalender: ICS-Sicherung geschrieben: %s", target)
        return target
