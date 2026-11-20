"""Kalender-Entitäten: eine je aktiver Person + Feiertage + Schulferien.

Die Entitäten sind bewusst schreibgeschützt. Änderungen laufen nur über die
Familienkalender-Karte, damit die Berechtigungen immer gelten.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import DOMAIN, OPT_SHOW_HOLIDAYS, OPT_SHOW_SCHOOL, OPT_STATE, OPT_ASSUMPTION_BY, SIGNAL_CHANGED, VERSION
from .holidays_de import holidays_between
from .i18n import tr_name
from .model import Occurrence


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    rt = entry.runtime_data
    ents: list[CalendarEntity] = [PersonCalendar(entry, u) for u in rt.data.users if u["active"]]
    if entry.options.get(OPT_SHOW_HOLIDAYS, True):
        ents.append(HolidayCalendar(entry))
    if entry.options.get(OPT_SHOW_SCHOOL, True):
        ents.append(SchoolCalendar(entry))
    async_add_entities(ents)


class _Base(CalendarEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, entry: ConfigEntry) -> None:
        self.entry = entry
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            translation_key="familienkalender",
            manufacturer="Familienkalender",
            sw_version=VERSION,
            entry_type=DeviceEntryType.SERVICE,
        )
        self._event: CalendarEvent | None = None

    def _lang(self) -> str:
        """Systemsprache von Home Assistant (für Feiertags-/Ferien-Namen)."""
        hass = getattr(self, "hass", None)
        return str(getattr(getattr(hass, "config", None), "language", None) or "de")

    @property
    def event(self) -> CalendarEvent | None:
        return self._event

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_CHANGED, self._changed))
        self.async_on_remove(async_track_time_interval(self.hass, self._tick, timedelta(minutes=1)))
        self._refresh()

    @callback
    def _changed(self, _payload=None) -> None:
        self._refresh()
        self.async_write_ha_state()

    @callback
    def _tick(self, _now) -> None:
        old = self._event
        self._refresh()
        if old != self._event:
            self.async_write_ha_state()

    @callback
    def _refresh(self) -> None:
        now = dt_util.now()
        events = self._collect(now - timedelta(days=1), now + timedelta(days=60))
        cur = [e for e in events if _end(e) > now]
        self._event = cur[0] if cur else None

    def _collect(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        raise NotImplementedError

    async def async_get_events(self, hass: HomeAssistant, start_date: datetime, end_date: datetime) -> list[CalendarEvent]:
        return self._collect(start_date, end_date)


def _end(e: CalendarEvent) -> datetime:
    if isinstance(e.end, datetime):
        return e.end
    return dt_util.start_of_local_day(e.end)


def _overlap(events: list[CalendarEvent], start: datetime, end: datetime) -> list[CalendarEvent]:
    return [e for e in events if dt_util.start_of_local_day(e.start) < end and _end(e) > start]


def _to_event(o: Occurrence) -> CalendarEvent:
    ev = o.event
    return CalendarEvent(
        start=o.start, end=o.end, summary=ev["title"],
        description=ev.get("description") or None, location=ev.get("location") or None,
        uid=ev["uid"], recurrence_id=o.day.isoformat() if ev.get("recurrence") else None,
    )


class PersonCalendar(_Base):
    def __init__(self, entry: ConfigEntry, user: dict) -> None:
        super().__init__(entry)
        self.user_id = user["id"]
        if user["name"]:
            self._attr_name = user["name"]
        elif user.get("household"):
            self._attr_translation_key = "household"  # Haushalt / Household / Háztartás
        else:
            self._attr_name = user["id"]
        self._attr_unique_id = f"{entry.entry_id}_{user['id']}"
        self._attr_icon = "mdi:account-clock"

    def _collect(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        data = self.entry.runtime_data.data
        return [_to_event(o) for o in data.occurrences(start, end, user=self.user_id)]


class HolidayCalendar(_Base):
    _attr_icon = "mdi:calendar-star"

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry)
        self._attr_unique_id = f"{entry.entry_id}_feiertage"
        self._attr_translation_key = "holidays"

    def _collect(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        opts = self.entry.options
        s, e = dt_util.as_local(start).date(), dt_util.as_local(end).date() + timedelta(days=1)
        out = []
        for h in holidays_between(s, e, opts.get(OPT_STATE, "BY"), opts.get(OPT_ASSUMPTION_BY, True)):
            d = date.fromisoformat(h["date"])
            out.append(CalendarEvent(start=d, end=d + timedelta(days=1), summary=tr_name(h["name"], self._lang()), uid=f"feiertag-{h['date']}"))
        return _overlap(out, start, end)


class SchoolCalendar(_Base):
    _attr_icon = "mdi:school"

    def __init__(self, entry: ConfigEntry) -> None:
        super().__init__(entry)
        self._attr_unique_id = f"{entry.entry_id}_schulferien"
        self._attr_translation_key = "school_holidays"

    def _collect(self, start: datetime, end: datetime) -> list[CalendarEvent]:
        school = self.entry.runtime_data.school
        s, e = dt_util.as_local(start).date(), dt_util.as_local(end).date() + timedelta(days=1)
        return _overlap([
            CalendarEvent(start=date.fromisoformat(i["start"]), end=date.fromisoformat(i["end"]) + timedelta(days=1),
                          summary=tr_name(i["name"], self._lang()), uid=f"ferien-{i['start']}")
            for i in school.between(s, e)
        ], start, end)
