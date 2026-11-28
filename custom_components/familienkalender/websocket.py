"""WebSocket-Schnittstelle für die Dashboard-Karte – mit Rechteprüfung auf dem Server."""
from __future__ import annotations

from datetime import date
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import dt as dt_util

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
    OPT_TT,
    OPT_TT_BLOCKS,
    PERM_FULL,
    PERM_READ,
    PERM_WRITE,
    SIGNAL_CHANGED,
)
from .holidays_de import holidays_between
from .ics import IcsError, build_ics, parse_ics
from .model import EventError, occurrence_payload
from .timetable import TimetableError
from .pdf import MAX_PDF_B64, PdfError, async_push, decode_pdf, file_exists, pdf_dir, signed_path, write_pdf

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
        except (EventError, IcsError, PdfError, TimetableError) as err:
            # Code wird von der Karte in die Gerätesprache übersetzt
            connection.send_error(msg["id"], f"fk_{getattr(err, 'code', 'invalid')}", str(err))
    return wrapper


@callback
def async_register(hass: HomeAssistant) -> None:
    for cmd in (ws_config, ws_events, ws_create, ws_update, ws_delete, ws_restore, ws_import, ws_export, ws_subscribe,
                ws_pdf_save, ws_pdf_send, ws_tt_get, ws_tt_plan_save, ws_tt_plan_delete,
                ws_tt_subjects_save, ws_tt_change):
        websocket_api.async_register_command(hass, cmd)


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/config"})
@websocket_api.async_response
async def ws_config(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        level = permission(entry, connection.user)
        o = entry.options
        kiosk_on = bool(connection.user and (o.get(OPT_KIOSK) or {}).get(connection.user.id))
        connection.send_result(msg["id"], {
            "users": [{**{k: u[k] for k in ("id", "name", "color", "active", "household")},
                       "celebration": bool(u.get("celebration")), "push": bool(u.get("notify"))}
                      for u in rt.data.users],
            "kiosk": {"enabled": kiosk_on, "timeout": int(o.get(OPT_KIOSK_TIMEOUT, 5)),
                      "night": bool(o.get(OPT_KIOSK_NIGHT, True)), "night_start": o.get(OPT_KIOSK_NIGHT_START, "22:00"),
                      "night_end": o.get(OPT_KIOSK_NIGHT_END, "06:00"), "solid": bool(o.get(OPT_KIOSK_SOLID, False))},
            "defaults": {"reminders": entry.options.get(OPT_DEFAULT_REMINDERS, [])},
            "permissions": {"write": level in (PERM_WRITE, PERM_FULL), "delete": level == PERM_FULL,
                            "admin": bool(connection.user and connection.user.is_admin)},
            "state": entry.options.get(OPT_STATE),
            "timetable": {"enabled": bool(o.get(OPT_TT, True)), "blocks": bool(o.get(OPT_TT_BLOCKS, True))},
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


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/pdf_save",
    vol.Required("slug"): vol.All(str, vol.Length(min=1, max=40)),
    vol.Required("data"): vol.All(str, vol.Length(max=MAX_PDF_B64)),
})
@websocket_api.async_response
async def ws_pdf_save(hass, connection, msg):
    """Kalenderblatt (PDF aus der Karte) im Medien-Ordner ablegen."""
    async def run(hass, connection, msg, entry, rt):
        raw = decode_pdf(msg["data"])
        name = await hass.async_add_executor_job(write_pdf, pdf_dir(hass), msg["slug"], raw, dt_util.now())
        connection.send_result(msg["id"], {
            "file": name, "url": signed_path(hass, name, getattr(connection, "refresh_token_id", None)),
        })
    await _guard(run)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/pdf_send",
    vol.Required("file"): vol.All(str, vol.Length(max=120)),
    vol.Required("user"): vol.All(str, vol.Length(max=10)),
    vol.Optional("label", default=""): vol.All(str, vol.Length(max=80)),
})
@websocket_api.async_response
async def ws_pdf_send(hass, connection, msg):
    """Link zum Kalenderblatt per Push an eine Person schicken."""
    async def run(hass, connection, msg, entry, rt):
        if not await hass.async_add_executor_job(file_exists, pdf_dir(hass), msg["file"]):
            raise PdfError("Das Kalenderblatt gibt es nicht mehr.", "pdf_gone")
        user = next((u for u in rt.data.users if u["id"] == msg["user"] and u["active"]), None)
        if not user or not user.get("notify"):
            raise PdfError("Für diese Person ist keine Push-Benachrichtigung eingerichtet.", "no_push")
        path = signed_path(hass, msg["file"], getattr(connection, "refresh_token_id", None))
        sent = await async_push(hass, user["notify"], user.get("lang", "de"), msg["label"] or msg["file"], path)
        if not sent:
            raise PdfError("Senden fehlgeschlagen.", "push_failed")
        connection.send_result(msg["id"], {"sent": sent})
    await _guard(run)(hass, connection, msg)


# ---------------------------------------------------------------- Stundenplan
def _tt(rt):
    if rt.timetable is None:
        raise EventError("Der Familienkalender ist nicht eingerichtet.", "not_setup")
    return rt.timetable


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/tt_get"})
@websocket_api.async_response
async def ws_tt_get(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        connection.send_result(msg["id"], _tt(rt).payload())
    await _guard(run)(hass, connection, msg)


@websocket_api.websocket_command({vol.Required("type"): "familienkalender/tt_plan_save", vol.Required("plan"): dict})
@websocket_api.async_response
async def ws_tt_plan_save(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        users = {u["id"] for u in rt.data.users}
        connection.send_result(msg["id"], {"plan": _tt(rt).save_plan(msg["plan"], users)})
    await _guard(run, PERM_WRITE)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/tt_plan_delete", vol.Required("id"): vol.All(str, vol.Length(max=16)),
})
@websocket_api.async_response
async def ws_tt_plan_delete(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        _tt(rt).delete_plan(msg["id"])
        connection.send_result(msg["id"], {})
    await _guard(run, PERM_FULL)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/tt_subjects_save", vol.Required("subjects"): vol.All(list, vol.Length(max=80)),
})
@websocket_api.async_response
async def ws_tt_subjects_save(hass, connection, msg):
    async def run(hass, connection, msg, entry, rt):
        connection.send_result(msg["id"], {"subjects": _tt(rt).save_subjects(msg["subjects"])})
    await _guard(run, PERM_WRITE)(hass, connection, msg)


@websocket_api.websocket_command({
    vol.Required("type"): "familienkalender/tt_change",
    vol.Required("plan"): vol.All(str, vol.Length(max=16)),
    vol.Required("date"): vol.All(str, vol.Length(max=10)),
    vol.Required("p"): vol.All(int, vol.Range(min=0, max=20)),
    vol.Optional("change"): vol.Any(None, dict),
})
@websocket_api.async_response
async def ws_tt_change(hass, connection, msg):
    """Ausfall oder Vertretung für einen Tag setzen (change = None hebt sie auf)."""
    async def run(hass, connection, msg, entry, rt):
        _tt(rt).set_change(msg["plan"], msg["date"], msg["p"], msg.get("change"))
        connection.send_result(msg["id"], {})
    await _guard(run, PERM_WRITE)(hass, connection, msg)
