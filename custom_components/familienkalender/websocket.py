"""WebSocket-Schnittstelle für die Dashboard-Karte – mit Rechteprüfung auf dem Server."""
from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import (
    DOMAIN,
    OPT_ASSUMPTION_BY,
    OPT_DEFAULT_PERMISSION,
    OPT_DEFAULT_REMINDERS,
    OPT_KIOSK,
    OPT_KIOSK_NIGHT,
    OPT_KIOSK_NIGHT_END,
    OPT_KIOSK_NIGHT_START,
    OPT_KIOSK_SOLID,
    OPT_KIOSK_TIMEOUT,
    OPT_PERMISSIONS,
    OPT_SHOW_HOLIDAYS,
    OPT_SHOW_SCHOOL,
    OPT_STATE,
    PERM_FULL,
    PERM_READ,
    PERM_WRITE,
    SIGNAL_CHANGED,
)
from .holidays_de import holidays_between
from .ics import IcsError, build_ics, parse_ics
from .model import EventError, occurrence_payload

MAX_ICS_BYTES = 3 * 1024 * 1024
MAX_EVENTS_RESPONSE = 3000

EVENT_SCHEMA = vol.Schema({
    vol.Required("title"): vol.All(str, vol.Length(max=500)),
    vol.Required("users"): vol.All([str], vol.Length(min=1, max=10)),
    vol.Required("all_day"): bool,
    vol.Required("start"): vol.All(str, vol.Length(max=40)),
    vol.Required("end"): vol.All(str, vol.Length(max=40)),
    vol.Optional("recurrence"): vol.Any(None, vol.Schema({
        vol.Required("freq"): vol.In(["daily", "weekly", "monthly", "yearly"]),
        vol.Optional("interval", default=1): vol.All(int, vol.Range(min=1, max=99)),
        vol.Optional("until"): vol.Any(None, vol.All(str, vol.Length(max=10))),
    })),
    vol.Optional("reminders", default=[]): vol.All([vol.All(int, vol.Range(min=0, max=44640))], vol.Length(max=10)),
    vol.Optional("location", default=""): vol.All(str, vol.Length(max=500)),
    vol.Optional("description", default=""): vol.All(str, vol.Length(max=5000)),
    vol.Optional("birth_year"): vol.Any(None, vol.All(int, vol.Range(min=1850, max=2200))),
})


def _runtime(hass: HomeAssistant):
    entries = [e for e in hass.config_entries.async_entries(DOMAIN) if e.state is ConfigEntryState.LOADED]
    if not entries:
        raise EventError("Der Familienkalender ist nicht eingerichtet.", "not_setup")
    return entries[0], entries[0].runtime_data


def permission(entry, user) -> str:
    """Rechte des angemeldeten HA-Kontos. Admins haben immer volle Rechte."""
    if user is None:
        return PERM_READ
    if user.is_admin:
        return PERM_FULL
    perms = entry.options.get(OPT_PERMISSIONS) or {}
    level = perms.get(user.id) or entry.options.get(OPT_DEFAULT_PERMISSION, PERM_WRITE)
    return level if level in (PERM_READ, PERM_WRITE, PERM_FULL) else PERM_READ


