"""Übersetzungen für Texte, die im Backend entstehen (Feiertags-/Ferien-Namen, Kalendername).

Feiertage und Schulferien kommen auf Deutsch (eigene Berechnung bzw. OpenHolidays-API)
und werden hier für Englisch und Ungarisch übersetzt. Dieselbe Tabelle steht in der Karte.
"""
from __future__ import annotations

# Deutsch → (Englisch, Ungarisch)
HOLIDAY_NAMES: dict[str, tuple[str, str]] = {
    "Neujahr": ("New Year's Day", "Újév"),
    "Heilige Drei Könige": ("Epiphany", "Vízkereszt"),
    "Internationaler Frauentag": ("International Women's Day", "Nemzetközi nőnap"),
    "Karfreitag": ("Good Friday", "Nagypéntek"),
    "Ostersonntag": ("Easter Sunday", "Húsvétvasárnap"),
    "Ostermontag": ("Easter Monday", "Húsvéthétfő"),
    "Tag der Arbeit": ("Labour Day", "A munka ünnepe"),
    "Christi Himmelfahrt": ("Ascension Day", "Áldozócsütörtök"),
    "Pfingstsonntag": ("Whit Sunday", "Pünkösdvasárnap"),
    "Pfingstmontag": ("Whit Monday", "Pünkösdhétfő"),
    "Fronleichnam": ("Corpus Christi", "Úrnapja"),
    "Mariä Himmelfahrt": ("Assumption Day", "Nagyboldogasszony"),
    "Weltkindertag": ("World Children's Day", "Gyermekek világnapja"),
    "Tag der Deutschen Einheit": ("German Unity Day", "A német egység napja"),
    "Reformationstag": ("Reformation Day", "A reformáció napja"),
    "Allerheiligen": ("All Saints' Day", "Mindenszentek"),
    "Buß- und Bettag": ("Day of Repentance and Prayer", "A bűnbánat és imádság napja"),
    "1. Weihnachtsfeiertag": ("Christmas Day", "Karácsony"),
    "2. Weihnachtsfeiertag": ("Boxing Day", "Karácsony másnapja"),
    "Winterferien": ("Winter holidays", "Téli szünet"),
    "Frühjahrsferien": ("Spring holidays", "Tavaszi szünet"),
    "Faschingsferien": ("Carnival holidays", "Farsangi szünet"),
    "Fastnachtsferien": ("Carnival holidays", "Farsangi szünet"),
    "Osterferien": ("Easter holidays", "Tavaszi (húsvéti) szünet"),
    "Pfingstferien": ("Whitsun holidays", "Pünkösdi szünet"),
    "Himmelfahrtsferien": ("Ascension holidays", "Áldozócsütörtöki szünet"),
    "Sommerferien": ("Summer holidays", "Nyári szünet"),
    "Herbstferien": ("Autumn holidays", "Őszi szünet"),
    "Weihnachtsferien": ("Christmas holidays", "Téli (karácsonyi) szünet"),
    "Beweglicher Ferientag": ("Flexible school holiday", "Változó szünnap"),
    "Bewegliche Ferientage": ("Flexible school holidays", "Változó szünnapok"),
    "Unterrichtsfreier Tag": ("No-school day", "Tanítási szünnap"),
    "Brückentag": ("Bridge day", "Hídnap"),
    "Himmelfahrt": ("Ascension Day", "Áldozócsütörtök"),
    "Ferien": ("School holidays", "Iskolai szünet"),
}

CALENDAR_NAME = {"de": "Familienkalender", "en": "Family calendar", "hu": "Családi naptár"}


def tr_name(name: str, lang: str | None) -> str:
    """Feiertags-/Ferien-Namen übersetzen; unbekannte Ferien-Namen erhalten einen allgemeinen Namen."""
    lang = (lang or "de")[:2].lower()
    if lang not in ("en", "hu") or not name:
        return name
    idx = 0 if lang == "en" else 1
    if name in HOLIDAY_NAMES:
        return HOLIDAY_NAMES[name][idx]
    # längster passender Anfang zuerst (z. B. „Herbstferien Bayern“)
    for key in sorted(HOLIDAY_NAMES, key=len, reverse=True):
        if name.startswith(key):
            return HOLIDAY_NAMES[key][idx] + name[len(key):]
    low = name.lower()
    if "ferientag" in low:
        return HOLIDAY_NAMES["Beweglicher Ferientag"][idx]
    if "ferien" in low:
        return HOLIDAY_NAMES["Ferien"][idx]
    if "unterrichtsfrei" in low:
        return HOLIDAY_NAMES["Unterrichtsfreier Tag"][idx]
    return name
