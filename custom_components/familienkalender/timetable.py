"""Stundenpläne: pro Person ein Plan mit eigenem Stundenraster, optional A/B-Wochen.

Gespeichert in .storage/familienkalender.stundenplan (Teil jedes HA-Backups).
Dazu Ausfall/Vertretung für einzelne Tage und eine Erinnerung am Vorabend.
"""
from __future__ import annotations

import logging
import re
import secrets
from datetime import date, timedelta
from typing import Any, Callable

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import SIGNAL_CHANGED

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY_TT = "familienkalender.stundenplan"
STORAGE_VERSION_TT = 1
MAX_PERIODS = 14
MAX_SUBJECTS = 80
MAX_CHANGES = 600
KEEP_CHANGES_DAYS = 14

_TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
_KEY = re.compile(r"^([0-5])-(\d{1,2})$")

# Vorschlag für neue Pläne (übliches 45-Minuten-Raster)
DEFAULT_PERIODS = [
    ("08:00", "08:45"), ("08:50", "09:35"), ("09:55", "10:40"), ("10:45", "11:30"),
    ("11:45", "12:30"), ("12:35", "13:20"), ("13:30", "14:15"), ("14:15", "15:00"),
]

MSG = {
    "de": {"title": lambda who, wd: f"🎒 Morgen ({wd}): {who}", "wd": ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
           "time": lambda a, b: f"Schule {a}–{b} Uhr", "cancel": lambda n, s: f"{n}. Std. {s} entfällt",
           "sub": lambda n, s: f"{n}. Std. Vertretung: {s}", "none": "Kein Unterricht laut Plan.", "free": "frei"},
    "en": {"title": lambda who, wd: f"🎒 Tomorrow ({wd}): {who}", "wd": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
           "time": lambda a, b: f"School {a}–{b}", "cancel": lambda n, s: f"Period {n}: {s} cancelled",
           "sub": lambda n, s: f"Period {n}: substitute {s}", "none": "No lessons according to the timetable.", "free": "free"},
    "hu": {"title": lambda who, wd: f"🎒 Holnap ({wd}): {who}", "wd": ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
           "time": lambda a, b: f"Iskola {a}–{b}", "cancel": lambda n, s: f"{n}. óra: {s} elmarad",
           "sub": lambda n, s: f"{n}. óra helyettesítés: {s}", "none": "A terv szerint nincs tanítás.", "free": "szabad"},
}


class TimetableError(Exception):
    def __init__(self, message: str, code: str = "tt_invalid") -> None:
        super().__init__(message)
        self.code = code


def _s(v: Any, n: int) -> str:
    return str(v or "").strip()[:n]


def _new_id(prefix: str) -> str:
    return prefix + secrets.token_hex(4)


def norm_subject(raw: Any) -> dict:
    if not isinstance(raw, dict) or not _s(raw.get("name"), 40):
        raise TimetableError("Fach ohne Namen.")
    color = str(raw.get("color") or "")
    return {
        "id": _s(raw.get("id"), 16) or _new_id("s"),
        "name": _s(raw.get("name"), 40),
        "short": _s(raw.get("short"), 6) or _s(raw.get("name"), 3),
        "color": color if _HEX.match(color) else "#78909c",
        "note": _s(raw.get("note"), 120),
    }


def norm_plan(raw: Any, subject_ids: set[str], user_ids: set[str]) -> dict:
    if not isinstance(raw, dict):
        raise TimetableError("Ungültiger Stundenplan.")
    user = _s(raw.get("user"), 10)
    if user not in user_ids:
        raise TimetableError("Unbekannte Person.")
    days = 6 if int(raw.get("days") or 5) == 6 else 5
    periods = []
    for p in (raw.get("periods") or [])[:MAX_PERIODS]:
        a, b = _s((p or {}).get("start"), 5), _s((p or {}).get("end"), 5)
        if not (_TIME.match(a) and _TIME.match(b)) or b <= a:
            raise TimetableError("Ungültige Uhrzeit im Stundenraster.", "tt_time")
        periods.append({"start": a, "end": b})
    if not periods:
        raise TimetableError("Das Stundenraster ist leer.", "tt_time")
    for prev, cur in zip(periods, periods[1:]):
        if cur["start"] < prev["end"]:
            raise TimetableError("Die Stunden überschneiden sich.", "tt_time")
    ab = bool(raw.get("ab"))
    ref = _s(raw.get("ab_ref"), 10)
    if ab:
        try:
            d = date.fromisoformat(ref)
            ref = (d - timedelta(days=d.weekday())).isoformat()
        except ValueError:
            today = dt_util.now().date()
            ref = (today - timedelta(days=today.weekday())).isoformat()
    lessons: dict[str, dict] = {}
    for week in ("A", "B") if ab else ("A",):
        cells = {}
        for key, cell in ((raw.get("lessons") or {}).get(week) or {}).items():
            m = _KEY.match(str(key))
            if not m or not isinstance(cell, dict):
                continue
            d_i, p_i = int(m.group(1)), int(m.group(2))
            sid = _s(cell.get("s"), 16)
            if d_i >= days or p_i >= len(periods) or sid not in subject_ids:
                continue
            cells[f"{d_i}-{p_i}"] = {"s": sid, "r": _s(cell.get("r"), 20), "t": _s(cell.get("t"), 30)}
        lessons[week] = cells
    return {
        "id": _s(raw.get("id"), 16) or _new_id("t"),
        "user": user,
        "label": _s(raw.get("label"), 60),
        "days": days,
        "periods": periods,
        "ab": ab,
        "ab_ref": ref if ab else "",
        "lessons": lessons,
        "notify": [u for u in (raw.get("notify") or []) if u in user_ids][:10],
    }


