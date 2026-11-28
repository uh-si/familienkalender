"""Wiederholungen berechnen (täglich, wöchentlich, monatlich, jährlich).

Reines Python, keine Home-Assistant-Abhängigkeit.
"""
from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Iterator

FREQS = ("daily", "weekly", "monthly", "yearly")
MAX_ITER = 50000


def _add_months(d: date, months: int) -> date | None:
    """Gleicher Tag im Monat; None, wenn es den Tag nicht gibt (z. B. 31.)."""
    y, m = divmod(d.month - 1 + months, 12)
    y += d.year
    m += 1
    if d.day > calendar.monthrange(y, m)[1]:
        return None
    return date(y, m, d.day)


def iter_dates(
    start: date,
    freq: str | None,
    interval: int = 1,
    until: date | None = None,
    count: int | None = None,
    byday: list[int] | None = None,
) -> Iterator[date]:
    """Alle Startdaten einer Serie (ohne Ausnahmen), aufsteigend.

    byday (nur wöchentlich): Wochentage 0=Mo … 6=So, z. B. [0, 2] = Mo und Mi.
    """
    if not freq:
        yield start
        return
    interval = max(1, int(interval or 1))
    n = 0
    produced = 0
    if freq == "weekly" and byday:
        days = sorted({int(d) for d in byday if 0 <= int(d) <= 6})
        week0 = start - timedelta(days=start.weekday())
        while n < MAX_ITER:
            monday = week0 + timedelta(weeks=n * interval)
            n += 1
            for wd in days:
                d = monday + timedelta(days=wd)
                if d < start:
                    continue
                if until and d > until:
                    return
                yield d
                produced += 1
                if count and produced >= count:
                    return
        return
    while n < MAX_ITER:
        if freq == "daily":
            d: date | None = start + timedelta(days=n * interval)
        elif freq == "weekly":
            d = start + timedelta(weeks=n * interval)
        elif freq == "monthly":
            d = _add_months(start, n * interval)
        elif freq == "yearly":
            d = _add_months(start, 12 * n * interval)
        else:
            raise ValueError(f"Unbekannte Wiederholung: {freq}")
        n += 1
        if d is None:
            continue
        if until and d > until:
            return
        yield d
        produced += 1
        if count and produced >= count:
            return


def occurrences(
    start: date,
    span_days: int,
    freq: str | None,
    range_start: date,
    range_end: date,
    interval: int = 1,
    until: date | None = None,
    exdates: set[date] | None = None,
    count: int | None = None,
    byday: list[int] | None = None,
) -> list[date]:
    """Startdaten der Vorkommen, die den Zeitraum [range_start, range_end) berühren.

    span_days: wie viele Kalendertage ein Vorkommen überspannt (mind. 1).
    """
    exdates = exdates or set()
    span = max(1, span_days)
    out: list[date] = []
    for d in iter_dates(start, freq, interval, until, count, byday):
        if d >= range_end:
            break
        if d + timedelta(days=span) <= range_start:
            continue
        if d in exdates:
            continue
        out.append(d)
    return out
