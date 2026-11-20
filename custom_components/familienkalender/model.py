"""Termin-Modell: Prüfen, Normalisieren und Vorkommen berechnen.

Reines Python, keine Home-Assistant-Abhängigkeit.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, tzinfo
from typing import Any

from .recurrence import FREQS, occurrences

MAX_TITLE = 200


class EventError(ValueError):
    """Ungültige Termindaten. `code` wird in der Karte übersetzt (de/hu/en)."""

    def __init__(self, message: str, code: str = "invalid") -> None:
        super().__init__(message)
        self.code = code


def parse_date(v: str) -> date:
    return date.fromisoformat(str(v)[:10])


def parse_dt(v: str, tz: tzinfo) -> datetime:
    d = datetime.fromisoformat(str(v))
    if d.tzinfo is None:
        d = d.replace(tzinfo=tz)
    return d.astimezone(tz)


def clean_event(raw: dict[str, Any], valid_users: set[str], tz: tzinfo) -> dict[str, Any]:
    """Termindaten aus der Oberfläche/ICS prüfen und vereinheitlichen."""
    title = str(raw.get("title") or "").strip()[:MAX_TITLE]
    if not title:
        raise EventError("Bitte einen Titel angeben.", "title")
    users = [u for u in dict.fromkeys(raw.get("users") or []) if u in valid_users]
    if not users:
        raise EventError("Bitte mindestens eine Person wählen.", "person")
    all_day = bool(raw.get("all_day"))
    try:
        if all_day:
            s = parse_date(raw["start"])
            e = parse_date(raw.get("end") or raw["start"])
            if e <= s:
                e = s + timedelta(days=1)
            start, end = s.isoformat(), e.isoformat()
        else:
            s = parse_dt(raw["start"], tz)
            e = parse_dt(raw.get("end") or raw["start"], tz)
            if e <= s:
                e = s + timedelta(hours=1)
            start, end = s.isoformat(timespec="seconds"), e.isoformat(timespec="seconds")
    except (KeyError, TypeError, ValueError) as err:
        raise EventError("Ungültiges Datum oder ungültige Uhrzeit.", "date") from err

    rec = raw.get("recurrence") or None
    recurrence = None
    if rec and rec.get("freq"):
        if rec["freq"] not in FREQS:
            raise EventError("Ungültige Wiederholung.", "recurrence")
        until = rec.get("until") or None
        if until:
            try:
                until = parse_date(until).isoformat()
            except ValueError as err:
                raise EventError("Ungültiges Enddatum der Wiederholung.", "recurrence") from err
            if until < start[:10]:
                raise EventError("Die Wiederholung endet vor dem ersten Termin.", "recurrence_end")
        recurrence = {"freq": rec["freq"], "interval": max(1, int(rec.get("interval") or 1)), "until": until}

    reminders = sorted({int(m) for m in (raw.get("reminders") or []) if 0 <= int(m) <= 60 * 24 * 31})
    birth_year = None
    if raw.get("birth_year") not in (None, ""):
        try:
            birth_year = int(raw["birth_year"])
        except (TypeError, ValueError) as err:
            raise EventError("Ungültiges Geburtsjahr.", "birth_year") from err
        if not 1850 <= birth_year <= int(start[:4]):
            raise EventError("Ungültiges Geburtsjahr.", "birth_year")
    return {
        "title": title,
        "users": users,
        "all_day": all_day,
        "start": start,
        "end": end,
        "recurrence": recurrence,
        "reminders": reminders,
        "location": str(raw.get("location") or "").strip()[:300],
        "description": str(raw.get("description") or "").strip()[:4000],
        "birth_year": birth_year if recurrence and recurrence["freq"] == "yearly" else None,
    }


@dataclass
class Occurrence:
    event: dict[str, Any]
    start: date | datetime
    end: date | datetime

    @property
    def all_day(self) -> bool:
        return bool(self.event.get("all_day"))

    @property
    def day(self) -> date:
        return self.start if self.all_day else self.start.date()  # type: ignore[union-attr]

    @property
    def key(self) -> str:
        return f"{self.event['uid']}_{self.day.isoformat()}"

    def start_dt(self, tz: tzinfo, allday_time: time = time(0, 0)) -> datetime:
        if self.all_day:
            return datetime.combine(self.start, allday_time, tzinfo=tz)  # type: ignore[arg-type]
        return self.start  # type: ignore[return-value]

    def end_dt(self, tz: tzinfo) -> datetime:
        if self.all_day:
            return datetime.combine(self.end, time(0, 0), tzinfo=tz)  # type: ignore[arg-type]
        return self.end  # type: ignore[return-value]


def expand(ev: dict[str, Any], range_start: datetime, range_end: datetime, tz: tzinfo) -> list[Occurrence]:
    """Alle Vorkommen eines Termins, die [range_start, range_end) überlappen."""
    rec = ev.get("recurrence") or {}
    freq = rec.get("freq")
    until = parse_date(rec["until"]) if rec.get("until") else None
    exdates = {parse_date(x) for x in ev.get("exdates") or []}
    rs, re_ = range_start.astimezone(tz), range_end.astimezone(tz)
    out: list[Occurrence] = []
    if ev.get("all_day"):
        s, e = parse_date(ev["start"]), parse_date(ev["end"])
        span = max(1, (e - s).days)
        for d in occurrences(s, span, freq, rs.date() - timedelta(days=1), re_.date() + timedelta(days=1),
                             rec.get("interval", 1), until, exdates):
            o_s, o_e = d, d + timedelta(days=span)
            if datetime.combine(o_s, time(), tzinfo=tz) < re_ and datetime.combine(o_e, time(), tzinfo=tz) > rs:
                out.append(Occurrence(ev, o_s, o_e))
    else:
        s, e = parse_dt(ev["start"], tz), parse_dt(ev["end"], tz)
        wall_s = s.replace(tzinfo=None)
        dur = e.replace(tzinfo=None) - wall_s
        span = (e.date() - s.date()).days + 1
        for d in occurrences(s.date(), span, freq, rs.date() - timedelta(days=1), re_.date() + timedelta(days=1),
                             rec.get("interval", 1), until, exdates):
            o_wall = datetime.combine(d, wall_s.time())
            o_s = o_wall.replace(tzinfo=tz)
            o_e = (o_wall + dur).replace(tzinfo=tz)
            if o_s < re_ and (o_e > rs or (o_e == o_s and o_s >= rs)):
                out.append(Occurrence(ev, o_s, o_e))
    return out


def occurrence_payload(o: Occurrence) -> dict[str, Any]:
    """Darstellung eines Vorkommens für die Oberfläche."""
    ev = o.event
    if o.all_day:
        start, end = o.start.isoformat(), o.end.isoformat()
    else:
        start, end = o.start.isoformat(timespec="seconds"), o.end.isoformat(timespec="seconds")
    return {
        "uid": ev["uid"],
        "key": o.key,
        "title": ev["title"],
        "users": ev["users"],
        "all_day": bool(ev.get("all_day")),
        "start": start,
        "end": end,
        "series_start": ev["start"],
        "series_end": ev["end"],
        "recurrence": ev.get("recurrence"),
        "reminders": ev.get("reminders", []),
        "location": ev.get("location", ""),
        "description": ev.get("description", ""),
        "birth_year": ev.get("birth_year"),
        "age": (o.day.year - ev["birth_year"]) if ev.get("birth_year") else None,
    }