def _guard(handler, need: str | None = None):
    """Fehler sauber an die Oberfläche melden und Rechte prüfen."""
    async def wrapper(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
        try:
            entry, rt = _runtime(hass)
            if need:
                level = permission(entry, connection.user)
                allowed = level == PERM_FULL or (need == PERM_WRITE and level == PERM_WRITE)
                if not allowed:
                    connection.send_error(msg["id"], "unauthorized",
                                          "Dafür hast du keine Berechtigung. Bitte wende dich an den Admin.")
                    return
            await handler(hass, connection, msg, entry, rt)
        except (EventError, IcsError) as err:
            # Code wird von der Karte in die Gerätesprache übersetzt
            connection.send_error(msg["id"], f"fk_{getattr(err, 'code', 'invalid')}", str(err))
    return wrapper


@callback
def async_register(hass: HomeAssistant) -> None:
    for cmd in (ws_config, ws_events, ws_create, ws_update, ws_delete, ws_restore, ws_import, ws_export, ws_subscribe):
        websocket_api.async_register_command(hass, cmd)


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/config"})
@websocket_api.async_response
async def ws_config(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        level = permission(entry, connection.user)
        o = entry.options
        kiosk_on = bool(connection.user and (o.get(OPT_KIOSK) or {}).get(connection.user.id))
        connection.send_result(msg["id"], {
            "users": [{k: u[k] for k in ("id", "name", "color", "active", "household")} for u in rt.data.users],
            "kiosk": {"enabled": kiosk_on, "timeout": int(o.get(OPT_KIOSK_TIMEOUT, 5)),
                      "night": bool(o.get(OPT_KIOSK_NIGHT, True)), "night_start": o.get(OPT_KIOSK_NIGHT_START, "22:00"),
                      "night_end": o.get(OPT_KIOSK_NIGHT_END, "06:00"), "solid": bool(o.get(OPT_KIOSK_SOLID, False))},
            "defaults": {"reminders": entry.options.get(OPT_DEFAULT_REMINDERS, [])},
            "permissions": {"write": level in (PERM_WRITE, PERM_FULL), "delete": level == PERM_FULL,
                            "admin": bool(connection.user and connection.user.is_admin)},
            "state": entry.options.get(OPT_STATE),
        })
    await _guard(run)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/events",
    vol.Required("start"): vol.All(str, vol.Length(max=10)),
    vol.Required("end"): vol.All(str, vol.Length(max=10)),
})
@websocket_api.async_response
async def ws_events(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        try:
            start, end = rt.data.range_from_dates(msg["start"], msg["end"])
        except ValueError as err:
            raise EventError("Ungültiger Zeitraum.", "range") from err
        occ = rt.data.occurrences(start, end)[:MAX_EVENTS_RESPONSE]
        sd, ed = date.fromisoformat(msg["start"]), date.fromisoformat(msg["end"])
        opts = entry.options
        connection.send_result(msg["id"], {
            "events": [occurrence_payload(o) for o in occ],
            "holidays": holidays_between(sd, ed, opts.get(OPT_STATE, "BY"), opts.get(OPT_ASSUMPTION_BY, True))
            if opts.get(OPT_SHOW_HOLIDAYS, True) else [],
            "school_holidays": rt.school.between(sd, ed) if opts.get(OPT_SHOW_SCHOOL, True) else [],
        })
    await _guard(run)(hass, connection, msg)


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/create", vol.Required("event"): EVENT_SCHEMA})
@websocket_api.async_response
async def ws_create(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        ev = rt.data.create(msg["event"], connection.user.id if connection.user else None)
        connection.send_result(msg["id"], {"uid": ev["uid"]})
    await _guard(run, PERM_WRITE)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/update",
    vol.Required("uid"): vol.All(str, vol.Length(max=64)),
    vol.Required("event"): EVENT_SCHEMA,
    vol.Optional("occurrence"): vol.All(str, vol.Length(max=10)),
})
@websocket_api.async_response
async def ws_update(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        try:
            ev = rt.data.update(msg["uid"], msg["event"], msg.get("occurrence"),
                                connection.user.id if connection.user else None)
        except ValueError as err:
            if isinstance(err, EventError):
                raise
            raise EventError("Ungültiges Datum.", "date") from err
        connection.send_result(msg["id"], {"uid": ev["uid"]})
    await _guard(run, PERM_WRITE)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/delete",
    vol.Required("uid"): vol.All(str, vol.Length(max=64)),
    vol.Optional("occurrence"): vol.All(str, vol.Length(max=10)),
})
@websocket_api.async_response
async def ws_delete(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        try:
            snapshot = rt.data.delete(msg["uid"], msg.get("occurrence"))
        except ValueError as err:
            if isinstance(err, EventError):
                raise
            raise EventError("Ungültiges Datum.", "date") from err
        connection.send_result(msg["id"], {"restore": snapshot})
    await _guard(run, PERM_FULL)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/restore",
    vol.Required("event"): dict,
})
@websocket_api.async_response
async def ws_restore(hass, connection, msg):
    """„Rückgängig“ nach dem Löschen."""
    async def run(hass, connection, msg, entry, rt):
        rt.data.restore(msg["event"])
        connection.send_result(msg["id"], {})
    await _guard(run, PERM_FULL)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/import",
    vol.Required("ics"): str,
    vol.Required("users"): vol.All([str], vol.Length(min=1, max=10)),
})
@websocket_api.async_response
async def ws_import(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        if len(msg["ics"].encode("utf-8", "ignore")) > MAX_ICS_BYTES:
            raise IcsError("Die Datei ist zu groß (max. 3 MB).", "ics_too_big")
        raws = await hass.async_add_executor_job(parse_ics, msg["ics"], rt.data.tz)
        ok, failed = rt.data.import_events(raws, msg["users"], connection.user.id if connection.user else None)
        connection.send_result(msg["id"], {"imported": ok, "skipped": failed})
    await _guard(run, PERM_WRITE)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/export",
    vol.Optional("users"): vol.All([str], vol.Length(max=10)),
    vol.Optional("lang", default="de"): vol.In(["de", "en", "hu"]),
})
@websocket_api.async_response
async def ws_export(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        users = set(msg.get("users") or rt.data.user_ids)
        evs = [e for e in rt.data.events.values() if users & set(e["users"])]
        lang = msg.get("lang", "de")
        text = await hass.async_add_executor_job(build_ics, evs, rt.data.user_names(lang), rt.data.tz, lang)
        connection.send_result(msg["id"], {"ics": text, "count": len(evs)})
    await _guard(run)(hass, connection, msg)


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/subscribe"})
@callback
def ws_subscribe(hass, connection, msg):
    @callback
    def forward(payload: dict) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], payload))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_CHANGED, forward)
    connection.send_result(msg["id"])
