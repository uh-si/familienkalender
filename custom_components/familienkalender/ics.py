"""ICS (iCalendar) lesen und schreiben – bewusst ohne Fremdbibliothek.

Reines Python, keine Home-Assistant-Abhängigkeit.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone, tzinfo
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .i18n import CALENDAR_NAME
from .recurrence import iter_dates

FREQ_MAP = {"DAILY": "daily", "WEEKLY": "weekly", "MONTHLY": "monthly", "YEARLY": "yearly"}
FREQ_BACK = {v: k for k, v in FREQ_MAP.items()}
WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
MAX_IMPORT = 5000

# Windows-Zeitzonennamen, die Outlook gern verwendet
WIN_TZ = {
    "W. Europe Standard Time": "Europe/Berlin",
    "Central Europe Standard Time": "Europe/Budapest",
    "Romance Standard Time": "Europe/Paris",
    "GMT Standard Time": "Europe/London",
    "UTC": "UTC",
}

BERLIN_VTIMEZONE = """BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE"""


class IcsError(ValueError):
    """ICS-Datei nicht lesbar."""

    def __init__(self, message: str, code: str = "ics_invalid") -> None:
        super().__init__(message)
        self.code = code


# ---------------------------------------------------------------- Lesen
def _unfold(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if raw[:1] in (" ", "\t") and lines:
            lines[-1] += raw[1:]
        elif raw.strip():
            lines.append(raw)
    return lines


def _unescape(v: str) -> str:
    return re.sub(r"\\([\\;,nN])", lambda m: "\n" if m.group(1) in "nN" else m.group(1), v)


def _split_line(line: str) -> tuple[str, dict[str, str], str]:
    # NAME;PARAM=X;PARAM2="Y":VALUE  (Doppelpunkt in Anführungszeichen beachten)
    in_q = False
    for i, ch in enumerate(line):
        if ch == '"':
            in_q = not in_q
        elif ch == ":" and not in_q:
            head, value = line[:i], line[i + 1:]
            break
    else:
        return line.upper(), {}, ""
    parts = head.split(";")
    params = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            params[k.upper()] = v.strip('"')
    return parts[0].upper(), params, value


def _zone(name: str | None, default: tzinfo) -> tzinfo:
    if not name:
        return default
    name = WIN_TZ.get(name, name)
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        # z. B. "/mozilla.org/20050126_1/Europe/Berlin"
        m = re.search(r"([A-Za-z]+/[A-Za-z_]+)$", name)
        if m:
            try:
                return ZoneInfo(m.group(1))
            except (ZoneInfoNotFoundError, ValueError):
                pass
    return default


def _parse_value(value: str, params: dict[str, str], tz: tzinfo) -> date | datetime:
    value = value.strip()
    if params.get("VALUE") == "DATE" or re.fullmatch(r"\d{8}", value):
        return datetime.strptime(value[:8], "%Y%m%d").date()
    utc = value.endswith("Z")
    dt = datetime.strptime(value.rstrip("Z")[:15], "%Y%m%dT%H%M%S")
    if utc:
        return dt.replace(tzinfo=timezone.utc).astimezone(tz)
    return dt.replace(tzinfo=_zone(params.get("TZID"), tz)).astimezone(tz)


def _parse_duration(v: str) -> timedelta:
    m = re.fullmatch(r"([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", v.strip())
    if not m:
        return timedelta(hours=1)
    sign = -1 if m.group(1) == "-" else 1
    w, d, h, mi, s = (int(x or 0) for x in m.groups()[1:])
    return sign * timedelta(weeks=w, days=d, hours=h, minutes=mi, seconds=s)


def parse_ics(text: str, tz: tzinfo) -> list[dict[str, Any]]:
    """ICS-Text in Termin-Rohdaten (ohne Personen) umwandeln."""
    if "BEGIN:VCALENDAR" not in text.upper():
        raise IcsError("Das ist keine gültige ICS-Datei.")
    lines = _unfold(text)
    events: list[dict[str, Any]] = []
    overrides: list[dict[str, Any]] = []
    cur: dict[str, Any] | None = None
    depth = 0
    for line in lines:
        name, params, value = _split_line(line)
        if name == "BEGIN" and value.upper() == "VEVENT":
            cur, depth = {"exdates": [], "_alarms": []}, 0
            continue
        if cur is None:
            continue
        if name == "BEGIN":
            depth += 1
            continue
        if name == "END" and value.upper() == "VEVENT":
            (overrides if "recurrence_id" in cur else events).append(cur)
            cur = None
            continue
        if name == "END":
            depth -= 1
            continue
        if depth > 0:
            # VALARM: Vorlaufzeit als Erinnerung übernehmen
            if name == "TRIGGER" and params.get("VALUE", "DURATION") == "DURATION":
                td = _parse_duration(value)
                if td <= timedelta(0):
                    cur["_alarms"].append(int(-td.total_seconds() // 60))
            continue
        try:
            if name == "SUMMARY":
                cur["title"] = _unescape(value)
            elif name == "DESCRIPTION":
                cur["description"] = _unescape(value)
            elif name == "LOCATION":
                cur["location"] = _unescape(value)
            elif name == "UID":
                cur["ics_uid"] = value.strip()
            elif name == "DTSTART":
                cur["dtstart"] = _parse_value(value, params, tz)
            elif name == "DTEND":
                cur["dtend"] = _parse_value(value, params, tz)
            elif name == "DURATION":
                cur["duration"] = _parse_duration(value)
            elif name == "RRULE":
                cur["rrule"] = dict(p.split("=", 1) for p in value.upper().split(";") if "=" in p)
            elif name == "EXDATE":
                for v in value.split(","):
                    d = _parse_value(v, params, tz)
                    cur["exdates"].append(d if isinstance(d, date) and not isinstance(d, datetime) else d.date())
            elif name == "RECURRENCE-ID":
                d = _parse_value(value, params, tz)
                cur["recurrence_id"] = d if not isinstance(d, datetime) else d.date()
            elif name == "STATUS" and value.strip().upper() == "CANCELLED":
                cur["cancelled"] = True
        except ValueError:
            continue

    # Einzeln geänderte Vorkommen: als eigener Termin + Ausnahme in der Serie
    by_uid = {e.get("ics_uid"): e for e in events if e.get("ics_uid")}
    for o in overrides:
        master = by_uid.get(o.get("ics_uid"))
        if master is not None:
            master["exdates"].append(o["recurrence_id"])
        if not o.get("cancelled"):
            o["ics_uid"] = f"{o.get('ics_uid')}#{o['recurrence_id'].isoformat()}"
            events.append(o)

    out: list[dict[str, Any]] = []
    for e in events:
        if e.get("cancelled") or "dtstart" not in e:
            continue
        out.extend(_to_raw(e, tz))
        if len(out) > MAX_IMPORT:
            raise IcsError(f"Die Datei enthält mehr als {MAX_IMPORT} Termine.", "ics_too_many")
    return out


def _to_raw(e: dict[str, Any], tz: tzinfo) -> list[dict[str, Any]]:
    s = e["dtstart"]
    all_day = not isinstance(s, datetime)
    if "dtend" in e:
        end = e["dtend"]
    elif "duration" in e:
        end = s + e["duration"]
    else:
        end = s + (timedelta(days=1) if all_day else timedelta(hours=1))
    if all_day and isinstance(end, datetime):
        end = end.date()
    if not all_day and not isinstance(end, datetime):
        end = datetime.combine(end, s.time(), tzinfo=tz)

    base = {
        "title": e.get("title") or "(ohne Titel)",
        "all_day": all_day,
        "location": e.get("location", ""),
        "description": e.get("description", ""),
        "reminders": sorted(set(m for m in e["_alarms"] if m <= 60 * 24 * 31)),
        "exdates": sorted({d.isoformat() for d in e["exdates"]}),
        "ics_uid": e.get("ics_uid"),
    }
    rr = e.get("rrule")
    if not rr or rr.get("FREQ") not in FREQ_MAP:
        return [{**base, "start": _iso(s), "end": _iso(end), "recurrence": None}]

    freq = FREQ_MAP[rr["FREQ"]]
    interval = int(rr.get("INTERVAL", "1") or 1)
    until = None
    if "UNTIL" in rr:
        u = _parse_value(rr["UNTIL"], {}, tz)
        until = u.date() if isinstance(u, datetime) else u
    # Wöchentlich an bestimmten Wochentagen (BYDAY=MO,WE) – als eine Serie
    byday = sorted({WEEKDAYS.index(d[-2:]) for d in rr.get("BYDAY", "").split(",") if d and d[-2:] in WEEKDAYS}) if freq == "weekly" else []
    first = s if all_day else s.date()
    if byday == [first.weekday()]:
        byday = []
    if "COUNT" in rr and not until:
        dates = list(iter_dates(first, freq, interval, None, int(rr["COUNT"]), byday or None))
        until = dates[-1] if dates else None
    rec = {"freq": freq, "interval": interval, "until": until.isoformat() if until else None}
    if byday:
        rec["byday"] = byday
    return [{**base, "start": _iso(s), "end": _iso(end), "recurrence": rec}]


def _iso(v: date | datetime) -> str:
    return v.isoformat(timespec="seconds") if isinstance(v, datetime) else v.isoformat()


# ---------------------------------------------------------------- Schreiben
def _escape(v: str) -> str:
    return v.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _fold(line: str) -> str:
    out, cur = [], ""
    for ch in line:
        if len((cur + ch).encode("utf-8")) > 74:
            out.append(cur)
            cur = " " + ch
        else:
            cur += ch
    out.append(cur)
    return "\r\n".join(out)


FOR_LABEL = {"de": "Für", "en": "For", "hu": "Kinek"}


def build_ics(events: list[dict[str, Any]], user_names: dict[str, str], tz: tzinfo, lang: str = "de") -> str:
    tzname = getattr(tz, "key", None) or "UTC"
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Familienkalender//Home Assistant//DE",
             "CALSCALE:GREGORIAN", f"X-WR-CALNAME:{CALENDAR_NAME.get(lang, CALENDAR_NAME['de'])}", f"X-WR-TIMEZONE:{tzname}"]
    if tzname == "Europe/Berlin":
        lines += BERLIN_VTIMEZONE.split("\n")

    def dt_prop(name: str, value: str, all_day: bool) -> str:
        if all_day:
            return f"{name};VALUE=DATE:{date.fromisoformat(value[:10]).strftime('%Y%m%d')}"
        d = datetime.fromisoformat(value).astimezone(tz)
        if tzname == "UTC":
            return f"{name}:{d.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
        return f"{name};TZID={tzname}:{d.strftime('%Y%m%dT%H%M%S')}"

    for ev in events:
        all_day = bool(ev.get("all_day"))
        lines += ["BEGIN:VEVENT", f"UID:{ev['uid']}@familienkalender", f"DTSTAMP:{now}",
                  dt_prop("DTSTART", ev["start"], all_day), dt_prop("DTEND", ev["end"], all_day),
                  f"SUMMARY:{_escape(ev['title'])}"]
        if ev.get("location"):
            lines.append(f"LOCATION:{_escape(ev['location'])}")
        names = [user_names.get(u, u) for u in ev.get("users", [])]
        desc = ev.get("description") or ""
        desc = (desc + "\n\n" if desc else "") + FOR_LABEL.get(lang, "Für") + ": " + ", ".join(names)
        lines.append(f"DESCRIPTION:{_escape(desc)}")
        if names:
            lines.append("CATEGORIES:" + ",".join(_escape(n) for n in names))
        rec = ev.get("recurrence")
        if rec:
            rule = f"RRULE:FREQ={FREQ_BACK[rec['freq']]};INTERVAL={rec.get('interval', 1)}"
            if rec.get("byday"):
                rule += ";BYDAY=" + ",".join(WEEKDAYS[d] for d in rec["byday"])
            if rec.get("until"):
                u = date.fromisoformat(rec["until"])
                if all_day:
                    rule += f";UNTIL={u.strftime('%Y%m%d')}"
                else:
                    end_local = datetime.combine(u, datetime.max.time().replace(microsecond=0), tzinfo=tz)
                    rule += f";UNTIL={end_local.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
            lines.append(rule)
            for x in ev.get("exdates") or []:
                if all_day:
                    lines.append(f"EXDATE;VALUE=DATE:{date.fromisoformat(x).strftime('%Y%m%d')}")
                else:
                    t = datetime.fromisoformat(ev["start"]).astimezone(tz).time()
                    d = datetime.combine(date.fromisoformat(x), t, tzinfo=tz)
                    lines.append(dt_prop("EXDATE", d.isoformat(), False))
        for m in ev.get("reminders") or []:
            lines += ["BEGIN:VALARM", "ACTION:DISPLAY", f"DESCRIPTION:{_escape(ev['title'])}",
                      f"TRIGGER:-PT{m}M", "END:VALARM"]
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(_fold(line) for line in lines) + "\r\n"