def week_type(plan: dict, day: date) -> str:
    """„A“ oder „B“ – zählt die Wochen ab der Referenz-Montag (A-Woche)."""
    if not plan.get("ab"):
        return "A"
    try:
        ref = date.fromisoformat(plan["ab_ref"])
    except (KeyError, ValueError):
        return "A"
    monday = day - timedelta(days=day.weekday())
    return "A" if ((monday - ref).days // 7) % 2 == 0 else "B"


class Timetable:
    """Speicher und Logik für Stundenpläne."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION_TT, STORAGE_KEY_TT)
        self.plans: list[dict] = []
        self.subjects: list[dict] = []
        self.changes: list[dict] = []
        self._unsub: Callable[[], None] | None = None

    async def async_load(self) -> None:
        raw = await self._store.async_load() or {}
        self.plans = list(raw.get("plans") or [])
        self.subjects = list(raw.get("subjects") or [])
        self.changes = list(raw.get("changes") or [])

    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"plans": self.plans, "subjects": self.subjects, "changes": self.changes}, 1)
        async_dispatcher_send(self.hass, SIGNAL_CHANGED, {"tt": True})

    def payload(self) -> dict:
        cut = (dt_util.now().date() - timedelta(days=KEEP_CHANGES_DAYS)).isoformat()
        return {"plans": self.plans, "subjects": self.subjects, "changes": [c for c in self.changes if c["date"] >= cut]}

    # ---------------------------------------------------------- Ändern
    def save_plan(self, raw: dict, user_ids: set[str]) -> dict:
        plan = norm_plan(raw, {s["id"] for s in self.subjects}, user_ids)
        if any(p["user"] == plan["user"] and p["id"] != plan["id"] for p in self.plans):
            raise TimetableError("Für diese Person gibt es schon einen Stundenplan.", "tt_exists")
        idx = next((i for i, p in enumerate(self.plans) if p["id"] == plan["id"]), None)
        if idx is None:
            if len(self.plans) >= 11:
                raise TimetableError("Zu viele Stundenpläne.")
            self.plans.append(plan)
        else:
            old = self.plans[idx]
            self.plans[idx] = plan
            if len(plan["periods"]) < len(old["periods"]) or plan["days"] < old["days"]:
                self.changes = [c for c in self.changes if c["plan"] != plan["id"]
                                or (c["p"] < len(plan["periods"]) and date.fromisoformat(c["date"]).weekday() < plan["days"])]
        self._save()
        return plan

    def delete_plan(self, plan_id: str) -> None:
        if not any(p["id"] == plan_id for p in self.plans):
            raise TimetableError("Den Stundenplan gibt es nicht mehr.", "gone")
        self.plans = [p for p in self.plans if p["id"] != plan_id]
        self.changes = [c for c in self.changes if c["plan"] != plan_id]
        self._save()

    def save_subjects(self, raws: list) -> list[dict]:
        subjects, seen = [], set()
        for raw in (raws or [])[:MAX_SUBJECTS]:
            s = norm_subject(raw)
            if s["id"] in seen:
                s["id"] = _new_id("s")
            seen.add(s["id"])
            subjects.append(s)
        ids = {s["id"] for s in subjects}
        # Gelöschte Fächer aus Plänen und Änderungen entfernen
        for p in self.plans:
            for week, cells in p["lessons"].items():
                p["lessons"][week] = {k: v for k, v in cells.items() if v["s"] in ids}
        self.changes = [c for c in self.changes if c["kind"] != "sub" or c.get("s") in ids]
        self.subjects = subjects
        self._save()
        return subjects

    def set_change(self, plan_id: str, day: str, period: int, change: dict | None) -> None:
        plan = next((p for p in self.plans if p["id"] == plan_id), None)
        if plan is None:
            raise TimetableError("Den Stundenplan gibt es nicht mehr.", "gone")
        if not _DATE.match(day or ""):
            raise TimetableError("Ungültiges Datum.", "date")
        try:
            d = date.fromisoformat(day)
        except ValueError as err:
            raise TimetableError("Ungültiges Datum.", "date") from err
        if not 0 <= int(period) < len(plan["periods"]) or d.weekday() >= plan["days"]:
            raise TimetableError("Ungültige Stunde.")
        self.changes = [c for c in self.changes if not (c["plan"] == plan_id and c["date"] == day and c["p"] == int(period))]
        if change:
            kind = change.get("kind")
            if kind not in ("cancel", "sub"):
                raise TimetableError("Ungültige Änderung.")
            item = {"plan": plan_id, "date": day, "p": int(period), "kind": kind, "text": _s(change.get("text"), 80)}
            if kind == "sub":
                sid = _s(change.get("s"), 16)
                if sid and sid not in {s["id"] for s in self.subjects}:
                    raise TimetableError("Unbekanntes Fach.")
                item.update({"s": sid, "r": _s(change.get("r"), 20)})
            self.changes.append(item)
        cut = (dt_util.now().date() - timedelta(days=KEEP_CHANGES_DAYS)).isoformat()
        self.changes = sorted((c for c in self.changes if c["date"] >= cut), key=lambda c: (c["date"], c["p"]))[-MAX_CHANGES:]
        self._save()

    # ---------------------------------------------------------- Auswerten
    def day_lessons(self, plan: dict, day: date) -> list[dict]:
        """Stunden eines Tages inkl. Ausfall/Vertretung: [{p, start, end, subject, room, kind}]"""
        if day.weekday() >= plan["days"]:
            return []
        subj = {s["id"]: s for s in self.subjects}
        cells = plan["lessons"].get(week_type(plan, day), {})
        ch = {c["p"]: c for c in self.changes if c["plan"] == plan["id"] and c["date"] == day.isoformat()}
        out = []
        for i, per in enumerate(plan["periods"]):
            cell, c = cells.get(f"{day.weekday()}-{i}"), ch.get(i)
            if not cell and not (c and c["kind"] == "sub"):
                continue
            s = subj.get((c or {}).get("s") if c and c["kind"] == "sub" and c.get("s") else (cell or {}).get("s"))
            out.append({"p": i, "start": per["start"], "end": per["end"], "subject": s,
                        "room": (c.get("r") if c and c["kind"] == "sub" else None) or (cell or {}).get("r", ""),
                        "kind": c["kind"] if c else None, "orig": subj.get((cell or {}).get("s"))})
        return out

    def evening_message(self, plan: dict, day: date, name: str, lang: str) -> tuple[str, str] | None:
        t = MSG.get(lang, MSG["de"])
        lessons = self.day_lessons(plan, day)
        if not lessons:
            return None
        held = [x for x in lessons if x["kind"] != "cancel"]
        lines = []
        if held:
            lines.append(t["time"](held[0]["start"], held[-1]["end"]))
        for x in lessons:
            if x["kind"] == "cancel":
                lines.append(t["cancel"](x["p"] + 1, (x["orig"] or x["subject"] or {}).get("name", "?")))
            elif x["kind"] == "sub":
                lines.append(t["sub"](x["p"] + 1, (x["subject"] or {}).get("name", "?")))
        notes, seen = [], set()
        for x in held:
            s = x["subject"]
            if s and s.get("note") and s["id"] not in seen:
                seen.add(s["id"])
                notes.append(f"{s['name']}: {s['note']}")
        lines += notes
        return t["title"](name, t["wd"][day.weekday()]), "\n".join(lines) if lines else t["none"]

    # ---------------------------------------------------------- Vorabend-Erinnerung
    @callback
    def start(self, at: str, is_free: Callable[[date], bool], users: Callable[[], list[dict]]) -> None:
        self.stop()
        if not _TIME.match(at or ""):
            return
        h, m = (int(x) for x in at.split(":"))

        async def _fire(_now) -> None:
            await self.async_send_evening(is_free, users())

        self._unsub = async_track_time_change(self.hass, _fire, hour=h, minute=m, second=0)

    @callback
    def stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    async def async_send_evening(self, is_free: Callable[[date], bool], users: list[dict]) -> int:
        tomorrow = dt_util.now().date() + timedelta(days=1)
        if is_free(tomorrow):
            return 0
        by_id = {u["id"]: u for u in users}
        sent = 0
        for plan in self.plans:
            kid = by_id.get(plan["user"])
            if not kid or not kid.get("active") or not plan.get("notify"):
                continue
            for rid in plan["notify"]:
                r = by_id.get(rid)
                if not r or not r.get("active"):
                    continue
                msg = self.evening_message(plan, tomorrow, kid.get("name") or "?", r.get("lang", "de"))
                if not msg:
                    continue
                for svc in r.get("notify") or []:
                    domain, _, name = svc.partition(".")
                    if domain != "notify" or not name or not self.hass.services.has_service("notify", name):
                        continue
                    try:
                        await self.hass.services.async_call("notify", name, {
                            "title": msg[0], "message": msg[1],
                            "data": {"tag": f"familienkalender-tt-{plan['id']}", "group": "familienkalender"},
                        }, blocking=True)
                        sent += 1
                    except Exception as err:  # noqa: BLE001
                        _LOGGER.warning("Familienkalender: Stundenplan-Erinnerung an %s fehlgeschlagen: %s", svc, err)
        return sent
