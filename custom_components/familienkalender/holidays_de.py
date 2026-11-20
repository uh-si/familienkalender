"""Gesetzliche Feiertage in Deutschland, offline berechnet.

Reines Python, keine Home-Assistant-Abhängigkeit.
"""
from __future__ import annotations

from datetime import date, timedelta

STATES = {
    "BW": "Baden-Württemberg",
    "BY": "Bayern",
    "BE": "Berlin",
    "BB": "Brandenburg",
    "HB": "Bremen",
    "HH": "Hamburg",
    "HE": "Hessen",
    "MV": "Mecklenburg-Vorpommern",
    "NI": "Niedersachsen",
    "NW": "Nordrhein-Westfalen",
    "RP": "Rheinland-Pfalz",
    "SL": "Saarland",
    "SN": "Sachsen",
    "ST": "Sachsen-Anhalt",
    "SH": "Schleswig-Holstein",
    "TH": "Thüringen",
}


def easter(year: int) -> date:
    """Ostersonntag (Gauß/Meeus, gregorianisch)."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month, day = divmod(h + l - 7 * m + 114, 31)
    return date(year, month, day + 1)


def holidays(year: int, state: str, assumption_by: bool = True) -> dict[date, str]:
    """Feiertage eines Jahres für ein Bundesland.

    assumption_by: Mariä Himmelfahrt in Bayern mitzählen (gilt in Gemeinden
    mit überwiegend katholischer Bevölkerung, also in den meisten).
    """
    e = easter(year)
    h: dict[date, str] = {
        date(year, 1, 1): "Neujahr",
        e - timedelta(days=2): "Karfreitag",
        e + timedelta(days=1): "Ostermontag",
        date(year, 5, 1): "Tag der Arbeit",
        e + timedelta(days=39): "Christi Himmelfahrt",
        e + timedelta(days=50): "Pfingstmontag",
        date(year, 10, 3): "Tag der Deutschen Einheit",
        date(year, 12, 25): "1. Weihnachtsfeiertag",
        date(year, 12, 26): "2. Weihnachtsfeiertag",
    }
    if state in ("BW", "BY", "ST"):
        h[date(year, 1, 6)] = "Heilige Drei Könige"
    if (state == "BE" and year >= 2019) or (state == "MV" and year >= 2023):
        h[date(year, 3, 8)] = "Internationaler Frauentag"
    if state == "BB":
        h[e] = "Ostersonntag"
        h[e + timedelta(days=49)] = "Pfingstsonntag"
    if state in ("BW", "BY", "HE", "NW", "RP", "SL"):
        h[e + timedelta(days=60)] = "Fronleichnam"
    if state == "SL" or (state == "BY" and assumption_by):
        h[date(year, 8, 15)] = "Mariä Himmelfahrt"
    if state == "TH" and year >= 2019:
        h[date(year, 9, 20)] = "Weltkindertag"
    reformation = {"BB", "MV", "SN", "ST", "TH"}
    if year >= 2018:
        reformation |= {"HB", "HH", "NI", "SH"}
    if state in reformation or year == 2017:
        h[date(year, 10, 31)] = "Reformationstag"
    if state in ("BW", "BY", "NW", "RP", "SL"):
        h[date(year, 11, 1)] = "Allerheiligen"
    if state == "SN":
        # Mittwoch vor dem 23. November
        d = date(year, 11, 22)
        while d.weekday() != 2:
            d -= timedelta(days=1)
        h[d] = "Buß- und Bettag"
    return h


def holidays_between(start: date, end: date, state: str, assumption_by: bool = True) -> list[dict]:
    """Feiertage im Zeitraum [start, end) als Liste {date, name}."""
    out = []
    for y in range(start.year, end.year + 1):
        for d, n in holidays(y, state, assumption_by).items():
            if start <= d < end:
                out.append({"date": d.isoformat(), "name": n})
    return sorted(out, key=lambda x: x["date"])
