/*
 * Familienkalender – Dashboard-Karte für Home Assistant
 * Eigenständig, keine externen Abhängigkeiten.
 */
(() => {
const FK_CARD_VERSION = "1.7.0";

/* ---------- Sprachen: Deutsch (Standard), Ungarisch, Englisch ---------- */
const I18N = {
  de: {
    wd: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    wdLong: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    monthsShort: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."],
    monthTitle: (m, y) => `${m} ${y}`,
    longDate: (wd, d, m, y) => `${wd}, ${d}. ${m} ${y}`,
    shortDate: (wd, d, ms) => `${wd}, ${d}. ${ms}`,
    dayTitle: (d, m) => `${d}. ${m}`,
    span: (a, b, y) => `${a} – ${b} ${y}`,
    kw: (n) => `KW ${n}`,
    list: "Übersicht", listMonths: ["1 Monat", "3 Monate", "6 Monate", "1 Jahr"], listEmpty: "Keine Termine in diesem Zeitraum.",
    nEvents: (n) => n === 1 ? "1 Termin" : `${n} Termine`, listUntil: (d) => `bis ${d.getDate()}.${d.getMonth() + 1}.`,
    search: "Suchen", searchPh: "Termine suchen …", searchClose: "Suche schließen", searchMin: "Mindestens 2 Zeichen eingeben.",
    searchScope: "Durchsucht Titel, Ort, Notiz und Personen – 12 Monate zurück und voraus.",
    upcoming: "Kommende Termine", past: "Vergangene Termine", noHits: "Keine Treffer.", searching: "Suche …",
    rangeN: (n) => n === 1 ? "1 Tag markiert" : `${n} Tage markiert`, rangeClear: "Markierung aufheben",
    uhr: " Uhr", locale: "de-DE", q: (t) => `„${t}“`,
    household: "Haushalt", editQ: "Was möchtest du ändern?", editOnly: "Nur diesen Termin", editSeries: "Ganze Serie",
    occNote: "Nur dieser eine Termin wird geändert – die übrige Serie bleibt unverändert.", duplicate: "Duplizieren",
    undo: "Rückgängig", restored: "Wiederhergestellt", moved: "Termin verschoben", moveQ: "Wiederkehrenden Termin verschieben?",
    birthYear: "Geburtsjahr (optional – zeigt das Alter an)", turns: (n) => `wird ${n}`, dragHint: "Zum Verschieben gedrückt halten und ziehen",
    today: "Heute", jumpTitle: "Zu Datum springen", enterDate: "oder Datum eingeben:", month: "Monat", week: "Woche", day: "Tag", event: "Termin", newEvent: "Neuer Termin", editEvent: "Termin bearbeiten",
    prev: "Zurück", next: "Weiter", more: "Mehr", show: "Einblenden", hide: "Ausblenden",
    holidays: "Feiertage", ferien: "Ferien", readOnly: "Nur lesen", readOnlyTip: "Du kannst Termine ansehen, aber nicht ändern.",
    moreN: (n) => `+${n} weitere`, alldayShort: "ganzt.", alldayAgenda: "ganzer<br>Tag", alldayDetail: "ganztägig",
    noEvents: "Keine Termine", noEventsAdd: "Keine Termine – tippe auf ＋ für einen neuen.", recurring: "Wiederkehrend",
    whoTitle: "Für wen ist der Termin?", whoHint: "Tippe eine oder mehrere Personen an.", everyone: "Alle",
    cancel: "Abbrechen", cont: "Weiter", save: "Speichern", del: "Löschen", edit: "Bearbeiten", close: "Schließen",
    seriesNote: "↻ Wiederkehrender Termin – Änderungen gelten für die ganze Serie.", titlePh: "Titel, z. B. Zahnarzt",
    forWho: "Für", allDay: "Ganztägig", start: "Beginn", end: "Ende", repeat: "Wiederholung",
    untilTip: "Endet am (leer = unbegrenzt)", untilHint: "Rechts: Wiederholung endet am (leer = unbegrenzt)",
    freqs: ["Keine", "Täglich", "Wöchentlich", "Monatlich", "Jährlich"],
    reminder: "Erinnerung (Push)", rem: ["Zum Beginn", "5 Min.", "15 Min.", "30 Min.", "1 Std.", "2 Std.", "1 Tag", "2 Tage", "1 Woche"], remOnDay: "Am Tag",
    remList: ["zu Beginn", "5 Min. vorher", "15 Min. vorher", "30 Min. vorher", "1 Std. vorher", "2 Std. vorher", "1 Tag vorher", "2 Tage vorher", "1 Woche vorher"], remListDay: "am Tag",
    until: (d) => `bis ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`,
    location: "Ort", notes: "Notiz", optional: "optional",
    delQ: "Termin löschen?", delRec: (t) => `„${t}“ ist ein wiederkehrender Termin.`, delFinal: (t) => `„${t}“ wird endgültig gelöscht.`,
    onlyThis: "Nur diesen", wholeSeries: "Ganze Serie",
    importTitle: "Termine importieren", importHint: "Wähle eine .ics-Datei (z. B. aus Google, Outlook oder Apple Kalender) und für wen die Termine eingetragen werden.",
    importBtn: "Importieren", importing: "Importiere…", importMenu: "Termine importieren (ICS)", exportMenu: "Termine exportieren (ICS)",
    exportTitle: "Termine exportieren", exportHint: "Erstellt eine .ics-Datei, die du in andere Kalender importieren kannst.", exportFrom: "Termine von", download: "Herunterladen",
    errTitle: "Bitte einen Titel eingeben.", errPerson: "Bitte mindestens eine Person wählen.", errDate: "Bitte ein Datum wählen.", errFile: "Bitte eine Datei wählen.",
    created: "Termin erstellt", saved: "Termin gespeichert", deleted: "Termin gelöscht", imported: (n) => `${n} Termin(e) importiert`,
    loadFail: "Termine konnten nicht geladen werden", saveFail: "Speichern fehlgeschlagen", deleteFail: "Löschen fehlgeschlagen",
    importFail: "Import fehlgeschlagen", exportFail: "Export fehlgeschlagen",
    notSetup: "Die Integration „Familienkalender“ ist nicht eingerichtet oder nicht erreichbar.",
    srv: {
      unauthorized: "Dafür hast du keine Berechtigung. Bitte wende dich an den Admin.", title: "Bitte einen Titel angeben.",
      person: "Bitte mindestens eine Person wählen.", date: "Ungültiges Datum oder ungültige Uhrzeit.", recurrence: "Ungültige Wiederholung.",
      recurrence_end: "Die Wiederholung endet vor dem ersten Termin.", gone: "Der Termin existiert nicht mehr.", range: "Ungültiger Zeitraum.",
      not_setup: "Der Familienkalender ist nicht eingerichtet.", ics_invalid: "Das ist keine gültige ICS-Datei.",
      ics_too_big: "Die Datei ist zu groß (max. 3 MB).", ics_too_many: "Die Datei enthält zu viele Termine.", invalid: "Ungültige Eingabe.",
      birth_year: "Ungültiges Geburtsjahr.",
    },
  },
  en: {
    wd: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    wdLong: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthTitle: (m, y) => `${m} ${y}`,
    longDate: (wd, d, m, y) => `${wd}, ${d} ${m} ${y}`,
    shortDate: (wd, d, ms) => `${wd}, ${d} ${ms}`,
    dayTitle: (d, m) => `${d} ${m}`,
    span: (a, b, y) => `${a} – ${b} ${y}`,
    kw: (n) => `Week ${n}`,
    list: "Overview", listMonths: ["1 month", "3 months", "6 months", "1 year"], listEmpty: "No events in this period.",
    nEvents: (n) => n === 1 ? "1 event" : `${n} events`, listUntil: (d) => `until ${d.getDate()} ${I18N.en.monthsShort[d.getMonth()]}`,
    search: "Search", searchPh: "Search events …", searchClose: "Close search", searchMin: "Type at least 2 characters.",
    searchScope: "Searches title, location, notes and people – 12 months back and ahead.",
    upcoming: "Upcoming", past: "Past", noHits: "No matches.", searching: "Searching …",
    rangeN: (n) => n === 1 ? "1 day selected" : `${n} days selected`, rangeClear: "Clear selection",
    uhr: "", locale: "en-GB", q: (t) => `“${t}”`,
    household: "Household", editQ: "What would you like to change?", editOnly: "Only this event", editSeries: "Whole series",
    occNote: "Only this one event will be changed – the rest of the series stays as it is.", duplicate: "Duplicate",
    undo: "Undo", restored: "Restored", moved: "Event moved", moveQ: "Move recurring event?",
    birthYear: "Year of birth (optional – shows the age)", turns: (n) => `turns ${n}`, dragHint: "Press and hold, then drag to move",
    today: "Today", jumpTitle: "Go to date", enterDate: "or enter a date:", month: "Month", week: "Week", day: "Day", event: "Event", newEvent: "New event", editEvent: "Edit event",
    prev: "Previous", next: "Next", more: "More", show: "Show", hide: "Hide",
    holidays: "Holidays", ferien: "School holidays", readOnly: "Read only", readOnlyTip: "You can view events but not change them.",
    moreN: (n) => `+${n} more`, alldayShort: "all day", alldayAgenda: "all<br>day", alldayDetail: "all day",
    noEvents: "No events", noEventsAdd: "No events – tap ＋ to add one.", recurring: "Recurring",
    whoTitle: "Who is this event for?", whoHint: "Tap one or more people.", everyone: "Everyone",
    cancel: "Cancel", cont: "Next", save: "Save", del: "Delete", edit: "Edit", close: "Close",
    seriesNote: "↻ Recurring event – changes apply to the whole series.", titlePh: "Title, e.g. Dentist",
    forWho: "For", allDay: "All day", start: "Start", end: "End", repeat: "Repeat",
    untilTip: "Ends on (empty = forever)", untilHint: "Right: repeat ends on (empty = forever)",
    freqs: ["None", "Daily", "Weekly", "Monthly", "Yearly"],
    reminder: "Reminder (push)", rem: ["At start", "5 min", "15 min", "30 min", "1 hour", "2 hours", "1 day", "2 days", "1 week"], remOnDay: "On the day",
    remList: ["at start", "5 min before", "15 min before", "30 min before", "1 hour before", "2 hours before", "1 day before", "2 days before", "1 week before"], remListDay: "on the day",
    until: (d) => `until ${d.getDate()} ${I18N.en.months[d.getMonth()]} ${d.getFullYear()}`,
    location: "Location", notes: "Notes", optional: "optional",
    delQ: "Delete event?", delRec: (t) => `“${t}” is a recurring event.`, delFinal: (t) => `“${t}” will be permanently deleted.`,
    onlyThis: "Only this one", wholeSeries: "Whole series",
    importTitle: "Import events", importHint: "Choose an .ics file (e.g. from Google, Outlook or Apple Calendar) and who the events are for.",
    importBtn: "Import", importing: "Importing…", importMenu: "Import events (ICS)", exportMenu: "Export events (ICS)",
    exportTitle: "Export events", exportHint: "Creates an .ics file you can import into other calendars.", exportFrom: "Events of", download: "Download",
    errTitle: "Please enter a title.", errPerson: "Please choose at least one person.", errDate: "Please choose a date.", errFile: "Please choose a file.",
    created: "Event created", saved: "Event saved", deleted: "Event deleted", imported: (n) => `${n} event(s) imported`,
    loadFail: "Could not load events", saveFail: "Saving failed", deleteFail: "Deleting failed", importFail: "Import failed", exportFail: "Export failed",
    notSetup: "The “Family calendar” integration is not set up or not reachable.",
    srv: {
      unauthorized: "You don't have permission for this. Please contact the admin.", title: "Please enter a title.",
      person: "Please choose at least one person.", date: "Invalid date or time.", recurrence: "Invalid repeat setting.",
      recurrence_end: "The repeat ends before the first event.", gone: "This event no longer exists.", range: "Invalid time range.",
      not_setup: "The family calendar is not set up.", ics_invalid: "This is not a valid ICS file.",
      ics_too_big: "The file is too large (max. 3 MB).", ics_too_many: "The file contains too many events.", invalid: "Invalid input.",
      birth_year: "Invalid year of birth.",
    },
  },
  hu: {
    wd: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
    wdLong: ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"],
    months: ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"],
    monthsShort: ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."],
    monthTitle: (m, y) => `${y}. ${m}`,
    longDate: (wd, d, m, y) => `${y}. ${m} ${d}., ${wd}`,
    shortDate: (wd, d, ms) => `${ms} ${d}., ${wd}`,
    dayTitle: (d, m) => `${m} ${d}.`,
    span: (a, b, y) => `${y}. ${a} – ${b}`,
    kw: (n) => `${n}. hét`,
    list: "Áttekintés", listMonths: ["1 hónap", "3 hónap", "6 hónap", "1 év"], listEmpty: "Ebben az időszakban nincs esemény.",
    nEvents: (n) => `${n} esemény`, listUntil: (d) => `${I18N.hu.monthsShort[d.getMonth()]} ${d.getDate()}-ig`,
    search: "Keresés", searchPh: "Események keresése …", searchClose: "Keresés bezárása", searchMin: "Írj be legalább 2 karaktert.",
    searchScope: "Cím, helyszín, megjegyzés és személyek – 12 hónapra visszamenőleg és előre.",
    upcoming: "Közelgő események", past: "Korábbi események", noHits: "Nincs találat.", searching: "Keresés …",
    rangeN: (n) => `${n} nap kijelölve`, rangeClear: "Kijelölés megszüntetése",
    uhr: "", locale: "hu-HU", q: (t) => `„${t}”`,
    household: "Háztartás", editQ: "Mit szeretnél módosítani?", editOnly: "Csak ezt az eseményt", editSeries: "Teljes sorozat",
    occNote: "Csak ez az egy esemény módosul – a sorozat többi része változatlan marad.", duplicate: "Duplikálás",
    undo: "Visszavonás", restored: "Visszaállítva", moved: "Esemény áthelyezve", moveQ: "Áthelyezed az ismétlődő eseményt?",
    birthYear: "Születési év (nem kötelező – mutatja az életkort)", turns: (n) => `${n} éves lesz`, dragHint: "Tartsd lenyomva, majd húzd az áthelyezéshez",
    today: "Ma", jumpTitle: "Ugrás dátumra", enterDate: "vagy add meg a dátumot:", month: "Hónap", week: "Hét", day: "Nap", event: "Esemény", newEvent: "Új esemény", editEvent: "Esemény szerkesztése",
    prev: "Előző", next: "Következő", more: "Továbbiak", show: "Megjelenítés", hide: "Elrejtés",
    holidays: "Ünnepnapok", ferien: "Iskolai szünet", readOnly: "Csak olvasás", readOnlyTip: "Az eseményeket megtekintheted, de nem módosíthatod.",
    moreN: (n) => `+${n} további`, alldayShort: "egész nap", alldayAgenda: "egész<br>nap", alldayDetail: "egész napos",
    noEvents: "Nincs esemény", noEventsAdd: "Nincs esemény – koppints a ＋ gombra új hozzáadásához.", recurring: "Ismétlődő",
    whoTitle: "Kinek szól az esemény?", whoHint: "Válassz ki egy vagy több személyt.", everyone: "Mindenki",
    cancel: "Mégse", cont: "Tovább", save: "Mentés", del: "Törlés", edit: "Szerkesztés", close: "Bezárás",
    seriesNote: "↻ Ismétlődő esemény – a módosítások az egész sorozatra vonatkoznak.", titlePh: "Cím, pl. Fogorvos",
    forWho: "Kinek", allDay: "Egész napos", start: "Kezdés", end: "Befejezés", repeat: "Ismétlés",
    untilTip: "Vége (üres = korlátlan)", untilHint: "Jobb oldalt: az ismétlés vége (üres = korlátlan)",
    freqs: ["Nincs", "Naponta", "Hetente", "Havonta", "Évente"],
    reminder: "Emlékeztető (push)", rem: ["Kezdéskor", "5 perc", "15 perc", "30 perc", "1 óra", "2 óra", "1 nap", "2 nap", "1 hét"], remOnDay: "Az adott napon",
    remList: ["kezdéskor", "5 perccel előtte", "15 perccel előtte", "30 perccel előtte", "1 órával előtte", "2 órával előtte", "1 nappal előtte", "2 nappal előtte", "1 héttel előtte"], remListDay: "az adott napon",
    until: (d) => `${d.getFullYear()}. ${I18N.hu.months[d.getMonth()]} ${d.getDate()}-ig`,
    location: "Helyszín", notes: "Megjegyzés", optional: "nem kötelező",
    delQ: "Törlöd az eseményt?", delRec: (t) => `„${t}” egy ismétlődő esemény.`, delFinal: (t) => `„${t}” véglegesen törlődik.`,
    onlyThis: "Csak ezt", wholeSeries: "Teljes sorozat",
    importTitle: "Események importálása", importHint: "Válassz egy .ics fájlt (pl. Google, Outlook vagy Apple Naptárból), és add meg, kinek szólnak az események.",
    importBtn: "Importálás", importing: "Importálás…", importMenu: "Események importálása (ICS)", exportMenu: "Események exportálása (ICS)",
    exportTitle: "Események exportálása", exportHint: "Létrehoz egy .ics fájlt, amelyet más naptárakba importálhatsz.", exportFrom: "Kinek az eseményei", download: "Letöltés",
    errTitle: "Adj meg egy címet.", errPerson: "Válassz ki legalább egy személyt.", errDate: "Válassz dátumot.", errFile: "Válassz egy fájlt.",
    created: "Esemény létrehozva", saved: "Esemény mentve", deleted: "Esemény törölve", imported: (n) => `${n} esemény importálva`,
    loadFail: "Az eseményeket nem sikerült betölteni", saveFail: "A mentés nem sikerült", deleteFail: "A törlés nem sikerült",
    importFail: "Az importálás nem sikerült", exportFail: "Az exportálás nem sikerült",
    notSetup: "A „Családi naptár” integráció nincs beállítva vagy nem érhető el.",
    srv: {
      unauthorized: "Ehhez nincs jogosultságod. Fordulj az adminisztrátorhoz.", title: "Adj meg egy címet.",
      person: "Válassz ki legalább egy személyt.", date: "Érvénytelen dátum vagy időpont.", recurrence: "Érvénytelen ismétlés.",
      recurrence_end: "Az ismétlés az első esemény előtt ér véget.", gone: "Ez az esemény már nem létezik.", range: "Érvénytelen időszak.",
      not_setup: "A családi naptár nincs beállítva.", ics_invalid: "Ez nem érvényes ICS fájl.",
      ics_too_big: "A fájl túl nagy (max. 3 MB).", ics_too_many: "A fájl túl sok eseményt tartalmaz.", invalid: "Érvénytelen adat.",
      birth_year: "Érvénytelen születési év.",
    },
  },
};

/* Feiertage und Ferien kommen auf Deutsch – hier übersetzt */
const HOLIDAY_NAMES = {
  "Neujahr": ["New Year's Day", "Újév"],
  "Heilige Drei Könige": ["Epiphany", "Vízkereszt"],
  "Internationaler Frauentag": ["International Women's Day", "Nemzetközi nőnap"],
  "Karfreitag": ["Good Friday", "Nagypéntek"],
  "Ostersonntag": ["Easter Sunday", "Húsvétvasárnap"],
  "Ostermontag": ["Easter Monday", "Húsvéthétfő"],
  "Tag der Arbeit": ["Labour Day", "A munka ünnepe"],
  "Christi Himmelfahrt": ["Ascension Day", "Áldozócsütörtök"],
  "Pfingstsonntag": ["Whit Sunday", "Pünkösdvasárnap"],
  "Pfingstmontag": ["Whit Monday", "Pünkösdhétfő"],
  "Fronleichnam": ["Corpus Christi", "Úrnapja"],
  "Mariä Himmelfahrt": ["Assumption Day", "Nagyboldogasszony"],
  "Weltkindertag": ["World Children's Day", "Gyermekek világnapja"],
  "Tag der Deutschen Einheit": ["German Unity Day", "A német egység napja"],
  "Reformationstag": ["Reformation Day", "A reformáció napja"],
  "Allerheiligen": ["All Saints' Day", "Mindenszentek"],
  "Buß- und Bettag": ["Day of Repentance and Prayer", "A bűnbánat és imádság napja"],
  "1. Weihnachtsfeiertag": ["Christmas Day", "Karácsony"],
  "2. Weihnachtsfeiertag": ["Boxing Day", "Karácsony másnapja"],
  "Winterferien": ["Winter holidays", "Téli szünet"],
  "Frühjahrsferien": ["Spring holidays", "Tavaszi szünet"],
  "Faschingsferien": ["Carnival holidays", "Farsangi szünet"],
  "Fastnachtsferien": ["Carnival holidays", "Farsangi szünet"],
  "Osterferien": ["Easter holidays", "Tavaszi (húsvéti) szünet"],
  "Pfingstferien": ["Whitsun holidays", "Pünkösdi szünet"],
  "Himmelfahrtsferien": ["Ascension holidays", "Áldozócsütörtöki szünet"],
  "Sommerferien": ["Summer holidays", "Nyári szünet"],
  "Herbstferien": ["Autumn holidays", "Őszi szünet"],
  "Weihnachtsferien": ["Christmas holidays", "Téli (karácsonyi) szünet"],
  "Beweglicher Ferientag": ["Flexible school holiday", "Változó szünnap"],
  "Bewegliche Ferientage": ["Flexible school holidays", "Változó szünnapok"],
  "Unterrichtsfreier Tag": ["No-school day", "Tanítási szünnap"],
  "Brückentag": ["Bridge day", "Hídnap"],
  "Himmelfahrt": ["Ascension Day", "Áldozócsütörtök"],
  "Ferien": ["School holidays", "Iskolai szünet"],
};

let LANG = "de";
let T = I18N.de;
const pickLang = (cfgLang, hass) => {
  const cands = [cfgLang, hass?.locale?.language, hass?.language, hass?.selectedLanguage, navigator.language];
  for (const c of cands) {
    const k = String(c || "").toLowerCase().slice(0, 2);
    if (I18N[k]) return k;
    if (c) break; // gesetzte, aber nicht unterstützte Sprache → Deutsch
  }
  return "de";
};
const setLang = (l) => { LANG = I18N[l] ? l : "de"; T = I18N[LANG]; };
const trName = (n) => {
  if (LANG === "de" || !n) return n;
  const idx = LANG === "en" ? 0 : 1;
  if (HOLIDAY_NAMES[n]) return HOLIDAY_NAMES[n][idx];
  const keys = Object.keys(HOLIDAY_NAMES).sort((a, b) => b.length - a.length);
  for (const k of keys) if (n.startsWith(k)) return HOLIDAY_NAMES[k][idx] + n.slice(k.length);
  const low = n.toLowerCase();
  if (low.includes("ferientag")) return HOLIDAY_NAMES["Beweglicher Ferientag"][idx];
  if (low.includes("ferien")) return HOLIDAY_NAMES["Ferien"][idx];
  if (low.includes("unterrichtsfrei")) return HOLIDAY_NAMES["Unterrichtsfreier Tag"][idx];
  return n;
};
const REMINDER_MIN = [0, 5, 15, 30, 60, 120, 1440, 2880, 10080];
const FREQ_KEYS = ["", "daily", "weekly", "monthly", "yearly"];

/* ---------- Hilfsfunktionen ---------- */
// Kürzel: erste zwei Buchstaben, z. B. „Papa“ → „Pa“ (Umlaute/Akzente bleiben erhalten)
const initials = (name) => {
  const ch = Array.from(String(name || "?").trim().replace(/\s+/g, ""));
  return (ch[0] || "?").toLocaleUpperCase() + (ch[1] || "").toLocaleLowerCase();
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sow = (d) => addDays(sod(d), -((d.getDay() + 6) % 7));
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isoWeek = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
};
const localIso = (d) => {
  const off = -d.getTimezoneOffset();
  const s = off >= 0 ? "+" : "-";
  return `${ymd(d)}T${hm(d)}:00${s}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
};
const hexRgb = (hex) => {
  const h = (hex || "#888888").replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
/* Farbe (beliebiges CSS-Format, auch halbtransparent) deckend auf Untergrund mischen → "rgb(r,g,b)" */
let _fkCtx = null;
const flatten = (fg, bg) => {
  try {
    if (!_fkCtx) { const c = document.createElement("canvas"); c.width = c.height = 1; _fkCtx = c.getContext("2d", { willReadFrequently: true }); }
    const x = _fkCtx; x.globalAlpha = 1; x.clearRect(0, 0, 1, 1);
    x.fillStyle = "#fff"; x.fillStyle = bg || "#fff"; x.fillRect(0, 0, 1, 1);
    if (fg) { x.fillStyle = "rgba(0,0,0,0)"; x.fillStyle = fg; x.fillRect(0, 0, 1, 1); }
    const d = x.getImageData(0, 0, 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  } catch (e) { return bg || "#fff"; }
};
const mixOn = (hex, a, base) => {
  const [r, g, b] = hexRgb(hex);
  const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(base || "") || [0, 255, 255, 255];
  return `rgb(${Math.round(r * a + m[1] * (1 - a))},${Math.round(g * a + m[2] * (1 - a))},${Math.round(b * a + m[3] * (1 - a))})`;
};
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const textOn = (hex) => {
  const [r, g, b] = hexRgb(hex).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#1c1c1c" : "#ffffff";
};
const longDate = (d) => T.longDate(T.wdLong[(d.getDay() + 6) % 7], d.getDate(), T.months[d.getMonth()], d.getFullYear());

/* ---------- Styles ---------- */
const STYLE = `
:host { display:block; --fk-radius:12px; --fk-hour:52px; --fk-red:#d93025; --fk-ferien-strong:#2e9e5a;
    --fk-ferien:rgba(46,160,90,.09); --fk-ferien-other:rgba(46,160,90,.09); --fk-band:rgba(46,158,90,.55); --fk-dim:var(--secondary-text-color,#9e9e9e); }
/* Optional (Wandtablet → „Deckende Farben“): alle Flächen deckend, per JS aus dem Theme berechnet.
   Halbtransparente Farben erzeugen auf manchen Android-Tablets (Mali-GPU, Fully Kiosk) hellere Kästchen. */

* { box-sizing:border-box; }
.card { overflow:clip; }
.card { background:var(--fk-bg, var(--ha-card-background, var(--card-background-color, #fff))); color:var(--primary-text-color, #212121);
  border-radius:var(--ha-card-border-radius, 12px); box-shadow:var(--ha-card-box-shadow, none);
  border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color, var(--fk-line, var(--divider-color,#e0e0e0)));
  font-family:var(--paper-font-body1_-_font-family, var(--ha-font-family-body, Roboto, "Segoe UI", sans-serif)); position:relative; }
button { font:inherit; color:inherit; cursor:pointer; }
/* Kopfzeile */
.top { display:flex; align-items:center; gap:12px; padding:14px 16px 8px; flex-wrap:wrap; }
.nav { display:flex; align-items:center; gap:4px; }
.icon-btn { width:38px; height:38px; border-radius:50%; border:none; background:transparent; display:inline-flex; align-items:center; justify-content:center; }
.icon-btn:hover { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.icon-btn svg { width:22px; height:22px; fill:currentColor; }
.today-btn { border:1px solid var(--fk-line, var(--divider-color,#ddd)); background:transparent; border-radius:20px; padding:6px 14px; font-size:14px; }
.today-btn:hover { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.title { font-size:22px; font-weight:500; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.title .tshort { display:none; }
.title small { color:var(--secondary-text-color,#727272); font-size:14px; font-weight:400; margin-left:8px; }
.seg { display:inline-flex; border:1px solid var(--fk-line, var(--divider-color,#ddd)); border-radius:20px; overflow:hidden; }
.seg button { border:none; background:transparent; padding:7px 16px; font-size:14px; }
.seg button + button { border-left:1px solid var(--fk-line, var(--divider-color,#ddd)); }
.seg button.on { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.add-top { border:none; background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); border-radius:20px; padding:8px 16px 8px 12px; font-size:14px; font-weight:500; display:inline-flex; align-items:center; gap:6px; }
.ro { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--secondary-text-color,#777); padding:6px 12px; border-radius:16px; background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.ro svg { width:16px; height:16px; fill:currentColor; }
.narrow .ro { order:2; padding:8px; }
.narrow .ro span { display:none; }
.add-top svg { width:20px; height:20px; fill:currentColor; }
/* Personen-Leiste */
.chips { display:flex; gap:8px; padding:4px 16px 12px; overflow-x:auto; scrollbar-width:none; }
.chips::-webkit-scrollbar { display:none; }
.chip { display:inline-flex; align-items:center; gap:7px; padding:5px 12px 5px 6px; border-radius:18px; font-size:14px; white-space:nowrap;
  border:1px solid var(--fk-line, var(--divider-color,#ddd)); background:transparent; }
.chip .dot { min-width:24px; height:20px; padding:0 4px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; letter-spacing:.02em; }
.chip.off { opacity:.45; }
.solid .tev .t, .solid .age { opacity:1; }
.solid .chip.off { opacity:1; color:var(--secondary-text-color,#888); border-style:dashed; }
.chip.off .dot { background:transparent !important; border:2px solid currentColor; color:inherit !important; }
.chip.extra .dot { border-radius:5px; }
/* Monat */
.month { display:grid; border-top:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); }
.month.wk { grid-template-columns:34px repeat(7, 1fr); }
.month.nowk { grid-template-columns:repeat(7, 1fr); }
.mh { text-align:center; font-size:12px; font-weight:500; color:var(--secondary-text-color,#727272); padding:8px 0 6px; text-transform:uppercase; letter-spacing:.04em; }
.kw { font-size:11px; color:var(--secondary-text-color,#999); text-align:center; padding-top:9px; border-bottom:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); }
.cell { min-height:118px; border-left:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); border-bottom:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); padding:4px 4px 6px; cursor:pointer; min-width:0; position:relative; }
.month.nowk .cell:nth-child(7n+8) { border-left:none; }
.cell.other { background:var(--fk-bg2, var(--secondary-background-color, rgba(0,0,0,.025))); }
.cell.other .dnum { opacity:.45; }
.solid .cell.other .dnum { opacity:1; color:var(--fk-dim); }
.cell.ferien { background-image:linear-gradient(var(--fk-ferien), var(--fk-ferien)); }
.solid .cell.other.ferien { background-image:linear-gradient(var(--fk-ferien-other), var(--fk-ferien-other)); }
.cell.sel { box-shadow:inset 0 0 0 2px var(--primary-color,#03a9f4); }
/* Mehrere Tage markieren */
[data-rd] { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
.cell.rng::after, .tg-head .rng::after { content:""; position:absolute; inset:0; background:var(--primary-color,#03a9f4); opacity:.14; pointer-events:none; }
.tg-head > div { position:relative; }
.cell.rng.rs { box-shadow:inset 3px 0 0 var(--primary-color,#03a9f4); }
.cell.rng.re { box-shadow:inset -3px 0 0 var(--primary-color,#03a9f4); }
.cell.rng.rs.re { box-shadow:inset 3px 0 0 var(--primary-color,#03a9f4), inset -3px 0 0 var(--primary-color,#03a9f4); }
.rngbar { display:inline-flex; align-items:center; gap:4px; flex:none; padding:0 4px 0 12px; height:32px; border-radius:16px; font-size:13.5px; font-weight:500;
  background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); white-space:nowrap; }
.rngbar button { all:unset; cursor:pointer; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; }
.rngbar button:hover { background:rgba(255,255,255,.2); }
.chead { display:flex; align-items:center; gap:4px; min-height:26px; }
.dnum { width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:500; flex:none; }
.cell.we .dnum { color:var(--secondary-text-color,#727272); }
.cell.hol .dnum { color:var(--fk-red); }
.cell.today .dnum { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.hname { font-size:11px; color:var(--fk-red); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.flabel.in { margin:0 0 0 2px !important; }
/* Monat (breit): Wochenzeilen; mehrtägige Termine und Ferien als durchgehende Balken (keine Nähte an Zellgrenzen) */
.month.mw { display:block; }
.mrow { display:grid; position:relative; }
.mw.wk .mrow { grid-template-columns:34px repeat(7, minmax(0, 1fr)); }
.mw.nowk .mrow { grid-template-columns:repeat(7, minmax(0, 1fr)); }
.mw.nowk .mrow > .cell:first-child { border-left:none; }
.mrow .bars { position:absolute; left:0; right:0; top:31px; display:grid; grid-template-columns:inherit; grid-auto-rows:20px; row-gap:2px; pointer-events:none; z-index:1; }
.mrow .fbands, .tg-all .fbands { position:absolute; left:0; right:0; top:0; height:3px; display:grid; grid-template-columns:inherit; pointer-events:none; }
.fband { background:var(--fk-band); }
.bar { pointer-events:auto; margin:0 4px; border-radius:6px; padding:0 7px; font-size:12.5px; font-weight:500; line-height:20px; height:20px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
.bar.cl { margin-left:0; border-top-left-radius:0; border-bottom-left-radius:0; }
.bar.cr { margin-right:0; border-top-right-radius:0; border-bottom-right-radius:0; }
.tg-all { position:relative; }
.tg-all .bars { position:absolute; left:0; right:0; top:3px; display:grid; grid-template-columns:inherit; grid-auto-rows:20px; row-gap:2px; pointer-events:none; }
.flabel { font-size:10.5px; color:var(--fk-ferien-strong); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:-2px 0 2px 4px; }
.ev { display:flex; align-items:center; gap:5px; font-size:12.5px; line-height:1.25; padding:2px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; overflow:hidden; cursor:pointer; }
@media (hover:hover) and (pointer:fine) { .ev:hover, .bar:hover { filter:brightness(.96); } }
.ev .t { font-variant-numeric:tabular-nums; color:var(--secondary-text-color,#666); flex:none; }
.ev .n { overflow:hidden; text-overflow:ellipsis; }
.ev.timed:hover { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.ev.allday { font-weight:500; }
.ev.cont-l { border-top-left-radius:0; border-bottom-left-radius:0; margin-left:-5px; padding-left:11px; }
.ev.cont-r { border-top-right-radius:0; border-bottom-right-radius:0; margin-right:-5px; }
.ev.cont-r { overflow:visible; }
.ev.cont-r .n { position:relative; z-index:2; overflow:visible; }
.dots { display:inline-flex; gap:2px; flex:none; }
.dots i { width:8px; height:8px; border-radius:50%; display:block; }
.more { font-size:12px; color:var(--secondary-text-color,#666); padding:2px 6px; font-weight:500; }
.more:hover { text-decoration:underline; }
/* Mobile Monat */
.narrow .cell { min-height:56px; padding:3px 1px; text-align:center; }
.narrow .chead { justify-content:center; }
.narrow .mdots { display:flex; justify-content:center; gap:3px; flex-wrap:wrap; padding:0 2px; }
.narrow .mdots i { width:7px; height:7px; border-radius:50%; display:block; }
.narrow .mdots b { font-size:9px; color:var(--secondary-text-color,#888); line-height:7px; }
/* Agenda */
.agenda { padding:6px 12px 90px; }
.ag-day { padding:14px 4px 4px; font-size:13px; font-weight:600; color:var(--secondary-text-color,#666); display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
.ag-day.today { color:var(--primary-color,#03a9f4); }
.ag-day .hn { color:var(--fk-red); font-weight:500; }
.ag-day .fn { color:var(--fk-ferien-strong); font-weight:500; }
.ag-item { display:flex; gap:12px; align-items:stretch; padding:10px 12px; border-radius:var(--fk-radius); margin-top:6px; cursor:pointer;
  background:var(--fk-bg2, var(--secondary-background-color,#f6f6f6)); }
.ag-item .bar { width:5px; border-radius:3px; flex:none; }
.ag-item .when { width:52px; flex:none; font-size:13px; font-variant-numeric:tabular-nums; color:var(--secondary-text-color,#666); line-height:1.35; }
.ag-item .what { flex:1; min-width:0; }
.ag-item .what .n { font-size:15px; font-weight:500; overflow:hidden; text-overflow:ellipsis; }
.ag-item .what .m { font-size:12.5px; color:var(--secondary-text-color,#777); margin-top:3px; display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
.tag { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; padding:1px 8px 1px 3px; border-radius:10px; background:var(--fk-bg, var(--card-background-color,#fff)); }
.tag i { width:10px; height:10px; border-radius:50%; display:block; }
.empty { padding:18px 6px; color:var(--secondary-text-color,#888); font-size:14px; }
/* Zeitraster */
.tg { border-top:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); }
.tg-head, .tg-all, .tg-body { display:grid; }
.tg-head > div { text-align:center; padding:8px 2px 6px; min-width:0; }
.tg-head .wd { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--secondary-text-color,#727272); font-weight:500; }
.tg-head .dn { font-size:22px; font-weight:400; width:40px; height:40px; line-height:40px; border-radius:50%; margin:2px auto 0; cursor:pointer; }
.tg-head .today .dn { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.tg-head .today .wd { color:var(--primary-color,#03a9f4); }
.tg-head .hol .dn, .tg-head .hol .wd { color:var(--fk-red); }
.tg-head .hn { font-size:10.5px; color:var(--fk-red); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 2px; }
.tg-head .fn { font-size:10.5px; color:var(--fk-ferien-strong); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tg-all { border-bottom:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); }
.tg-all > div { padding:2px 2px 4px; min-width:0; border-left:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); }
.tg-all > .bars, .tg-all > .fbands { padding:0; border-left:none; min-width:0; }
.tg-all .lbl { border-left:none; font-size:10px; color:var(--secondary-text-color,#999); text-align:right; padding:6px 6px 0 0; }
.tg-scroll { overflow-y:auto; position:relative; background:var(--fk-bg, transparent); }
.tg-body { position:relative; }
.tg-hours div { height:var(--fk-hour); font-size:11px; color:var(--secondary-text-color,#999); text-align:right; padding-right:6px; position:relative; top:-7px; }
.tg-col { position:relative; border-left:1px solid var(--fk-line, var(--divider-color,#e0e0e0)); cursor:pointer;
  background-image:repeating-linear-gradient(to bottom, var(--fk-line, var(--divider-color,#e8e8e8)) 0, var(--fk-line, var(--divider-color,#e8e8e8)) 1px, transparent 1px, transparent var(--fk-hour)); }
.tg-col.ferien { background-color:var(--fk-ferien); }
.tg-col.we { background-color:var(--fk-bg2, var(--secondary-background-color,rgba(0,0,0,.02))); }
.tev { position:absolute; border-radius:8px; padding:3px 6px 3px 9px; font-size:12px; overflow:hidden; cursor:pointer; line-height:1.25; border:1px solid var(--fk-bg, var(--card-background-color,#fff)); }
.tev .stripe { position:absolute; left:0; top:0; bottom:0; width:4px; }
.tev .n { font-weight:600; }
.tev .t { opacity:.8; font-variant-numeric:tabular-nums; }
.now { position:absolute; left:-1px; right:0; height:2px; background:var(--fk-red); z-index:3; pointer-events:none; }
.now::before { content:""; position:absolute; left:-5px; top:-4px; width:10px; height:10px; border-radius:50%; background:var(--fk-red); }
/* FAB */
.wide .fab-wrap { display:none; }
/* Ziehen & Verschieben */
.tev { user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.tev .rs { position:absolute; left:0; right:0; bottom:0; height:8px; cursor:ns-resize; }
.tev.dragging { opacity:.85; box-shadow:0 6px 18px rgba(0,0,0,.25); z-index:4; transition:none; }
.tev.armed { outline:2px solid var(--primary-color,#03a9f4); }
.tev.ghost { opacity:.35; }
/* Rückgängig in der Meldung */
.toast { display:flex; align-items:center; gap:14px; }
.toast button { border:none; background:transparent; color:#8ad4ff; font-weight:600; font-size:14px; padding:2px 4px; cursor:pointer; text-transform:uppercase; }
/* Wandtablet-Modus */
.tl, .tr { display:flex; align-items:center; gap:12px; min-width:0; }
.tl { flex:1; }
.tr { flex:none; }
/* Uhr mittig; wird es eng, behalten die Knöpfe rechts ihre volle Breite */
.top.kiosk { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(max-content,1fr); }
.top.kiosk .tr { justify-content:flex-end; }
.top.kiosk .title { min-width:0; overflow:hidden; text-overflow:ellipsis; }
.clockbox { display:flex; align-items:baseline; gap:12px; padding:5px 18px 6px; border:1px solid var(--fk-line, var(--divider-color,#ddd));
  border-radius:16px; background:var(--fk-bg2, var(--secondary-background-color,rgba(0,0,0,.03))); white-space:nowrap; justify-self:center; }
.clockbox .clk { font-size:28px; font-weight:400; line-height:1.1; font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
.clockbox .kdate { font-size:14.5px; color:var(--secondary-text-color,#666); }
.narrow .tl, .narrow .tr { display:contents; }
/* Schmalere Tablets: Datum ausblenden, Knopf nur mit „+“ */
.card { container-type:inline-size; }
.clockbox .kd-s { display:none; }
@container (max-width: 1500px) { .top.kiosk .clockbox .kd-l { display:none; } .top.kiosk .clockbox .kd-s { display:inline; } }
@container (max-width: 1150px) { .top.kiosk .clockbox .kd-s { display:none; } }
/* Normaler Modus auf Tablets: Kopfzeile verdichten statt überlappen */
@container (max-width: 1120px) { .wide .top:not(.kiosk) .add-top { padding:8px; border-radius:50%; font-size:0; gap:0; } .wide .top:not(.kiosk) .seg button { padding:7px 12px; } .wide .top:not(.kiosk) .title small { display:none; } }
@container (max-width: 1300px) { .top.kiosk .title .ovt { display:block; font-size:16px; line-height:1.2; white-space:normal; } .top.kiosk .title .ovt > span { display:inline-block; white-space:nowrap; } }
@container (max-width: 1150px) { .wide .top .title .ovt { display:block; font-size:16px; line-height:1.2; white-space:normal; } .wide .top .title .ovt > span { display:inline-block; white-space:nowrap; } }
@container (max-width: 860px) { .top.kiosk .title .tlong { display:none; } .top.kiosk .title .tshort { display:inline; } }
@container (max-width: 760px) { .wide .top .title .tlong { display:none; } .wide .top .title .tshort { display:inline; } }
@container (max-width: 900px) { .top.kiosk .seg button { padding:6px 8px; font-size:13px; } .top.kiosk .clockbox { padding:3px 10px; } .top.kiosk .clockbox .clk { font-size:21px; }
  .top.kiosk .title { font-size:16px; } .top.kiosk .title .ovt { font-size:14px; } .top.kiosk .nav .today-btn { padding:5px 8px; } .top.kiosk .tr { gap:4px; } }
@container (max-width: 900px) { .wide .top:not(.kiosk) .title { font-size:18px; } .wide .top:not(.kiosk) .seg button { padding:6px 9px; font-size:13px; } .wide .top:not(.kiosk) { gap:8px; } }
@container (max-width: 1300px) { .top.kiosk .add-top { padding:8px; border-radius:50%; font-size:0; gap:0; } .top.kiosk .seg button { padding:7px 12px; } }
@container (max-width: 800px) { .top.kiosk .title { font-size:16px; } .top.kiosk .today-btn svg { display:none; } .top.kiosk .today-btn { padding:6px 10px; } }
@container (max-width: 980px) {
  .top.kiosk .title { font-size:18px; }
  .top.kiosk .title small { display:none; }
  .top.kiosk .seg button { padding:7px 11px; }
  .top.kiosk .add-top { padding:8px; border-radius:50%; font-size:0; gap:0; }
  .top.kiosk, .top.kiosk .tl, .top.kiosk .tr { gap:8px; }
  .top.kiosk .clockbox { padding:4px 12px; }
  .top.kiosk .clockbox .clk { font-size:24px; }
  .top.kiosk .nav { gap:0; }
}
.narrow .clockbox .clk { font-size:19px; }
.narrow .clockbox .kdate { display:none; }
.nightveil { position:absolute; inset:0; background-color:rgba(0,0,0,0); pointer-events:none; transition:background-color 1.5s; z-index:8; border-radius:inherit; }
.card.night .nightveil { background-color:rgba(0,0,0,.62); }
.scope { display:flex; flex-direction:column; gap:10px; }
.scope .btn { text-align:left; border:1px solid var(--fk-line, var(--divider-color,#ddd)); border-radius:12px; padding:14px 16px; color:var(--primary-text-color,#212121); }
.age { display:inline-block; margin-left:4px; opacity:.85; font-weight:500; }
/* „+“ bleibt innerhalb der Karte und klebt beim Scrollen am unteren Rand */
.fab-wrap { position:sticky; bottom:16px; height:0; display:flex; justify-content:flex-end; align-items:flex-end; padding-right:16px; pointer-events:none; z-index:5; }
.fab { position:relative; pointer-events:auto; width:60px; height:60px; border-radius:18px; border:none; z-index:5;
  background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); box-shadow:0 4px 14px rgba(0,0,0,.25); display:flex; align-items:center; justify-content:center; }
.fab svg { width:30px; height:30px; fill:currentColor; }
/* Dialog */
.ovl { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:20; display:flex; align-items:center; justify-content:center; padding:16px; animation:fade .15s; }
@keyframes fade { from { opacity:0; } }
.dlg { background:var(--fk-bg, var(--card-background-color,#fff)); color:var(--primary-text-color,#212121); border-radius:20px; width:min(560px, 100%); max-height:92vh; display:flex; flex-direction:column; box-shadow:0 12px 40px rgba(0,0,0,.3); }
.dlg-h { display:flex; align-items:center; gap:8px; padding:16px 16px 8px 22px; }
.dlg-h h2 { margin:0; font-size:20px; font-weight:500; flex:1; }
.dlg-b { padding:8px 22px 8px; overflow-y:auto; }
.dlg-f { display:flex; gap:10px; padding:14px 22px 18px; justify-content:flex-end; align-items:center; }
.dlg-f .sp { flex:1; }
.btn { border:none; border-radius:20px; padding:10px 20px; font-size:14.5px; font-weight:500; background:transparent; color:var(--primary-color,#03a9f4); }
.btn:hover { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.btn.pri { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.btn.pri:disabled { opacity:.4; cursor:default; }
.btn.del { color:var(--fk-red); }
.hint { font-size:14px; color:var(--secondary-text-color,#666); margin:0 0 14px; }
.who { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:10px; }
.who button { border:2px solid transparent; border-radius:16px; padding:16px 12px; display:flex; flex-direction:column; align-items:center; gap:8px; font-size:15px; font-weight:500;
  background:var(--fk-bg2, var(--secondary-background-color,#f4f4f4)); position:relative; }
.who .av { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:600; }
.who button.on { border-color:currentColor; }
.who .ck { position:absolute; top:8px; right:8px; width:22px; height:22px; border-radius:50%; display:none; align-items:center; justify-content:center; color:#fff; }
.who button.on .ck { display:flex; }
.who .ck svg { width:16px; height:16px; fill:currentColor; }
.who .all .av { background:conic-gradient(var(--fk-all)); }
.fld { margin-bottom:14px; }
.fld > label, .lbl2 { display:block; font-size:12.5px; color:var(--secondary-text-color,#666); margin-bottom:5px; font-weight:500; }
.inp { width:100%; border:1px solid var(--fk-line, var(--divider-color,#ccc)); border-radius:10px; padding:11px 12px; font:inherit; font-size:15px; background:var(--fk-bg, var(--card-background-color,#fff)); color:inherit; }
.inp:focus { outline:2px solid var(--primary-color,#03a9f4); outline-offset:-1px; border-color:transparent; }
.inp.big { font-size:18px; }
.row { display:flex; gap:10px; }
.row > * { flex:1; min-width:0; }
.row .tm { flex:0 0 112px; }
.sw { display:flex; align-items:center; justify-content:space-between; padding:6px 0 12px; font-size:15px; }
.toggle { width:44px; height:26px; border-radius:13px; background:var(--fk-line, var(--divider-color,#ccc)); position:relative; border:none; flex:none; }
.toggle::after { content:""; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:left .15s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
.toggle.on { background:var(--primary-color,#03a9f4); }
.toggle.on::after { left:21px; }
.pills { display:flex; flex-wrap:wrap; gap:6px; }
.pill { border:1px solid var(--fk-line, var(--divider-color,#ccc)); background:transparent; border-radius:16px; padding:6px 12px; font-size:13.5px; display:inline-flex; align-items:center; gap:6px; }
.pill.on { background:var(--primary-color,#03a9f4); border-color:transparent; color:var(--text-primary-color,#fff); }
.pill i { width:12px; height:12px; border-radius:50%; display:block; }
.upill.on { color:#fff; }
.note { font-size:12.5px; color:var(--secondary-text-color,#777); background:var(--fk-bg2, var(--secondary-background-color,#f4f4f4)); padding:8px 12px; border-radius:10px; margin-bottom:12px; }
.err { color:var(--fk-red); font-size:13px; margin-right:auto; }
.detail .n { font-size:22px; font-weight:500; margin:0 0 6px; }
.detail .r { display:flex; gap:12px; align-items:flex-start; padding:8px 0; font-size:15px; }
.detail .r svg { width:20px; height:20px; fill:var(--secondary-text-color,#777); flex:none; margin-top:1px; }
.today-btn { display:inline-flex; align-items:center; gap:2px; }
.today-btn svg { width:18px; height:18px; fill:currentColor; margin-right:-6px; opacity:.7; }
.solid .today-btn svg { fill:var(--secondary-text-color,#777); opacity:1; }
.today-btn.open { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.jump { position:absolute; left:12px; top:58px; z-index:11; width:320px; background:var(--fk-bg, var(--card-background-color,#fff)); color:var(--primary-text-color,#212121);
  border-radius:16px; box-shadow:0 8px 28px rgba(0,0,0,.22); padding:12px; }
.narrow .jump { left:8px; right:8px; width:auto; top:52px; }
.jump .jt { font-size:12.5px; font-weight:500; color:var(--secondary-text-color,#777); margin:2px 4px 8px; }
.jump .today-big { width:100%; border:none; border-radius:12px; padding:10px; font-size:14px; font-weight:500; margin-bottom:10px;
  background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.jump .jh { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
.jump .jh b { font-size:15px; font-weight:500; }
.jump .jh .icon-btn { width:34px; height:34px; }
.jump .jg { display:grid; grid-template-columns:repeat(7, 1fr); gap:2px; text-align:center; }
.jump .jg .w { font-size:11px; color:var(--secondary-text-color,#888); padding:4px 0; text-transform:uppercase; }
.jump .jg button { border:none; background:transparent; width:36px; height:36px; margin:0 auto; border-radius:50%; font-size:14px; padding:0; }
.jump .jg button:hover { background:var(--fk-bg2, var(--secondary-background-color,#f0f0f0)); }
.jump .jg button.o { opacity:.4; }
.jump .jg button.we { color:var(--secondary-text-color,#777); }
.jump .jg button.hol { color:var(--fk-red); }
.jump .jg button.t { box-shadow:inset 0 0 0 2px var(--primary-color,#03a9f4); font-weight:600; }
.jump .jg button.s { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
.jump .jg button { position:relative; display:flex; align-items:center; justify-content:center; }
.jump .jg button.ev::after { content:""; position:absolute; left:50%; bottom:3px; width:5px; height:5px; margin-left:-2.5px; border-radius:50%; background:var(--fk-red); }
.jump .jg button.s.ev::after { background:var(--text-primary-color,#fff); }
.jump .jg button.o.ev::after { opacity:.6; }
.jump .jd { display:flex; align-items:center; gap:8px; margin-top:10px; font-size:13px; color:var(--secondary-text-color,#777); flex-wrap:wrap; }
.jump .jd input { flex:1; min-width:140px; padding:7px 10px; font-size:14px; }
.tg-head .selday .dn { box-shadow:0 0 0 2px var(--primary-color,#03a9f4); }
.ag-day.selday { color:var(--primary-color,#03a9f4); }
.menu { position:absolute; right:12px; top:56px; background:var(--fk-bg, var(--card-background-color,#fff)); border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.2); z-index:10; padding:6px 0; min-width:210px; }
.menu button { display:flex; gap:12px; align-items:center; width:100%; text-align:left; border:none; background:transparent; padding:11px 16px; font-size:14.5px; }
.menu button:hover { background:var(--fk-bg2, var(--secondary-background-color,#f2f2f2)); }
.menu svg { width:20px; height:20px; fill:var(--secondary-text-color,#666); }
.toast { position:fixed; left:50%; bottom:100px; transform:translateX(-50%); background:#323232; color:#fff; padding:10px 18px; border-radius:10px; font-size:14px; z-index:30; }
.loading { position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, transparent, var(--primary-color,#03a9f4), transparent); background-size:50% 100%; animation:ld 1s linear infinite; }
@keyframes ld { from { background-position:-50% 0; } to { background-position:150% 0; } }
/* Schmal */
.narrow .top { padding:10px 10px 6px; gap:6px; }
.narrow .title { font-size:19px; order:1; min-width:0; flex:1 1 0; overflow:hidden; text-overflow:ellipsis; }
.narrow .title small { display:none; }
.narrow .icon-btn { width:34px; height:34px; }
.narrow .today-btn { padding:5px 11px; }
.narrow .top { flex-wrap:wrap; }
.narrow .nav { order:2; }
.narrow .top [data-a=menu] { order:2; margin-left:-4px; }
.narrow .top [data-a=search] { order:2; margin-left:-6px; }
.icon-btn.on { background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); }
/* Übersicht */
.narrow .title .ovt { display:block; font-size:16px; line-height:1.2; white-space:normal; }
.narrow .title .ovt > span { display:inline-block; white-space:nowrap; }
.ovbar { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:4px 16px 10px; }
.narrow .ovbar { padding:4px 10px 8px; }
.ovbar .seg button { padding:5px 12px; font-size:13px; }
.ovbar .cnt { margin-left:auto; color:var(--secondary-text-color,#777); font-size:13px; }
.ov-month { font-size:15px; font-weight:600; padding:16px 16px 4px; color:var(--primary-color,#03a9f4); }
.narrow .ov-month { padding:14px 10px 2px; }
.ag-item .when small { display:block; font-size:11.5px; color:var(--secondary-text-color,#777); white-space:nowrap; }
.ov-fer { display:flex; align-items:center; gap:8px; margin:2px 16px; padding:6px 10px; border-radius:8px; font-size:13px; color:var(--fk-ferien-strong); background:var(--fk-ferien); }
.narrow .ov-fer { margin:2px 10px; }
/* Suche */
.sbar { display:flex; align-items:center; gap:8px; margin:0 16px 10px; padding:0 6px 0 12px; height:42px; border-radius:21px;
  border:2px solid var(--primary-color,#03a9f4); background:var(--fk-bg, var(--card-background-color,#fff)); }
.narrow .sbar { margin:0 10px 8px; }
.sbar svg { width:20px; height:20px; fill:var(--secondary-text-color,#777); flex:none; }
.sbar input::-webkit-search-cancel-button, .sbar input::-webkit-search-decoration { -webkit-appearance:none; appearance:none; display:none; }
.sbar input::-ms-clear { display:none; }
.sbar input { flex:1; min-width:0; border:none; outline:none; background:transparent; font:inherit; font-size:16px; color:var(--primary-text-color,#212121); }
.sbar button { all:unset; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; color:var(--secondary-text-color,#777); }
.sbar button:hover { background:var(--fk-bg2, var(--secondary-background-color,#f0f0f0)); }
.sres .shint { padding:14px 18px; color:var(--secondary-text-color,#777); font-size:14px; }
.sres mark { background:rgba(255,193,7,.45); color:inherit; border-radius:3px; padding:0 1px; }
.sres .ag-item .when { min-width:86px; }
.narrow .seg { order:3; width:100%; }
.narrow .seg button { flex:1; padding:8px 0; }
.narrow .chips { padding:4px 10px 10px; }
.narrow .add-top { display:none; }
.narrow .tg-head .dn { font-size:17px; width:32px; height:32px; line-height:32px; }
@media (max-width: 600px) { .ovl { padding:0; align-items:flex-end; } .dlg { border-radius:20px 20px 0 0; max-height:94vh; width:100%; } }
`;

const ICON = {
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  prev: "M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z",
  next: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  dots: "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",
  clock: "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  people: "M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z",
  repeat: "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z",
  bell: "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21",
  place: "M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z",
  note: "M14,10H19.5L14,4.5V10M5,3H15L21,9V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3M5,12V14H19V12H5M5,16V18H14V16H5Z",
  imp: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13.5,16V19H10.5V16H8L12,12L16,16H13.5M13,9V3.5L18.5,9H13Z",
  exp: "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M12,19L8,15H10.5V12H13.5V15H16L12,19M13,9V3.5L18.5,9H13Z",
  down: "M7,10L12,15L17,10H7Z",
  home: "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  cake: "M12,6C13.11,6 14,5.1 14,4C14,3.62 13.9,3.27 13.71,2.97L12,0L10.29,2.97C10.1,3.27 10,3.62 10,4A2,2 0 0,0 12,6M16.6,16L15.53,14.92L14.45,16C13.15,17.29 10.87,17.3 9.56,16L8.5,14.92L7.4,16C6.75,16.64 5.88,17 4.96,17C4.23,17 3.56,16.77 3,16.39V21A1,1 0 0,0 4,22H20A1,1 0 0,0 21,21V16.39C20.44,16.77 19.77,17 19.04,17C18.12,17 17.25,16.64 16.6,16M18,9H13V7H11V9H6A3,3 0 0,0 3,12V13.54C3,14.62 3.88,15.5 4.96,15.5C5.5,15.5 6,15.3 6.34,14.93L8.5,12.8L10.61,14.93C11.35,15.67 12.64,15.67 13.38,14.93L15.5,12.8L17.65,14.93C18,15.3 18.5,15.5 19.03,15.5C20.12,15.5 21,14.62 21,13.54V12A3,3 0 0,0 18,9Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  edit: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
};
const svg = (p) => `<svg viewBox="0 0 24 24"><path d="${p}"/></svg>`;

class FamilienkalenderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cfg = {};
    this._users = [];
    this._events = [];
    this._holidays = new Map();
    this._ferien = [];
    this._hidden = new Set();
    this._showHol = true;
    this._showFer = true;
    this._view = "month";
    this._date = sod(new Date());
    this._sel = sod(new Date());
    this._narrow = false;
    this._dlg = null;
    this._menu = false;
    this._loading = false;
    this._loaded = false;
    this._perm = { write: false, delete: false };
  }

  static getStubConfig() { return { initial_view: "month" }; }
  setConfig(config) {
    this._cfg = { initial_view: "month", first_hour: 7, week_numbers: true, ...config };
    this._view = ["month", "week", "day"].includes(this._cfg.initial_view) ? this._cfg.initial_view : "month";
    try {
      const st = JSON.parse(localStorage.getItem("familienkalender-filter") || "{}");
      this._hidden = new Set(st.hidden || []);
      if (st.hol === false) this._showHol = false;
      if (st.fer === false) this._showFer = false;
    } catch (e) { /* ignorieren */ }
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const lang = pickLang(this._cfg.language, hass);
    if (lang !== LANG) { setLang(lang); if (!first) this._render(); }
    if (first) this._init();
    if (!first && hass.themes !== this._themesRef) { requestAnimationFrame(() => { if (this.isConnected && this._flattenTheme() && this._loaded) this._render(); }); }
    this._themesRef = hass.themes;
  }

  connectedCallback() {
    if (!this._ro) {
      this._ro = new ResizeObserver(() => {
        const n = this.clientWidth > 0 && this.clientWidth < 700;
        if (n !== this._narrow) { this._narrow = n; this._render(); }
      });
    }
    this._ro.observe(this);
    if (this._hass && this._loaded && !this._unsub) this._subscribe();
    if (this._loaded) { this._kioskSetup(); this._render(); }
  }
  disconnectedCallback() {
    this._ro && this._ro.disconnect();
    if (this._portalHost) { this._portalHost.remove(); this._portalHost = null; this._portalRoot = null; }
    this._kioskStop();
    if (this._touchBlock) { window.removeEventListener("touchmove", this._touchBlock); this._touchBlock = null; }
    if (this._outside) { window.removeEventListener("click", this._outside, true); this._outside = null; }
    if (this._unsub) { this._unsub.then((u) => u && u()).catch(() => {}); this._unsub = null; }
  }

  async _init() {
    this._render();
    try {
      const cfg = await this._hass.callWS({ type: "familienkalender/config" });
      this._users = cfg.users.filter((u) => u.active);
      this._defaults = cfg.defaults || {};
      this._perm = cfg.permissions || { write: true, delete: true };
      this._kiosk = cfg.kiosk || null;
      this._kioskSetup();
    } catch (e) {
      this._error = "notSetup";
      this._render();
      return;
    }
    this._loaded = true;
    this._subscribe();
    await this._load();
  }

  _subscribe() {
    try {
      this._unsub = this._hass.connection.subscribeMessage((msg) => {
        if (msg && msg.config_changed) {
          this._hass.callWS({ type: "familienkalender/config" }).then((cfg) => { this._users = cfg.users.filter((u) => u.active); this._defaults = cfg.defaults || {}; this._perm = cfg.permissions || this._perm; this._kiosk = cfg.kiosk || null; this._kioskStop(); this._kioskSetup(); this._load(); });
        } else this._load();
      }, { type: "familienkalender/subscribe" });
    } catch (e) { this._unsub = null; }
  }

  _range() {
    if (this._view === "month") {
      const first = new Date(this._date.getFullYear(), this._date.getMonth(), 1);
      const s = sow(first);
      return [s, addDays(s, 42)];
    }
    if (this._view === "week") { const s = sow(this._date); return [s, addDays(s, 7)]; }
    if (this._view === "list") {
      const s = sod(this._date);
      const e = new Date(s.getFullYear(), s.getMonth() + this._listMonths(), s.getDate());
      return [s, e > addDays(s, 366) ? addDays(s, 366) : e];
    }
    return [sod(this._date), addDays(sod(this._date), 1)];
  }

  async _load() {
    if (!this._loaded) return;
    const [s, e] = this._range();
    const token = (this._tok = (this._tok || 0) + 1);
    this._jumpCache = {};
    if (this._jump) this._jumpLoad();
    this._loading = true;
    this._renderSoon();
    try {
      const res = await this._hass.callWS({ type: "familienkalender/events", start: ymd(s), end: ymd(e) });
      if (token !== this._tok) return;
      this._events = res.events.map((ev) => this._norm(ev)).sort((a, b) => (b.all_day - a.all_day) || (a._s - b._s) || (b._e - b._s) - (a._e - a._s));
      this._holidays = new Map((res.holidays || []).map((h) => [h.date, h.name]));
      this._ferien = (res.school_holidays || []).map((f) => ({ ...f, _s: parseYmd(f.start), _e: addDays(parseYmd(f.end), 1) }));
      if (this._search && this._search.data) this._searchLoad(true);
    } catch (err) {
      this._toast(T.loadFail);
    }
    this._loading = false;
    this._render();
  }

  _norm(ev) {
    const o = { ...ev };
    if (ev.all_day) { o._s = parseYmd(ev.start); o._e = parseYmd(ev.end); }
    else { o._s = new Date(ev.start); o._e = new Date(ev.end); }
    if (o._e <= o._s) o._e = new Date(o._s.getTime() + (ev.all_day ? 86400000 : 1));
    return o;
  }

  /* ----- Daten-Helfer ----- */
  _uname(u) { return u ? (u.name || (u.household ? T.household : "?")) : "?"; }
  _avatar(u, size = 16) {
    return u && u.household ? svg(ICON.home).replace("<svg", `<svg style="width:${size}px;height:${size}px;fill:currentColor"`) : esc(initials(this._uname(u)));
  }
  _persons() { return this._users.filter((u) => !u.household); }
  _title(ev) { return esc(ev.title) + (ev.age ? `<span class="age">(${ev.age})</span>` : ""); }
  _user(id) { return this._users.find((u) => u.id === id); }
  _evUsers(ev) { return (ev.users || []).map((id) => this._user(id)).filter(Boolean); }
  _visible(ev) { return this._evUsers(ev).some((u) => !this._hidden.has(u.id)); }
  _colors(ev) { const us = this._evUsers(ev).filter((u) => !this._hidden.has(u.id)); return us.length ? us.map((u) => u.color) : ["#888888"]; }
  _gradient(cols, dir = "90deg") {
    if (cols.length === 1) return cols[0];
    const step = 100 / cols.length;
    return `linear-gradient(${dir}, ${cols.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
  }
  _eventsOn(day) {
    const s = sod(day), e = addDays(s, 1);
    return this._events.filter((ev) => this._visible(ev) && ev._s < e && ev._e > s);
  }
  _ferienOn(day) { if (!this._showFer) return null; const t = sod(day); return this._ferien.find((f) => f._s <= t && f._e > t) || null; }
  _holOn(day) { return this._showHol ? this._holidays.get(ymd(day)) || null : null; }

  /* ----- Rendering ----- */
  _renderSoon() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this._render(); }); }

  /* Dialoge liegen in einer eigenen Ebene direkt unter <body>. So öffnen sie sich
     immer bildschirmfüllend – egal in welchem Dashboard-Layout die Karte steckt. */
  _pr() {
    if (!this._portalHost || !this._portalHost.isConnected) {
      this._portalHost = document.createElement("div");
      this._portalHost.setAttribute("data-familienkalender", "");
      this._portalHost.style.cssText = "position:relative;z-index:9999";
      document.body.appendChild(this._portalHost);
      this._portalRoot = this._portalHost.attachShadow({ mode: "open" });
    }
    return this._portalRoot;
  }

  _render() {
    if (this.isConnected) this._flattenTheme();
    this._sync(); // Eingaben im offenen Formular nicht verlieren
    const root = this.shadowRoot;
    const scroller = root.querySelector(".tg-scroll");
    const keepScroll = scroller ? scroller.scrollTop : null;
    let body;
    if (this._error) body = `<div class="empty" style="padding:24px">${esc(T[this._error] || this._error)}</div>`;
    else if (this._view === "month") body = this._narrow ? this._monthNarrow() : this._monthWide();
    else if (this._view === "week") body = this._narrow ? this._agenda(sow(this._date), 7) : this._timeGrid(sow(this._date), 7);
    else if (this._view === "list") body = this._listView();
    else body = this._timeGrid(sod(this._date), 1);
    if (this._search && this._search.q.trim().length >= 1) body = `<div class="sres">${this._searchHtml()}</div>`;

    root.innerHTML = `<style>${STYLE}</style>
      <div class="card ${this._narrow ? "narrow" : "wide"} ${this._night ? "night" : ""} ${this._bg ? "solid" : ""}" style="--fk-all:${this._users.filter((u) => !u.household).map((u) => u.color).join(",") || "#888,#888"}">
        ${this._loading ? '<div class="loading"></div>' : ""}
        <div class="nightveil"></div>
        ${this._header()}
        ${this._chips()}
        ${body}
        ${this._menu ? this._menuHtml() : ""}
        ${this._jump ? this._jumpHtml() : ""}
        ${this._loaded && this._perm.write ? `<div class="fab-wrap"><button class="fab" data-a="add" title="${T.newEvent}">${svg(ICON.plus)}</button></div>` : ""}
      </div>`;
    if (this._dlg || this._toastMsg || this._portalHost) {
      const pr = this._pr();
      pr.innerHTML = (this._dlg || this._toastMsg) ? `<style>${STYLE}</style>
        <div class="${this._narrow ? "narrow" : "wide"}" style="--fk-all:${this._users.map((u) => u.color).join(",") || "#888,#888"};font-family:var(--paper-font-body1_-_font-family, var(--ha-font-family-body, Roboto, 'Segoe UI', sans-serif));color:var(--primary-text-color,#212121)">
          ${this._dlg ? this._dialog() : ""}
          ${this._toastMsg ? `<div class="toast"><span>${esc(this._toastMsg)}</span>${this._toastAct ? `<button data-a="toast-act">${esc(this._toastAct.label)}</button>` : ""}</div>` : ""}
        </div>` : "";
    }
    this._bind();
    this._bindSearch();
    const sc = root.querySelector(".tg-scroll");
    if (sc) {
      if (keepScroll !== null && !this._resetScroll) sc.scrollTop = keepScroll;
      else sc.scrollTop = Math.max(0, (this._cfg.first_hour ?? 7) * this._hourPx() - 10);
      this._resetScroll = false;
    }
    const focus = this._portalRoot && this._portalRoot.querySelector("[data-autofocus]");
    if (focus && this._focusNext) { focus.focus(); this._focusNext = false; }
  }

  _hourPx() { return 52; }

  _header() {
    let title;
    const d = this._date;
    if (this._view === "month") title = `<span class="tlong">${T.monthTitle(T.months[d.getMonth()], d.getFullYear())}</span><span class="tshort">${T.monthTitle(T.monthsShort[d.getMonth()], d.getFullYear())}</span>`;
    else if (this._view === "week") {
      const s = sow(d), e = addDays(s, 6);
      const span = s.getMonth() === e.getMonth() ? T.monthTitle(T.months[s.getMonth()], s.getFullYear()) : T.span(T.monthsShort[s.getMonth()], T.monthsShort[e.getMonth()], e.getFullYear());
      title = `${span}<small>${T.kw(isoWeek(s))}</small>`;
    } else if (this._view === "list") {
      const [ls, le] = this._range(), last = addDays(le, -1);
      const yr = (x) => (x.getFullYear() !== new Date().getFullYear() || ls.getFullYear() !== last.getFullYear());
      // Smartphone: kurz ohne Wochentag; Jahr nur am Ende und nur, wenn es nicht das aktuelle ist
      const fs = (x, withYear) => (withYear && LANG === "hu" ? `${x.getFullYear()}. ` : "") + T.dayTitle(x.getDate(), T.monthsShort[x.getMonth()]) + (withYear && LANG !== "hu" ? ` ${x.getFullYear()}` : "");
      // ohne Wochentag – kurz genug für Tablets
      const f = (x) => fs(x, yr(x));
      if (this._narrow) { title = `<span class="ovt"><span>${fs(ls, false)} –</span> <span>${fs(last, last.getFullYear() !== new Date().getFullYear())}</span></span>`; }
      else title = `<span class="ovt"><span>${f(ls)} –</span> <span>${f(last)}</span></span>`;
    } else title = this._narrow ? T.dayTitle(d.getDate(), T.months[d.getMonth()]) : longDate(d);
    const kiosk = this._kiosk && this._kiosk.enabled && !this._narrow; // Smartphone: keine Uhr
    return `<div class="top ${kiosk ? "kiosk" : ""}">
      <div class="tl">
      <div class="nav">
        <button class="icon-btn" data-a="prev" title="${T.prev}">${svg(ICON.prev)}</button>
        <button class="today-btn ${this._jump ? "open" : ""}" data-a="jump-open" title="${T.jumpTitle}">${T.today}${svg(ICON.down)}</button>
        <button class="icon-btn" data-a="next" title="${T.next}">${svg(ICON.next)}</button>
      </div>
      <div class="title">${title}</div>
      </div>
      ${kiosk ? this._clockHtml() : ""}
      <div class="tr">
      <div class="seg">
        ${[["month", T.month], ["week", T.week], ["day", T.day], ["list", T.list]].map(([k, l]) => `<button data-a="view" data-v="${k}" class="${this._view === k ? "on" : ""}">${l}</button>`).join("")}
      </div>
      ${this._perm.write ? `<button class="add-top" data-a="add">${svg(ICON.plus)}${T.event}</button>` : `<span class="ro" title="${T.readOnlyTip}">${svg(ICON.lock)}<span>${T.readOnly}</span></span>`}
      <button class="icon-btn ${this._search ? "on" : ""}" data-a="search" title="${T.search}" aria-label="${T.search}">${svg(ICON.search)}</button>
      <button class="icon-btn" data-a="menu" title="${T.more}">${svg(ICON.dots)}</button>
      </div>
    </div>${this._search ? `<div class="sbar">${svg(ICON.search)}<input id="fk-search" type="search" enterkeyhint="search" autocomplete="off" placeholder="${T.searchPh}" value="${esc(this._search.q)}"><button data-a="search-close" title="${T.searchClose}" aria-label="${T.searchClose}">✕</button></div>` : ""}`;
  }

  _chips() {
    if (!this._users.length) return "";
    const u = this._users.map((x) => {
      const off = this._hidden.has(x.id);
      return `<button class="chip ${off ? "off" : ""}" data-a="toggle-user" data-id="${esc(x.id)}" title="${off ? T.show : T.hide}">
        <span class="dot" style="background:${x.color};color:${textOn(x.color)}">${this._avatar(x, 13)}</span>${esc(this._uname(x))}</button>`;
    }).join("");
    const extra = `
      <button class="chip extra ${this._showHol ? "" : "off"}" data-a="toggle-hol"><span class="dot" style="background:var(--fk-red)"></span>${T.holidays}</button>
      <button class="chip extra ${this._showFer ? "" : "off"}" data-a="toggle-fer"><span class="dot" style="background:var(--fk-ferien-strong)"></span>${T.ferien}</button>`;
    const r = this._rangeDays();
    const bar = r ? `<span class="rngbar">${T.rangeN(r.n)}<button data-a="range-clear" title="${T.rangeClear}" aria-label="${T.rangeClear}">✕</button></span>` : "";
    return `<div class="chips">${bar}${u}${extra}</div>`;
  }

  _evChipMonth(ev, day, weekStart) {
    const cols = this._colors(ev);
    if (ev.all_day || (ev._e - ev._s) >= 86400000) {
      const bg = this._gradient(cols);
      const fg = cols.length === 1 ? textOn(cols[0]) : "#fff";
      const startsBefore = ev._s < sod(day) && !sameDay(day, weekStart);
      const contL = ev._s < sod(day);
      const contR = ev._e > addDays(sod(day), 1);
      const showName = !contL || sameDay(day, weekStart);
      return `<div class="ev allday ${contL ? "cont-l" : ""} ${contR ? "cont-r" : ""}" data-a="open" data-k="${esc(ev.key)}"
        style="background:${bg};color:${fg};${cols.length > 1 ? "text-shadow:0 1px 2px rgba(0,0,0,.45);" : ""}"
        title="${esc(ev.title)}"><span class="n">${showName || !startsBefore ? this._title(ev) : "&nbsp;"}</span></div>`;
    }
    return `<div class="ev timed" data-a="open" data-k="${esc(ev.key)}" title="${esc(ev.title)}">
      <span class="dots">${cols.map((c) => `<i style="background:${c}"></i>`).join("")}</span>
      <span class="t">${hm(ev._s)}</span><span class="n">${this._title(ev)}</span></div>`;
  }

  /* Ganztägige/mehrtägige Termine einer Woche in Spuren (Lanes) anordnen */
  _weekBars(ws, n, maxLanes) {
    const we = addDays(ws, n);
    const list = this._events.filter((ev) => this._visible(ev) && (ev.all_day || ev._e - ev._s >= 86400000) && ev._s < we && ev._e > ws)
      .map((ev) => {
        const a = Math.max(0, Math.round((sod(ev._s) - ws) / 86400000));
        const lastDay = sod(new Date(ev._e.getTime() - 1));
        const b = Math.min(n - 1, Math.round((lastDay - ws) / 86400000));
        return { ev, a, b, cl: ev._s < ws, cr: ev._e > we };
      })
      .sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a) || x.ev._s - y.ev._s);
    const lanes = [];
    for (const it of list) {
      let l = lanes.findIndex((end) => end < it.a);
      if (l < 0) { l = lanes.length; lanes.push(-1); }
      lanes[l] = it.b; it.lane = l;
    }
    const hidden = Array(n).fill(0);
    list.forEach((it) => { if (it.lane >= maxLanes) for (let d = it.a; d <= it.b; d++) hidden[d]++; });
    return { bars: list.filter((it) => it.lane < maxLanes), lanes: Math.min(lanes.length, maxLanes), hidden };
  }

  _barHtml(it, colOffset) {
    const cols = this._colors(it.ev);
    const bg = this._gradient(cols);
    const fg = cols.length === 1 ? textOn(cols[0]) : "#fff";
    return `<div class="bar ${it.cl ? "cl" : ""} ${it.cr ? "cr" : ""}" data-a="open" data-k="${esc(it.ev.key)}" title="${esc(it.ev.title)}"
      style="grid-column:${it.a + 1 + colOffset} / span ${it.b - it.a + 1};grid-row:${it.lane + 1};background:${bg};color:${fg};${cols.length > 1 ? "text-shadow:0 1px 2px rgba(0,0,0,.45);" : ""}">${this._title(it.ev)}</div>`;
  }

  _ferienBands(ws, n, colOffset) {
    let h = "", start = -1;
    for (let i = 0; i <= n; i++) {
      const on = i < n && this._ferienOn(addDays(ws, i));
      if (on && start < 0) start = i;
      if (!on && start >= 0) { h += `<div class="fband" style="grid-column:${start + 1 + colOffset} / span ${i - start}"></div>`; start = -1; }
    }
    return h ? `<div class="fbands">${h}</div>` : "";
  }

  _monthWide() {
    const wk = this._cfg.week_numbers !== false;
    const off = wk ? 1 : 0;
    const [s] = this._range();
    const month = this._date.getMonth();
    const today = sod(new Date());
    // Nur so viele Wochen wie nötig (5 oder 6)
    const last = new Date(this._date.getFullYear(), month + 1, 0);
    const weeks = Math.ceil((((last.getDay() + 6) % 7) + 1 + (last - s) / 86400000) / 7);
    const MAX = 4, MAXL = 3;
    let h = `<div class="month mw ${wk ? "wk" : "nowk"}"><div class="mrow">${wk ? '<div class="mh"></div>' : ""}${T.wd.map((w) => `<div class="mh">${w}</div>`).join("")}</div>`;
    for (let w = 0; w < weeks; w++) {
      const ws = addDays(s, w * 7);
      const wb = this._weekBars(ws, 7, MAXL);
      h += `<div class="mrow">${wk ? `<div class="kw">${isoWeek(ws)}</div>` : ""}`;
      for (let i = 0; i < 7; i++) {
        const day = addDays(ws, i);
        const hol = this._holOn(day), fer = this._ferienOn(day);
        const timed = this._eventsOn(day).filter((ev) => !(ev.all_day || ev._e - ev._s >= 86400000));
        const cls = ["cell", day.getMonth() !== month && "other", i >= 5 && "we", hol && "hol", fer && "ferien", sameDay(day, today) && "today", sameDay(day, this._sel) && this._selShown && "sel"].filter(Boolean).join(" ");
        const label = hol ? `<span class="hname">${esc(trName(hol))}</span>`
          : (fer && (sameDay(fer._s, day) || i === 0) ? `<span class="flabel in">${esc(trName(fer.name))}</span>` : "");
        const room = Math.max(0, MAX - wb.lanes);
        const total = timed.length + wb.hidden[i];
        const shown = total <= room ? timed : timed.slice(0, Math.max(0, room - 1));
        const more = total - shown.length;
        h += `<div class="${cls}${this._rngCls(day)}" data-a="day" data-d="${ymd(day)}" data-rd="${ymd(day)}">
          <div class="chead"><span class="dnum" data-a="goto-day" data-d="${ymd(day)}">${day.getDate()}</span>${label}</div>
          ${wb.lanes ? `<div style="height:${wb.lanes * 22}px"></div>` : ""}
          ${shown.map((ev) => this._evChipMonth(ev, day, ws)).join("")}
          ${more > 0 ? `<div class="more" data-a="goto-day" data-d="${ymd(day)}">${T.moreN(more)}</div>` : ""}
        </div>`;
      }
      h += this._ferienBands(ws, 7, off);
      if (wb.bars.length) h += `<div class="bars">${wb.bars.map((it) => this._barHtml(it, off)).join("")}</div>`;
      h += `</div>`;
    }
    return h + `</div>`;
  }

  _monthNarrow() {
    const [s] = this._range();
    const month = this._date.getMonth();
    const today = sod(new Date());
    const last = new Date(this._date.getFullYear(), month + 1, 0);
    const weeks = Math.ceil((((last.getDay() + 6) % 7) + 1 + (last - s) / 86400000) / 7);
    let h = `<div class="month nowk">` + T.wd.map((w) => `<div class="mh">${w}</div>`).join("");
    for (let w = 0; w < weeks; w++) {
      for (let i = 0; i < 7; i++) {
        const day = addDays(s, w * 7 + i);
        const hol = this._holOn(day), fer = this._ferienOn(day);
        const evs = this._eventsOn(day);
        const cls = ["cell", day.getMonth() !== month && "other", i >= 5 && "we", hol && "hol", fer && "ferien", sameDay(day, today) && "today", sameDay(day, this._sel) && "sel"].filter(Boolean).join(" ");
        const dots = evs.slice(0, 4).map((ev) => `<i style="background:${this._gradient(this._colors(ev))}"></i>`).join("") + (evs.length > 4 ? "<b>+</b>" : "");
        h += `<div class="${cls}${this._rngCls(day)}" data-a="select" data-d="${ymd(day)}" data-rd="${ymd(day)}"><div class="chead"><span class="dnum">${day.getDate()}</span></div><div class="mdots">${dots}</div></div>`;
      }
    }
    h += `</div>`;
    return h + this._agenda(this._sel, 1, true);
  }

  _agenda(start, days, single = false) {
    const today = sod(new Date());
    let h = `<div class="agenda">`;
    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const evs = this._eventsOn(day);
      const hol = this._holOn(day), fer = this._ferienOn(day);
      h += `<div class="ag-day ${sameDay(day, today) ? "today" : ""} ${!single && this._selShown && sameDay(day, this._sel) ? "selday" : ""}"><span>${single ? longDate(day) : T.shortDate(T.wdLong[(day.getDay() + 6) % 7], day.getDate(), T.monthsShort[day.getMonth()])}</span>
        ${hol ? `<span class="hn">${esc(trName(hol))}</span>` : ""}${fer ? `<span class="fn">${esc(trName(fer.name))}</span>` : ""}</div>`;
      if (!evs.length) h += `<div class="empty" data-a="add-on" data-d="${ymd(day)}">${single && this._perm.write ? T.noEventsAdd : T.noEvents}</div>`;
      h += evs.map((ev) => this._agItem(ev, day)).join("");
    }
    return h + `</div>`;
  }

  /* ----- Übersicht (Liste, max. 1 Jahr) ----- */
  _listMonths() {
    if (!this._lm) { let v = 3; try { v = +localStorage.getItem("familienkalender-list-months") || 3; } catch (_) {} this._lm = [1, 3, 6, 12].includes(v) ? v : 3; }
    return this._lm;
  }

  _setListMonths(n) {
    this._lm = [1, 3, 6, 12].includes(n) ? n : 3;
    try { localStorage.setItem("familienkalender-list-months", String(this._lm)); } catch (_) {}
  }

  _listView() {
    const [s, e] = this._range();
    const today = sod(new Date());
    // Jeder Termin nur einmal – am Starttag (bzw. am ersten Tag der Übersicht)
    const byDay = new Map();
    const add = (d, item) => { const k = ymd(d); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(item); };
    const evs = this._events.filter((ev) => this._visible(ev) && ev._e > s && ev._s < e);
    evs.forEach((ev) => add(ev._s < s ? s : sod(ev._s), { ev }));
    if (this._showFer) this._ferien.filter((f) => f._e > s && f._s < e).forEach((f) => add(f._s < s ? s : f._s, { fer: f }));
    if (this._showHol) this._holidays.forEach((name, k) => { const d = parseYmd(k); if (d >= s && d < e && !byDay.has(k)) byDay.set(k, []); });
    const keys = [...byDay.keys()].sort();
    const n = this._listMonths();
    let h = `<div class="ovbar"><div class="seg">${[1, 3, 6, 12].map((m, i) => `<button data-a="list-n" data-n="${m}" class="${n === m ? "on" : ""}">${T.listMonths[i]}</button>`).join("")}</div>
      <span class="cnt">${T.nEvents(evs.length)}</span></div><div class="agenda ov">`;
    if (!keys.length) return h + `<div class="empty" style="padding:22px 18px">${T.listEmpty}</div></div>`;
    let month = -1;
    for (const k of keys) {
      const day = parseYmd(k);
      const mk = day.getFullYear() * 12 + day.getMonth();
      if (mk !== month) { month = mk; h += `<div class="ov-month">${T.monthTitle(T.months[day.getMonth()], day.getFullYear())}</div>`; }
      const hol = this._showHol ? this._holOn(day) : null;
      h += `<div class="ag-day ${sameDay(day, today) ? "today" : ""}"><span>${T.shortDate(T.wdLong[(day.getDay() + 6) % 7], day.getDate(), T.monthsShort[day.getMonth()])}</span>
        ${hol ? `<span class="hn">${esc(trName(hol))}</span>` : ""}</div>`;
      for (const it of byDay.get(k)) {
        if (it.fer) { h += `<div class="ov-fer"><b>${esc(trName(it.fer.name))}</b><span>${T.listUntil(addDays(it.fer._e, -1))}</span></div>`; continue; }
        h += this._agItem(it.ev, day, this._whenList(it.ev, day));
      }
    }
    return h + `</div>`;
  }

  _whenList(ev, day) {
    const last = ev.all_day ? addDays(ev._e, -1) : ev._e;
    const multi = !sameDay(sod(ev._s), sod(ev.all_day ? last : new Date(ev._e.getTime() - 1)));
    const until = multi ? `<small>${T.listUntil(ev.all_day ? last : new Date(ev._e.getTime() - 1))}</small>` : "";
    if (ev.all_day) return `${T.alldayAgenda}${until}`;
    const st = ev._s < sod(day) ? "" : hm(ev._s);
    return multi ? `${st || T.alldayAgenda}${until}` : `${hm(ev._s)}<br>${hm(ev._e)}`;
  }

  /* ----- Suche (12 Monate zurück und voraus) ----- */
  async _searchLoad(refresh = false) {
    const se = this._search; if (!se) return;
    const today = sod(new Date());
    try {
      const [a, b] = await Promise.all([
        this._hass.callWS({ type: "familienkalender/events", start: ymd(addDays(today, -365)), end: ymd(today) }),
        this._hass.callWS({ type: "familienkalender/events", start: ymd(today), end: ymd(addDays(today, 366)) }),
      ]);
      if (this._search !== se) return;
      const seen = new Set();
      se.data = [...a.events, ...b.events].filter((ev) => { const k = ev.key; if (seen.has(k)) return false; seen.add(k); return true; }).map((ev) => this._norm(ev));
    } catch (_) { if (this._search === se) se.data = []; }
    if (this._search === se) this._searchUpdate(refresh);
  }

  _fold(t) {
    return String(t || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  _hl(text, words) {
    // Treffer hervorheben (Akzente/Umlaute werden beim Vergleich ignoriert)
    const t = String(text || "");
    if (!words.length) return esc(t);
    const f = this._fold(t);
    if (f.length !== t.length) return esc(t); // ß o. Ä.: Position nicht eindeutig → ohne Markierung
    const marks = new Array(t.length).fill(false);
    words.forEach((w) => { let i = f.indexOf(w); while (i >= 0) { for (let j = i; j < i + w.length; j++) marks[j] = true; i = f.indexOf(w, i + 1); } });
    let out = "", open = false;
    for (let i = 0; i < t.length; i++) {
      if (marks[i] && !open) { out += "<mark>"; open = true; }
      if (!marks[i] && open) { out += "</mark>"; open = false; }
      out += esc(t[i]);
    }
    return out + (open ? "</mark>" : "");
  }

  _searchHtml() {
    const se = this._search;
    const q = se.q.trim();
    if (q.length < 2) return `<div class="shint">${T.searchMin}<br><small>${T.searchScope}</small></div>`;
    if (!se.data) return `<div class="shint">${T.searching}</div>`;
    const words = this._fold(q).split(/\s+/).filter(Boolean);
    const now = new Date();
    const hits = se.data.filter((ev) => {
      if (!this._visible(ev)) return false;
      const hay = this._fold([ev.title, ev.location, ev.description, ...this._evUsers(ev).map((u) => this._uname(u))].join(" \n "));
      return words.every((w) => hay.includes(w));
    });
    // Serien zusammenfassen: nur der nächste (bzw. zuletzt vergangene) Termin
    const groups = new Map();
    hits.forEach((ev) => {
      const g = ev.recurrence ? `s:${ev.uid}` : `e:${ev.key}`;
      if (!groups.has(g)) groups.set(g, []); groups.get(g).push(ev);
    });
    const up = [], past = [];
    groups.forEach((list) => {
      list.sort((x, y) => x._s - y._s);
      const next = list.find((x) => x._e > now);
      if (next) up.push(next); else past.push(list[list.length - 1]);
    });
    up.sort((x, y) => x._s - y._s); past.sort((x, y) => y._s - x._s);
    if (!up.length && !past.length) return `<div class="shint">${T.noHits}</div>`;
    const row = (ev) => {
      const d = sod(ev._s), y = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "";
      const when = `${T.shortDate(T.wd[(d.getDay() + 6) % 7], d.getDate(), T.monthsShort[d.getMonth()])}${y}<small>${ev.all_day ? T.alldayAgenda : hm(ev._s)}</small>`;
      return this._agItem(ev, d, when, words);
    };
    let h = `<div class="agenda">`;
    if (up.length) h += `<div class="ov-month">${T.upcoming} (${up.length})</div>` + up.map(row).join("");
    if (past.length) h += `<div class="ov-month">${T.past} (${past.length})</div>` + past.map(row).join("");
    return h + `</div>`;
  }

  _bindSearch() {
    const inp = this.shadowRoot.getElementById("fk-search");
    if (!inp) return;
    inp.addEventListener("input", () => {
      this._search.q = inp.value;
      clearTimeout(this._searchT);
      this._searchT = setTimeout(() => this._searchUpdate(), 120);
    });
    inp.addEventListener("keydown", (e) => { if (e.key === "Escape") { this._search = null; this._render(); } });
    if (this._searchFocus) { this._searchFocus = false; setTimeout(() => inp.focus(), 30); }
  }

  _searchUpdate() {
    // Nur die Ergebnisliste austauschen – das Eingabefeld behält Fokus und Tastatur
    if (!this._search) return;
    const root = this.shadowRoot;
    let box = root.querySelector(".sres");
    const want = this._search.q.trim().length >= 1;
    if (!want) { if (box) this._renderKeepSearch(); return; }
    if (!box) return this._renderKeepSearch();
    box.innerHTML = this._searchHtml();
    box.querySelectorAll("[data-a]").forEach((el) => el.addEventListener("click", (e) => this._click(e, el)));
  }

  _renderKeepSearch() {
    // Wechsel zwischen Kalender und Ergebnisliste: neu zeichnen und Eingabe/Cursor wiederherstellen
    const old = this.shadowRoot.getElementById("fk-search");
    const pos = old ? old.selectionStart : null;
    const had = old && this.shadowRoot.activeElement === old;
    this._render();
    const inp = this.shadowRoot.getElementById("fk-search");
    if (inp && had) { inp.focus(); if (pos !== null) try { inp.setSelectionRange(pos, pos); } catch (_) {} }
  }

  _agItem(ev, day, whenOverride, words) {
    const cols = this._colors(ev);
    let when;
    if (ev.all_day) when = T.alldayAgenda;
    else {
      const s = ev._s < sod(day) ? "00:00" : hm(ev._s);
      const e = ev._e > addDays(sod(day), 1) ? "24:00" : hm(ev._e);
      when = `${s}<br>${e}`;
    }
    if (whenOverride) when = whenOverride;
    const W = words || [];
    const tags = this._evUsers(ev).map((u) => `<span class="tag"><i style="background:${u.color}"></i>${this._hl(this._uname(u), W)}</span>`).join("");
    const title = W.length ? this._hl(ev.title, W) + (ev.age ? ` <span class="age">(${ev.age})</span>` : "") : this._title(ev);
    const rec = ev.recurrence ? `<span title="${T.recurring}">↻${W.length ? " " + esc(T.freqs[Math.max(0, FREQ_KEYS.indexOf(ev.recurrence.freq))]) : ""}</span>` : "";
    return `<div class="ag-item" data-a="open" data-k="${esc(ev.key)}">
      <div class="bar" style="background:${this._gradient(cols, "180deg")}"></div>
      <div class="when">${when}</div>
      <div class="what"><div class="n">${title}</div>
        <div class="m">${tags}${ev.location ? `<span>· ${this._hl(ev.location, W)}</span>` : ""}${rec}</div></div>
    </div>`;
  }

  _layout(evs) {
    // Überlappende Termine nebeneinander anordnen
    const items = evs.map((ev) => ({ ev, s: ev._s.getTime(), e: Math.max(ev._e.getTime(), ev._s.getTime() + 30 * 60000) })).sort((a, b) => a.s - b.s || b.e - a.e);
    const out = [];
    let cluster = [], cEnd = -1;
    const flush = () => {
      const cols = [];
      cluster.forEach((it) => {
        let c = cols.findIndex((end) => end <= it.s);
        if (c < 0) { c = cols.length; cols.push(0); }
        cols[c] = it.e; it.col = c;
      });
      cluster.forEach((it) => { it.n = cols.length; out.push(it); });
      cluster = [];
    };
    items.forEach((it) => { if (it.s >= cEnd && cluster.length) flush(); cluster.push(it); cEnd = Math.max(cEnd, it.e); });
    if (cluster.length) flush();
    return out;
  }

  _timeGrid(start, days) {
    const today = sod(new Date());
    const H = this._hourPx();
    const cols = `52px repeat(${days}, 1fr)`;
    let head = `<div class="tg-head" style="grid-template-columns:${cols}"><div></div>`;
    let all = `<div class="tg-all" style="grid-template-columns:${cols}"><div class="lbl">${T.alldayShort}</div>`;
    let body = `<div class="tg-body" style="grid-template-columns:${cols}"><div class="tg-hours">${Array.from({ length: 24 }, (_, i) => `<div>${i ? pad(i) + ":00" : ""}</div>`).join("")}</div>`;
    for (let i = 0; i < days; i++) {
      const day = addDays(start, i);
      const hol = this._holOn(day), fer = this._ferienOn(day);
      const dayEvs = this._eventsOn(day);
      const allEvs = dayEvs.filter((ev) => ev.all_day || ev._e - ev._s >= 86400000);
      const timed = dayEvs.filter((ev) => !allEvs.includes(ev));
      const wd = (day.getDay() + 6) % 7;
      head += `<div class="${sameDay(day, today) ? "today" : ""} ${hol ? "hol" : ""} ${this._selShown && sameDay(day, this._sel) && days > 1 ? "selday" : ""}${days > 1 ? this._rngCls(day) : ""}" ${days > 1 ? `data-rd="${ymd(day)}"` : ""}>
        <div class="wd">${days === 1 ? T.wdLong[wd] : T.wd[wd]}</div><div class="dn" data-a="goto-day" data-d="${ymd(day)}">${day.getDate()}</div>
        ${hol ? `<div class="hn">${esc(trName(hol))}</div>` : ""}${fer && !hol ? `<div class="fn">${esc(trName(fer.name))}</div>` : ""}</div>`;
      all += `<div></div>`;
      const ds = sod(day).getTime(), de = addDays(sod(day), 1).getTime();
      const blocks = this._layout(timed).map((it) => {
        const s = Math.max(it.s, ds), e = Math.min(it.e, de);
        const top = ((s - ds) / 3600000) * H;
        const height = Math.max(((e - s) / 3600000) * H - 2, 22);
        const c = this._colors(it.ev);
        const main = c[0];
        const short = height < 40;
        return `<div class="tev" data-a="open" data-drag="${this._perm.write ? 1 : 0}" data-k="${esc(it.ev.key)}" title="${this._perm.write ? esc(T.dragHint) : ""}" style="top:${top}px;height:${height}px;left:calc(${(it.col / it.n) * 100}% + 2px);width:calc(${100 / it.n}% - 4px);background:${this._bg ? mixOn(main, 0.2, this._bg) : rgba(main, 0.2)};color:var(--primary-text-color)">
          <div class="stripe" style="background:${this._gradient(c, "180deg")}"></div>
          ${short ? `<span class="n">${this._title(it.ev)}</span> <span class="t">${hm(it.ev._s)}</span>` : `<div class="n">${this._title(it.ev)}</div><div class="t">${hm(it.ev._s)} – ${hm(it.ev._e)}</div>${it.ev.location ? `<div class="t">${esc(it.ev.location)}</div>` : ""}`}
          ${this._perm.write && !it.ev.all_day ? '<div class="rs" data-rs="1"></div>' : ""}
        </div>`;
      }).join("");
      const now = sameDay(day, today) ? `<div class="now" style="top:${((Date.now() - ds) / 3600000) * H}px"></div>` : "";
      body += `<div class="tg-col ${fer ? "ferien" : ""} ${wd >= 5 ? "we" : ""}" data-a="slot" data-d="${ymd(day)}" style="height:${24 * H}px;${this._perm.write ? "" : "cursor:default"}">${blocks}${now}</div>`;
    }
    const ab = this._weekBars(start, days, 6);
    all = all.replace('<div class="tg-all" style="', `<div class="tg-all" style="min-height:${Math.max(28, ab.lanes * 22 + 8)}px;`);
    if (ab.bars.length) all += `<div class="bars">${ab.bars.map((it) => this._barHtml(it, 1)).join("")}</div>`;
    head += `</div>`; all += `</div>`; body += `</div>`;
    const maxH = this._cfg.grid_height || "calc(100vh - 290px)";
    return `<div class="tg">${head}${all}<div class="tg-scroll" style="max-height:max(380px, ${maxH})">${body}</div></div>`;
  }

  _jumpHtml() {
    const m = this._jump.month, today = sod(new Date());
    const start = sow(m);
    const selected = this._view === "month" ? this._sel : this._date;
    let g = T.wd.map((w) => `<div class="w">${w}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      const cls = [d.getMonth() !== m.getMonth() && "o", i % 7 >= 5 && "we", this._showHol && this._holidays.has(ymd(d)) && "hol",
        sameDay(d, today) && "t", sameDay(d, selected) && "s", this._jumpDays(m).has(ymd(d)) && "ev"].filter(Boolean).join(" ");
      g += `<button class="${cls}" data-a="jump-day" data-d="${ymd(d)}">${d.getDate()}</button>`;
    }
    return `<div class="jump" data-pop="jump">
      <div class="jt">${T.jumpTitle}</div>
      <button class="today-big" data-a="jump-today">${T.today} · ${esc(longDate(today))}</button>
      <div class="jh"><button class="icon-btn" data-a="jump-prev" title="${T.prev}">${svg(ICON.prev)}</button>
        <b>${T.monthTitle(T.months[m.getMonth()], m.getFullYear())}</b>
        <button class="icon-btn" data-a="jump-next" title="${T.next}">${svg(ICON.next)}</button></div>
      <div class="jg">${g}</div>
      <div class="jd"><span>${T.enterDate}</span><input class="inp" type="date" id="jump-input" value="${ymd(selected)}"></div>
    </div>`;
  }

  /* Tage mit Terminen für den kleinen Sprung-Kalender (roter Punkt) */
  _jumpDays(month) {
    const key = ymd(sow(month));
    return (this._jumpCache && this._jumpCache[key] && this._jumpCache[key].days) || new Set();
  }

  async _jumpLoad() {
    if (!this._jump || !this._loaded) return;
    const month = this._jump.month;
    const start = sow(month), end = addDays(start, 42), key = ymd(start);
    this._jumpCache = this._jumpCache || {};
    if (this._jumpCache[key]) return;
    this._jumpCache[key] = { days: new Set() };
    try {
      const res = await this._hass.callWS({ type: "familienkalender/events", start: key, end: ymd(end) });
      const days = new Set();
      for (const raw of res.events || []) {
        const ev = this._norm(raw);
        if (!this._visible(ev)) continue; // ausgeblendete Personen nicht mitzählen
        for (let d = sod(ev._s > start ? ev._s : start); d < ev._e && d < end; d = addDays(d, 1)) days.add(ymd(d));
      }
      this._jumpCache[key] = { days };
      if (this._jump && ymd(sow(this._jump.month)) === key) this._render();
    } catch (e) { delete this._jumpCache[key]; }
  }

  _jumpTo(day) {
    // Ansicht bleibt; Monat/Woche/Tag springt zum gewählten Datum, der Tag wird markiert
    this._jump = null;
    this._sel = sod(day);
    this._selShown = !sameDay(day, new Date());
    this._date = this._view === "month" ? new Date(day.getFullYear(), day.getMonth(), 1) : sod(day);
    this._resetScroll = true;
    return this._load();
  }

  _menuHtml() {
    return `<div class="menu">
      ${this._perm.write ? `<button data-a="import">${svg(ICON.imp)}${T.importMenu}</button>` : ""}
      <button data-a="export">${svg(ICON.exp)}${T.exportMenu}</button>
    </div>`;
  }

  /* ----- Dialoge ----- */
  _dialog() {
    const d = this._dlg;
    let title = "", body = "", foot = "";
    const close = `<button class="icon-btn" data-a="close">${svg(ICON.close)}</button>`;
    if (d.mode === "who") {
      title = T.whoTitle;
      const persons = this._persons();
      const allOn = persons.length > 1 && persons.every((u) => d.users.includes(u.id));
      body = `<p class="hint">${T.whoHint}</p><div class="who">
        ${this._users.map((u) => `<button class="${d.users.includes(u.id) ? "on" : ""}" style="color:${u.color}" data-a="pick" data-id="${esc(u.id)}">
          <span class="ck" style="background:${u.color}">${svg(ICON.check)}</span>
          <span class="av" style="background:${u.color};color:${textOn(u.color)}">${this._avatar(u, 26)}</span>
          <span style="color:var(--primary-text-color)">${esc(this._uname(u))}</span></button>`).join("")}
        ${persons.length > 1 ? `<button class="all ${allOn ? "on" : ""}" style="color:var(--primary-text-color)" data-a="pick-all">
          <span class="ck" style="background:var(--primary-color)">${svg(ICON.check)}</span>
          <span class="av" style="color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)">${svg(ICON.people).replace("<svg", '<svg style="width:26px;height:26px;fill:#fff"')}</span><span>${T.everyone}</span></button>` : ""}
      </div>`;
      foot = `<span class="sp"></span><button class="btn" data-a="close">${T.cancel}</button><button class="btn pri" data-a="who-next" ${d.users.length ? "" : "disabled"}>${T.cont}</button>`;
    } else if (d.mode === "form") {
      const x = d.draft;
      title = d.uid ? T.editEvent : T.newEvent;
      body = `
        ${d.occ ? `<div class="note">${T.occNote}</div>` : (d.uid && x.freq ? `<div class="note">${T.seriesNote}</div>` : "")}
        <div class="fld"><input class="inp big" id="f-title" placeholder="${T.titlePh}" value="${esc(x.title)}" data-autofocus autocomplete="off"></div>
        <div class="fld"><span class="lbl2">${T.forWho}</span><div class="pills">
          ${this._users.map((u) => { const on = x.users.includes(u.id); return `<button class="pill upill ${on ? "on" : ""}" data-a="f-user" data-id="${esc(u.id)}" style="${on ? `background:${u.color};color:${textOn(u.color)}` : ""}"><i style="background:${on ? textOn(u.color) : u.color}"></i>${esc(this._uname(u))}</button>`; }).join("")}
        </div></div>
        <div class="sw"><span>${T.allDay}</span><button class="toggle ${x.all_day ? "on" : ""}" data-a="f-allday"></button></div>
        <div class="fld"><label>${T.start}</label><div class="row"><input class="inp" type="date" id="f-sd" value="${x.sd}">${x.all_day ? "" : `<input class="inp tm" type="time" id="f-st" value="${x.st}">`}</div></div>
        <div class="fld"><label>${T.end}</label><div class="row"><input class="inp" type="date" id="f-ed" value="${x.ed}">${x.all_day ? "" : `<input class="inp tm" type="time" id="f-et" value="${x.et}">`}</div></div>
        ${d.occ ? "" : `<div class="fld"><label>${T.repeat}</label><div class="row">
          <select class="inp" id="f-freq">${FREQ_KEYS.map((k, i) => `<option value="${k}" ${x.freq === k ? "selected" : ""}>${T.freqs[i]}</option>`).join("")}</select>
          ${x.freq ? `<input class="inp" type="date" id="f-until" value="${x.until || ""}" title="${T.untilTip}">` : ""}
        </div>${x.freq ? `<div style="font-size:12px;color:var(--secondary-text-color);margin-top:4px">${T.untilHint}</div>` : ""}</div>`}
        ${!d.occ && x.freq === "yearly" ? `<div class="fld"><label>${T.birthYear}</label><input class="inp" type="number" inputmode="numeric" id="f-by" min="1850" max="${new Date().getFullYear()}" placeholder="1985" value="${esc(x.birth_year || "")}"></div>` : ""}
        <div class="fld"><span class="lbl2">${T.reminder}</span><div class="pills">
          ${REMINDER_MIN.map((m, i) => (x.all_day && m > 0 && m < 1440) ? "" : `<button class="pill ${x.reminders.includes(m) ? "on" : ""}" data-a="f-rem" data-m="${m}">${x.all_day && m === 0 ? T.remOnDay : T.rem[i]}</button>`).join("")}
        </div></div>
        <div class="fld"><label>${T.location}</label><input class="inp" id="f-loc" value="${esc(x.location)}" placeholder="${T.optional}"></div>
        <div class="fld"><label>${T.notes}</label><textarea class="inp" id="f-desc" rows="2" placeholder="${T.optional}">${esc(x.description)}</textarea></div>`;
      foot = `${d.err ? `<span class="err">${esc(d.err)}</span>` : '<span class="sp"></span>'}<button class="btn" data-a="close">${T.cancel}</button><button class="btn pri" data-a="save">${T.save}</button>`;
    } else if (d.mode === "detail") {
      const ev = d.ev;
      title = "";
      const cols = this._colors(ev);
      let when;
      if (ev.all_day) {
        const last = addDays(ev._e, -1);
        when = sameDay(ev._s, last) ? longDate(ev._s) : `${longDate(ev._s)} –<br>${longDate(last)}`;
        when += ` · ${T.alldayDetail}`;
      } else when = sameDay(ev._s, ev._e) ? `${longDate(ev._s)}<br>${hm(ev._s)} – ${hm(ev._e)}${T.uhr}` : `${longDate(ev._s)}, ${hm(ev._s)} –<br>${longDate(ev._e)}, ${hm(ev._e)}${T.uhr}`;
      const freqName = ev.recurrence ? T.freqs[Math.max(0, FREQ_KEYS.indexOf(ev.recurrence.freq))] : "";
      body = `<div class="detail">
        <div style="height:6px;border-radius:3px;background:${this._gradient(cols)};margin-bottom:14px"></div>
        <div class="n">${esc(ev.title)}</div>
        <div class="r">${svg(ICON.clock)}<div>${when}</div></div>
        ${ev.age ? `<div class="r">${svg(ICON.cake)}<div>${T.turns(ev.age)}</div></div>` : ""}
        <div class="r">${svg(ICON.people)}<div class="pills">${this._evUsers(ev).map((u) => `<span class="tag" style="background:${rgba(u.color, 0.15)};font-size:13.5px;padding:3px 10px 3px 4px"><i style="background:${u.color};width:14px;height:14px"></i>${esc(this._uname(u))}</span>`).join("")}</div></div>
        ${ev.recurrence ? `<div class="r">${svg(ICON.repeat)}<div>${freqName}${ev.recurrence.until ? " " + T.until(parseYmd(ev.recurrence.until)) : ""}</div></div>` : ""}
        ${ev.reminders && ev.reminders.length ? `<div class="r">${svg(ICON.bell)}<div>${ev.reminders.map((m) => (ev.all_day && m === 0) ? T.remListDay : (T.remList[REMINDER_MIN.indexOf(m)] || `${m} min`)).join(", ")}</div></div>` : ""}
        ${ev.location ? `<div class="r">${svg(ICON.place)}<div>${esc(ev.location)}</div></div>` : ""}
        ${ev.description ? `<div class="r">${svg(ICON.note)}<div style="white-space:pre-wrap">${esc(ev.description)}</div></div>` : ""}
      </div>`;
      foot = `${this._perm.delete ? `<button class="btn del" data-a="del">${T.del}</button>` : ""}<span class="sp"></span>${this._perm.write ? `<button class="btn" data-a="dup">${T.duplicate}</button><button class="btn pri" data-a="edit">${T.edit}</button>` : `<button class="btn" data-a="close">${T.close}</button>`}`;
    } else if (d.mode === "scope") {
      // Wiederkehrender Termin: nur diesen oder die ganze Serie?
      title = d.drag ? T.moveQ : T.editQ;
      body = `<p class="hint">${T.q(esc(d.ev.title))} · ${esc(longDate(d.ev._s))}</p><div class="scope">
        <button class="btn" data-a="scope-one">${T.editOnly}</button>
        <button class="btn" data-a="scope-all">${T.editSeries}</button></div>`;
      foot = `<span class="sp"></span><button class="btn" data-a="scope-cancel">${T.cancel}</button>`;
    } else if (d.mode === "del") {
      title = T.delQ;
      body = d.ev.recurrence ? `<p class="hint">${T.delRec(esc(d.ev.title))}</p>` : `<p class="hint">${T.delFinal(esc(d.ev.title))}</p>`;
      foot = d.ev.recurrence
        ? `<button class="btn" data-a="close">${T.cancel}</button><span class="sp"></span><button class="btn del" data-a="del-one">${T.onlyThis}</button><button class="btn pri" style="background:var(--fk-red)" data-a="del-all">${T.wholeSeries}</button>`
        : `<span class="sp"></span><button class="btn" data-a="close">${T.cancel}</button><button class="btn pri" style="background:var(--fk-red)" data-a="del-all">${T.del}</button>`;
    } else if (d.mode === "import") {
      title = T.importTitle;
      body = `<p class="hint">${T.importHint}</p>
        <div class="fld"><input class="inp" type="file" id="f-file" accept=".ics,text/calendar"></div>
        <div class="fld"><span class="lbl2">${T.forWho}</span><div class="pills">
        ${this._users.map((u) => { const on = d.users.includes(u.id); return `<button class="pill upill ${on ? "on" : ""}" data-a="i-user" data-id="${esc(u.id)}" style="${on ? `background:${u.color};color:${textOn(u.color)}` : ""}"><i style="background:${on ? textOn(u.color) : u.color}"></i>${esc(this._uname(u))}</button>`; }).join("")}</div></div>`;
      foot = `${d.err ? `<span class="err">${esc(d.err)}</span>` : '<span class="sp"></span>'}<button class="btn" data-a="close">${T.cancel}</button><button class="btn pri" data-a="do-import" ${d.busy ? "disabled" : ""}>${d.busy ? T.importing : T.importBtn}</button>`;
    } else if (d.mode === "export") {
      title = T.exportTitle;
      body = `<p class="hint">${T.exportHint}</p>
        <div class="fld"><span class="lbl2">${T.exportFrom}</span><div class="pills">
        ${this._users.map((u) => { const on = d.users.includes(u.id); return `<button class="pill upill ${on ? "on" : ""}" data-a="i-user" data-id="${esc(u.id)}" style="${on ? `background:${u.color};color:${textOn(u.color)}` : ""}"><i style="background:${on ? textOn(u.color) : u.color}"></i>${esc(this._uname(u))}</button>`; }).join("")}</div></div>`;
      foot = `<span class="sp"></span><button class="btn" data-a="close">${T.cancel}</button><button class="btn pri" data-a="do-export" ${d.users.length ? "" : "disabled"}>${T.download}</button>`;
    }
    return `<div class="ovl" data-a="ovl"><div class="dlg" role="dialog">
      <div class="dlg-h"><h2>${title}</h2>${close}</div>
      <div class="dlg-b">${body}</div>
      <div class="dlg-f">${foot}</div></div></div>`;
  }

  _newDraft(day, hour) {
    const r = day === undefined ? this._rangeDays() : null;
    if (r) {
      return { title: "", users: [], all_day: true, sd: ymd(r.a), st: "09:00", ed: ymd(r.b), et: "10:00", freq: "", until: "",
        reminders: [...(this._defaults?.reminders || [])], location: "", description: "", birth_year: "" };
    }
    const base = day ? sod(day) : sod(this._view === "month" ? this._sel : this._date);
    let s;
    if (hour !== undefined) { s = new Date(base); s.setHours(hour, 0, 0, 0); }
    else {
      const now = new Date();
      s = new Date(base); s.setHours(sameDay(base, now) ? Math.min(now.getHours() + 1, 23) : 9, 0, 0, 0);
    }
    const e = new Date(s.getTime() + 3600000);
    return { title: "", users: [], all_day: false, sd: ymd(s), st: hm(s), ed: ymd(e), et: hm(e), freq: "", until: "", reminders: [...(this._defaults?.reminders || [])], location: "", description: "", birth_year: "" };
  }

  _draftFromEvent(ev, occurrence = false) {
    // Serie: Serien-Daten bearbeiten; occurrence = nur dieses Vorkommen (Daten des Vorkommens)
    const s = ev.all_day ? parseYmd(occurrence ? ev.start : (ev.series_start || ev.start)) : new Date(occurrence ? ev.start : (ev.series_start || ev.start));
    const e = ev.all_day ? addDays(parseYmd(occurrence ? ev.end : (ev.series_end || ev.end)), -1) : new Date(occurrence ? ev.end : (ev.series_end || ev.end));
    return {
      birth_year: ev.birth_year || "",
      title: ev.title, users: [...ev.users], all_day: !!ev.all_day, sd: ymd(s), st: ev.all_day ? "09:00" : hm(s), ed: ymd(e), et: ev.all_day ? "10:00" : hm(e),
      freq: ev.recurrence ? ev.recurrence.freq : "", until: ev.recurrence?.until || "", reminders: [...(ev.reminders || [])], location: ev.location || "", description: ev.description || "",
    };
  }

  _sync() {
    const d = this._dlg; if (!d || d.mode !== "form") return;
    const r = this._portalRoot; if (!r) return;
    const v = (id) => r.getElementById(id);
    const x = d.draft;
    if (v("f-title")) x.title = v("f-title").value;
    if (v("f-sd")) x.sd = v("f-sd").value;
    if (v("f-ed")) x.ed = v("f-ed").value;
    if (v("f-st")) x.st = v("f-st").value;
    if (v("f-et")) x.et = v("f-et").value;
    if (v("f-freq")) x.freq = v("f-freq").value;
    if (v("f-until")) x.until = v("f-until").value;
    if (v("f-loc")) x.location = v("f-loc").value;
    if (v("f-desc")) x.description = v("f-desc").value;
    if (v("f-by")) x.birth_year = v("f-by").value;
  }

  async _save() {
    this._sync();
    const d = this._dlg, x = d.draft;
    const fail = (m) => { d.err = m; this._render(); };
    if (!x.title.trim()) return fail(T.errTitle);
    if (!x.users.length) return fail(T.errPerson);
    if (!x.sd) return fail(T.errDate);
    let start, end;
    if (x.all_day) {
      const s = parseYmd(x.sd); let e = parseYmd(x.ed || x.sd);
      if (e < s) e = s;
      start = ymd(s); end = ymd(addDays(e, 1));
    } else {
      const s = new Date(`${x.sd}T${x.st || "09:00"}`); let e = new Date(`${x.ed || x.sd}T${x.et || x.st}`);
      if (e <= s) e = new Date(s.getTime() + 3600000);
      start = localIso(s); end = localIso(e);
    }
    const event = {
      title: x.title.trim(), users: x.users, all_day: x.all_day, start, end,
      recurrence: x.freq ? { freq: x.freq, interval: 1, until: x.until || null } : null,
      reminders: x.all_day ? [...new Set(x.reminders.map((m) => (m < 1440 ? 0 : m)))] : x.reminders,
      location: x.location.trim(), description: x.description.trim(),
      birth_year: !d.occ && x.freq === "yearly" && String(x.birth_year || "").trim() ? Number(x.birth_year) : null,
    };
    if (d.occ) event.recurrence = null;
    try {
      if (d.uid) await this._hass.callWS({ type: "familienkalender/update", uid: d.uid, event, ...(d.occ ? { occurrence: d.occ } : {}) });
      else await this._hass.callWS({ type: "familienkalender/create", event });
      this._dlg = null;
      if (!d.uid) this._rsel = null;
      this._toast(d.uid ? T.saved : T.created);
      await this._load();
    } catch (err) { fail(this._err(err, T.saveFail)); }
  }

  async _delete(one) {
    const ev = this._dlg.ev;
    try {
      const res = await this._hass.callWS({ type: "familienkalender/delete", uid: ev.uid, ...(one ? { occurrence: ymd(ev._s) } : {}) });
      this._dlg = null;
      this._toast(T.deleted, res && res.restore ? { label: T.undo, fn: async () => {
        try { await this._hass.callWS({ type: "familienkalender/restore", event: res.restore }); this._toast(T.restored); this._load(); }
        catch (err) { this._toast(this._err(err, T.saveFail)); }
      } } : null);
      await this._load();
    } catch (err) { this._toast(this._err(err, T.deleteFail)); }
  }

  async _import() {
    const d = this._dlg;
    const f = this._portalRoot && this._portalRoot.getElementById("f-file");
    if (!f || !f.files.length) { d.err = T.errFile; return this._render(); }
    if (!d.users.length) { d.err = T.errPerson; return this._render(); }
    d.busy = true; d.err = null; this._render();
    try {
      const text = await f.files[0].text();
      const res = await this._hass.callWS({ type: "familienkalender/import", ics: text, users: d.users });
      this._dlg = null;
      this._toast(T.imported(res.imported));
      await this._load();
    } catch (err) { d.busy = false; d.err = this._err(err, T.importFail); this._render(); }
  }

  async _export() {
    try {
      const res = await this._hass.callWS({ type: "familienkalender/export", users: this._dlg.users, lang: LANG });
      const blob = new Blob([res.ics], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `familienkalender-${ymd(new Date())}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      this._dlg = null; this._render();
    } catch (err) { this._toast(this._err(err, T.exportFail)); }
  }

  /* ----- Mehrere Tage markieren -----
     Maus: drücken und über die Tage ziehen (oder Umschalt-Klick). Touch: kurz gedrückt halten, dann ziehen. */
  _rangeDays() {
    if (!this._rsel || !this._perm.write) return null;
    let a = sod(this._rsel.a), b = sod(this._rsel.b);
    if (b < a) [a, b] = [b, a];
    return { a, b, n: Math.round((b - a) / 86400000) + 1 };
  }

  _rngCls(day) {
    const r = this._rangeDays();
    if (!r || day < r.a || day > r.b) return "";
    return " rng" + (sameDay(day, r.a) ? " rs" : "") + (sameDay(day, r.b) ? " re" : "");
  }

  _paintRange() {
    // Nur Klassen umschalten (kein komplettes Neuzeichnen während des Ziehens)
    this.shadowRoot.querySelectorAll("[data-rd]").forEach((el) => {
      const c = this._rngCls(parseYmd(el.dataset.rd)).trim().split(" ").filter(Boolean);
      el.classList.remove("rng", "rs", "re"); c.forEach((x) => el.classList.add(x));
    });
  }

  _bindRange() {
    if (!this._perm.write) return;
    this.shadowRoot.querySelectorAll("[data-rd]").forEach((el) => {
      el.addEventListener("pointerdown", (e) => this._rngDown(e, el));
      el.addEventListener("contextmenu", (e) => { if (this._rs && this._rs.armed) e.preventDefault(); }); // langes Drücken: kein Kontextmenü
    });
  }

  _rngDown(e, el) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.shiftKey) return;
    // Nicht auf Terminen, „+N weitere“ oder Tagesnummer starten (die haben eigene Aktionen)
    if (e.composedPath().some((n) => n && n.classList && (n.classList.contains("ev") || n.classList.contains("bar") || n.classList.contains("more") || n.classList.contains("dnum") || n.classList.contains("dn")))) return;
    const touch = e.pointerType !== "mouse";
    const st = this._rs = { day: parseYmd(el.dataset.rd), x: e.clientX, y: e.clientY, armed: !touch, moved: false, id: e.pointerId };
    const dayAt = (ev) => {
      // auch unter durchgehenden Balken den Tag finden
      const list = this.shadowRoot.elementsFromPoint ? this.shadowRoot.elementsFromPoint(ev.clientX, ev.clientY) : [];
      for (const t of list) { const c = t.closest && t.closest("[data-rd]"); if (c) return parseYmd(c.dataset.rd); }
      return null;
    };
    const move = (ev) => {
      if (ev.pointerId !== st.id) return;
      if (!st.armed) {
        if (Math.hypot(ev.clientX - st.x, ev.clientY - st.y) > 8) cleanup(); // Wischen = Scrollen
        return;
      }
      const d = dayAt(ev);
      if (!d) return;
      if (!st.moved && sameDay(d, st.day) && touch === false) return;
      if (!st.moved) { st.moved = true; this._rsel = { a: st.day, b: st.day }; }
      if (!sameDay(d, this._rsel.b)) { this._rsel.b = d; this._paintRange(); this._rngBarUpdate(); }
      ev.preventDefault();
    };
    const up = (ev) => {
      if (ev.pointerId !== st.id) return;
      const done = st.moved;
      cleanup();
      if (done) {
        this._sel = sod(this._rsel.b); this._selShown = false;
        this._rngJustSet = true; setTimeout(() => { this._rngJustSet = false; }, 350);
        this._render();
      }
    };
    const cleanup = () => {
      clearTimeout(st.timer); this._rs = null;
      window.removeEventListener("pointermove", move, true); window.removeEventListener("pointerup", up, true); window.removeEventListener("pointercancel", up, true);
    };
    if (touch) {
      st.timer = setTimeout(() => {
        st.armed = true; st.moved = true; this._rsel = { a: st.day, b: st.day };
        try { navigator.vibrate && navigator.vibrate(15); } catch (_) {}
        this._paintRange(); this._rngBarUpdate();
      }, 450);
    }
    window.addEventListener("pointermove", move, true); window.addEventListener("pointerup", up, true); window.addEventListener("pointercancel", up, true);
  }

  _rngBarUpdate() {
    // Hinweis „N Tage markiert“ live aktualisieren
    const chips = this.shadowRoot.querySelector(".chips"); if (!chips) return;
    const r = this._rangeDays();
    let bar = chips.querySelector(".rngbar");
    if (!r) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement("span"); bar.className = "rngbar"; chips.prepend(bar); }
    bar.innerHTML = `${T.rangeN(r.n)}<button data-a="range-clear" title="${T.rangeClear}" aria-label="${T.rangeClear}">✕</button>`;
    bar.querySelector("button").addEventListener("click", (e) => this._click(e, e.currentTarget));
  }

  /* ----- Ziehen & Verschieben -----
     Maus: sofort ziehen. Touch: kurz gedrückt halten (Scrollen bleibt so möglich).
     Unterer Rand eines Termins: Dauer ändern. Raster: 15 Minuten. */
  _bindDrag() {
    if (!this._perm.write) return;
    this.shadowRoot.querySelectorAll('.tev[data-drag="1"]').forEach((el) => {
      el.addEventListener("pointerdown", (e) => this._dragDown(e, el));
    });
    if (!this._touchBlock) {
      this._touchBlock = (e) => { if ((this._drag && this._drag.armed) || (this._rs && this._rs.armed)) e.preventDefault(); };
      window.addEventListener("touchmove", this._touchBlock, { passive: false });
    }
  }

  _dragDown(e, el) {
    if (e.button !== undefined && e.button !== 0) return;
    const ev = this._events.find((x) => x.key === el.dataset.k);
    if (!ev || ev.all_day) return;
    const col = el.closest(".tg-col");
    const rect = col.getBoundingClientRect();
    const H = this._hourPx();
    const mode = e.target && e.target.dataset && e.target.dataset.rs ? "resize" : "move";
    const pointerMin = ((e.clientY - rect.top) / H) * 60;
    const dayStart = parseYmd(col.dataset.d);
    this._drag = {
      ev, el, mode, x0: e.clientX, y0: e.clientY, touch: e.pointerType === "touch", armed: e.pointerType !== "touch",
      grab: pointerMin - (ev._s - dayStart) / 60000, s: ev._s, e: ev._e, moved: false,
    };
    if (this._drag.touch) {
      this._drag.timer = setTimeout(() => { if (this._drag) { this._drag.armed = true; el.classList.add("armed"); if (navigator.vibrate) navigator.vibrate(15); } }, 350);
    }
    const move = (m) => this._dragMove(m);
    const up = (u) => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); this._dragUp(u); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  _dragMove(e) {
    const g = this._drag; if (!g) return;
    const dist = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);
    if (!g.armed) { if (dist > 8) { clearTimeout(g.timer); this._drag = null; } return; }
    if (!g.moved && dist < 4) return;
    g.moved = true;
    e.preventDefault();
    const H = this._hourPx();
    const snap = (min) => Math.round(min / 15) * 15;
    let col = null;
    if (g.mode === "move") {
      const hit = this.shadowRoot.elementsFromPoint ? this.shadowRoot.elementsFromPoint(e.clientX, e.clientY) : [];
      col = hit.find((n) => n.classList && n.classList.contains("tg-col")) || g.el.closest(".tg-col");
    } else col = g.el.closest(".tg-col");
    const rect = col.getBoundingClientRect();
    const dayStart = parseYmd(col.dataset.d);
    const pMin = ((e.clientY - rect.top) / H) * 60;
    const dur = g.ev._e - g.ev._s;
    if (g.mode === "move") {
      const startMin = Math.max(0, Math.min(24 * 60 - 15, snap(pMin - g.grab)));
      g.s = new Date(dayStart.getTime() + startMin * 60000);
      g.e = new Date(g.s.getTime() + dur);
    } else {
      const sDay = sod(g.ev._s);
      const endMin = Math.max(snap(pMin), (g.ev._s - sDay) / 60000 + 15);
      g.s = g.ev._s;
      g.e = new Date(sDay.getTime() + Math.min(endMin, 24 * 60) * 60000);
    }
    // Vorschau: Element in die Zielspalte setzen und Position/Zeit anzeigen
    const el = g.el;
    el.classList.add("dragging"); el.classList.remove("armed");
    if (el.parentElement !== col) { col.appendChild(el); el.style.left = "2px"; el.style.width = "calc(100% - 4px)"; }
    const ds = sod(g.s);
    el.style.top = `${((g.s - ds) / 3600000) * H}px`;
    el.style.height = `${Math.max(((g.e - g.s) / 3600000) * H - 2, 22)}px`;
    const t = el.querySelector(".t");
    if (t) t.textContent = `${hm(g.s)} – ${hm(g.e)}`;
  }

  _dragUp() {
    const g = this._drag; this._drag = null;
    if (!g) return;
    clearTimeout(g.timer);
    g.el.classList.remove("armed");
    if (!g.moved) return; // war ein normaler Klick/Tipp
    this._suppressClick = true; setTimeout(() => { this._suppressClick = false; }, 400);
    if (g.s.getTime() === g.ev._s.getTime() && g.e.getTime() === g.ev._e.getTime()) { this._render(); return; }
    if (g.ev.recurrence) { this._dlg = { mode: "scope", ev: g.ev, drag: g }; this._render(); return; }
    this._applyDrag(g, "single");
  }

  _payload(ev, s, e) {
    return {
      title: ev.title, users: ev.users, all_day: false, start: localIso(s), end: localIso(e),
      recurrence: ev.recurrence || null, reminders: ev.reminders || [], location: ev.location || "",
      description: ev.description || "", birth_year: ev.birth_year || null,
    };
  }

  async _applyDrag(g, scope) {
    const ev = g.ev;
    this._dlg = null;
    try {
      if (scope === "one") {
        await this._hass.callWS({ type: "familienkalender/update", uid: ev.uid, occurrence: ymd(ev._s), event: { ...this._payload(ev, g.s, g.e), recurrence: null } });
        this._toast(T.moved);
      } else if (scope === "all") {
        // ganze Serie um denselben Abstand verschieben
        const ds = g.s - ev._s, de = g.e - ev._e;
        const ss = new Date(new Date(ev.series_start).getTime() + ds), se = new Date(new Date(ev.series_end).getTime() + de);
        await this._hass.callWS({ type: "familienkalender/update", uid: ev.uid, event: this._payload(ev, ss, se) });
        this._toast(T.moved);
      } else {
        await this._hass.callWS({ type: "familienkalender/update", uid: ev.uid, event: this._payload(ev, g.s, g.e) });
        const old = this._payload(ev, ev._s, ev._e);
        this._toast(T.moved, { label: T.undo, fn: async () => {
          try { await this._hass.callWS({ type: "familienkalender/update", uid: ev.uid, event: old }); this._load(); } catch (err) { this._toast(this._err(err, T.saveFail)); }
        } });
      }
    } catch (err) { this._toast(this._err(err, T.saveFail)); }
    await this._load();
  }

  /* ----- Wandtablet-Modus (pro HA-Konto in den Einstellungen) ----- */
  _kioskSetup() {
    const k = this._kiosk;
    if (!k || !k.enabled || this._kioskTimer) return;
    this._lastAct = Date.now();
    this._actFn = () => { this._lastAct = Date.now(); if (this._night) { this._night = false; this._applyNight(); } };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => window.addEventListener(t, this._actFn, { passive: true, capture: true }));
    this._kioskTimer = setInterval(() => this._kioskTick(), 15000);
    this._clockTimer = setInterval(() => this._updateClock(), 10000);
  }

  _kioskStop() {
    clearInterval(this._kioskTimer); clearInterval(this._clockTimer); this._kioskTimer = null; this._clockTimer = null;
    if (this._actFn) ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => window.removeEventListener(t, this._actFn, { capture: true }));
    this._actFn = null;
  }

  _inNight(now) {
    const k = this._kiosk; if (!k || !k.night) return false;
    const toMin = (s) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
    const n = now.getHours() * 60 + now.getMinutes(), a = toMin(k.night_start), b = toMin(k.night_end);
    return a <= b ? n >= a && n < b : n >= a || n < b;
  }

  _kioskTick() {
    const k = this._kiosk; if (!k || !k.enabled) return;
    const idle = Date.now() - this._lastAct;
    if (idle > (k.timeout || 5) * 60000) {
      const today = sod(new Date());
      const initial = ["month", "week", "day"].includes(this._cfg.initial_view) ? this._cfg.initial_view : "month";
      const atHome = this._view === initial && sameDay(this._sel, today) && (initial === "month" ? this._date.getMonth() === today.getMonth() && this._date.getFullYear() === today.getFullYear() : sameDay(this._date, today));
      if (!atHome || this._dlg || this._jump || this._menu || this._search) {
        this._dlg = null; this._jump = null; this._menu = false; this._selShown = false; this._search = null;
        this._view = initial; this._sel = today; this._date = initial === "month" ? new Date(today.getFullYear(), today.getMonth(), 1) : today;
        this._resetScroll = true; this._load();
      }
    }
    const night = this._inNight(new Date()) && idle > 60000;
    if (night !== !!this._night) { this._night = night; this._applyNight(); }
  }

  _flattenTheme() {
    const st = this.style;
    const solid = !!(this._kiosk && this._kiosk.enabled && this._kiosk.solid);
    if (!solid) {
      if (this._themeKey === "") return false;
      this._themeKey = ""; this._bg = null;
      ["--fk-bg", "--fk-line", "--fk-bg2", "--fk-ferien", "--fk-ferien-other", "--fk-band", "--fk-dim"].forEach((n) => st.removeProperty(n));
      return true;
    }
    const cs = getComputedStyle(this);
    const v = (n) => cs.getPropertyValue(n).trim();
    const key = ["--primary-background-color", "--ha-card-background", "--card-background-color", "--divider-color", "--secondary-background-color", "--primary-text-color"].map(v).join("|");
    if (key === this._themeKey) return false;
    this._themeKey = key;
    const page = flatten(v("--primary-background-color") || "#fafafa", "#fff");
    const bg = flatten(v("--ha-card-background") || v("--card-background-color") || "#fff", page);
    const line = flatten(v("--divider-color") || "rgba(0,0,0,.12)", bg);
    const bg2 = flatten(v("--secondary-background-color") || "#f6f6f6", bg);
    const txt = flatten(v("--primary-text-color") || "#212121", bg);
    this._bg = bg;
    st.setProperty("--fk-bg", bg); st.setProperty("--fk-line", line); st.setProperty("--fk-bg2", bg2);
    st.setProperty("--fk-ferien", mixOn("#2ea05a", 0.09, bg));
    st.setProperty("--fk-ferien-other", mixOn("#2ea05a", 0.09, bg2));
    st.setProperty("--fk-band", mixOn("#2e9e5a", 0.55, bg));
    const t = /(\d+)\D+(\d+)\D+(\d+)/.exec(txt);
    if (t) st.setProperty("--fk-dim", mixOn("#" + [t[1], t[2], t[3]].map((x) => (+x).toString(16).padStart(2, "0")).join(""), 0.42, bg2));
    return true;
  }

  _applyNight() { const c = this.shadowRoot.querySelector(".card"); if (c) c.classList.toggle("night", !!this._night); }

  _clockHtml() {
    if (!this._kiosk || !this._kiosk.enabled) return "";
    const now = new Date();
    return `<div class="clockbox"><span class="clk">${hm(now)}</span><span class="kdate kd-l">${esc(longDate(now))}</span><span class="kdate kd-s">${esc(this._shortClockDate(now))}</span></div>`;
  }

  _shortClockDate(d) {
    // kurzes Datum für schmalere Wandtablets, z. B. „Mo, 16. Nov.“ / „nov. 16., H“
    return T.shortDate(T.wd[(d.getDay() + 6) % 7], d.getDate(), T.monthsShort[d.getMonth()]);
  }

  _updateClock() {
    const c = this.shadowRoot.querySelector(".clockbox .clk");
    const dl = this.shadowRoot.querySelector(".clockbox .kd-l"), ds = this.shadowRoot.querySelector(".clockbox .kd-s");
    const now = new Date();
    const t1 = hm(now), t2 = longDate(now), t3 = this._shortClockDate(now);
    if (c && c.textContent !== t1) c.textContent = t1;
    if (dl && dl.textContent !== t2) dl.textContent = t2;
    if (ds && ds.textContent !== t3) ds.textContent = t3;
  }

  _err(err, fallback) {
    // Server-Fehler kommen mit Code („fk_…“) und werden hier übersetzt
    const code = String(err?.code || "").replace(/^fk_/, "");
    return T.srv[code] || (code === "unauthorized" ? T.srv.unauthorized : null) || fallback;
  }

  _toast(msg, action = null) {
    this._toastMsg = msg; this._toastAct = action; this._render();
    clearTimeout(this._tt);
    this._tt = setTimeout(() => { this._toastMsg = null; this._toastAct = null; this._render(); }, action ? 7000 : 2600);
  }

  _saveFilter() {
    try { localStorage.setItem("familienkalender-filter", JSON.stringify({ hidden: [...this._hidden], hol: this._showHol, fer: this._showFer })); } catch (e) { /* ignorieren */ }
  }

  _move(dir) {
    const d = this._date;
    if (this._view === "month") { this._date = new Date(d.getFullYear(), d.getMonth() + dir, 1); this._sel = sameDay(new Date(this._date.getFullYear(), this._date.getMonth(), 1), new Date(new Date().getFullYear(), new Date().getMonth(), 1)) ? sod(new Date()) : this._date; }
    else if (this._view === "list") this._date = new Date(d.getFullYear(), d.getMonth() + dir * this._listMonths(), d.getDate());
    else this._date = addDays(d, dir * (this._view === "week" ? 7 : 1));
    this._load();
  }

  _bind() {
    this.shadowRoot.querySelectorAll("[data-a]").forEach((el) => el.addEventListener("click", (e) => this._click(e, el)));
    this._bindDrag();
    this._bindRange();
    const ji = this.shadowRoot.getElementById("jump-input");
    if (ji) ji.addEventListener("change", () => { if (ji.value) this._jumpTo(parseYmd(ji.value)); });
    if ((this._jump || this._menu) && !this._outside) {
      // Klick außerhalb schließt Sprung-Kalender bzw. Menü
      this._outside = (e) => {
        const path = e.composedPath();
        if (path.some((n) => n && n.classList && (n.classList.contains("jump") || n.classList.contains("menu") || n.classList.contains("today-btn") || n.dataset?.a === "menu"))) return;
        this._jump = null; this._menu = false;
        window.removeEventListener("click", this._outside, true); this._outside = null;
        this._render();
      };
      window.addEventListener("click", this._outside, true);
    } else if (!this._jump && !this._menu && this._outside) {
      window.removeEventListener("click", this._outside, true); this._outside = null;
    }
    const root = this._portalRoot;
    if (!root) return;
    root.querySelectorAll("[data-a]").forEach((el) => el.addEventListener("click", (e) => this._click(e, el)));
    const freq = root.getElementById("f-freq");
    if (freq) freq.addEventListener("change", () => { this._sync(); this._render(); });
    const sd = root.getElementById("f-sd");
    if (sd) sd.addEventListener("change", () => {
      // Ende mitziehen, wenn es vor dem Beginn läge
      const ed = root.getElementById("f-ed");
      if (ed && (!ed.value || ed.value < sd.value)) ed.value = sd.value;
    });
    const t = root.getElementById("f-title");
    if (t) t.addEventListener("keydown", (e) => { if (e.key === "Enter") this._save(); });
  }

  _click(e, el) {
    const a = el.dataset.a;
    if (a === "ovl") { if (e.target === el) { this._dlg = null; this._render(); } return; }
    e.stopPropagation();
    const d = this._dlg;
    if (this._suppressClick && (a === "open" || a === "slot")) return; // Klick direkt nach dem Ziehen ignorieren
    const W = ["add", "add-on", "slot", "save", "edit", "dup", "scope-one", "scope-all", "import", "do-import", "pick", "pick-all", "who-next"];
    if (W.includes(a) && !this._perm.write) return;
    if (["del", "del-one", "del-all"].includes(a) && !this._perm.delete) return;
    switch (a) {
      case "prev": return this._move(-1);
      case "next": return this._move(1);
      case "today": this._date = sod(new Date()); this._sel = sod(new Date()); this._resetScroll = true; return this._load();
      case "jump-open":
        this._menu = false;
        this._jump = this._jump ? null : { month: new Date((this._view === "month" ? this._sel : this._date).getFullYear(), (this._view === "month" ? this._sel : this._date).getMonth(), 1) };
        this._jumpLoad();
        return this._render();
      case "jump-prev": this._jump.month = new Date(this._jump.month.getFullYear(), this._jump.month.getMonth() - 1, 1); this._jumpLoad(); return this._render();
      case "jump-next": this._jump.month = new Date(this._jump.month.getFullYear(), this._jump.month.getMonth() + 1, 1); this._jumpLoad(); return this._render();
      case "jump-today": return this._jumpTo(sod(new Date()));
      case "jump-day": return this._jumpTo(parseYmd(el.dataset.d));
      case "view":
        this._view = el.dataset.v;
        if (this._view === "list") this._date = sod(new Date()); // Übersicht beginnt heute
        else if (this._view !== "month") this._date = sod(this._sel);
        else this._date = new Date(this._sel.getFullYear(), this._sel.getMonth(), 1);
        this._resetScroll = true; return this._load();
      case "menu": this._jump = null; this._menu = !this._menu; return this._render();
      case "toggle-user": { const id = el.dataset.id; this._hidden.has(id) ? this._hidden.delete(id) : this._hidden.add(id); this._saveFilter(); this._jumpCache = {}; this._jumpLoad(); return this._render(); }
      case "toggle-hol": this._showHol = !this._showHol; this._saveFilter(); return this._render();
      case "toggle-fer": this._showFer = !this._showFer; this._saveFilter(); return this._render();
      case "day": case "select": {
        if (this._rngJustSet) return; // Klick am Ende einer Zieh-Markierung
        const day = parseYmd(el.dataset.d);
        if (e.shiftKey && this._perm.write) { this._rsel = { a: sod(this._sel), b: day }; this._sel = day; if (a === "day") this._selShown = true; return this._render(); }
        this._rsel = null; this._sel = day; if (a === "day") this._selShown = true; return this._render();
      }
      case "range-clear": this._rsel = null; return this._render();
      case "list-n": this._setListMonths(+el.dataset.n); return this._load();
      case "search":
        if (this._search) { this._search = null; return this._render(); }
        this._menu = false; this._jump = null;
        this._search = { q: "", data: null }; this._searchFocus = true; this._searchLoad(); return this._render();
      case "search-close": this._search = null; return this._render();
      case "goto-day": this._date = parseYmd(el.dataset.d); this._sel = this._date; this._view = "day"; this._resetScroll = true; return this._load();
      case "add": { this._menu = false; this._jump = null; const ps = this._persons(); this._dlg = { mode: "who", users: ps.length === 1 ? [ps[0].id] : [], draft: this._newDraft() }; return this._render(); }
      case "add-on": this._dlg = { mode: "who", users: [], draft: this._newDraft(parseYmd(el.dataset.d)) }; return this._render();
      case "slot": {
        const rect = el.getBoundingClientRect();
        const hour = Math.max(0, Math.min(23, Math.floor((e.clientY - rect.top) / this._hourPx())));
        this._dlg = { mode: "who", users: [], draft: this._newDraft(parseYmd(el.dataset.d), hour) };
        return this._render();
      }
      case "pick": { const id = el.dataset.id; d.users = d.users.includes(id) ? d.users.filter((x) => x !== id) : [...d.users, id]; return this._render(); }
      case "pick-all": { const ps = this._persons(); d.users = ps.every((u) => d.users.includes(u.id)) ? d.users.filter((id) => !ps.some((u) => u.id === id)) : [...new Set([...d.users, ...ps.map((u) => u.id)])]; return this._render(); }
      case "who-next": d.draft.users = [...d.users]; this._dlg = { mode: "form", draft: d.draft }; this._focusNext = true; return this._render();
      case "f-user": { this._sync(); const x = d.draft, id = el.dataset.id; x.users = x.users.includes(id) ? x.users.filter((u) => u !== id) : [...x.users, id]; return this._render(); }
      case "f-allday": this._sync(); d.draft.all_day = !d.draft.all_day; return this._render();
      case "f-rem": { this._sync(); const m = Number(el.dataset.m), x = d.draft; x.reminders = x.reminders.includes(m) ? x.reminders.filter((r) => r !== m) : [...x.reminders, m].sort((p, q) => p - q); return this._render(); }
      case "save": return this._save();
      case "open": {
        const ev = this._events.find((x) => x.key === el.dataset.k) || (this._search && this._search.data || []).find((x) => x.key === el.dataset.k);
        if (ev) { this._dlg = { mode: "detail", ev }; this._render(); }
        return;
      }
      case "edit":
        if (d.ev.recurrence) { this._dlg = { mode: "scope", ev: d.ev }; return this._render(); }
        this._dlg = { mode: "form", uid: d.ev.uid, draft: this._draftFromEvent(d.ev) }; return this._render();
      case "scope-one":
        if (d.drag) return this._applyDrag(d.drag, "one");
        this._dlg = { mode: "form", uid: d.ev.uid, occ: ymd(d.ev._s), draft: { ...this._draftFromEvent(d.ev, true), freq: "", until: "" } }; return this._render();
      case "scope-all":
        if (d.drag) return this._applyDrag(d.drag, "all");
        this._dlg = { mode: "form", uid: d.ev.uid, draft: this._draftFromEvent(d.ev) }; return this._render();
      case "scope-cancel": this._dlg = null; return this._render();
      case "dup": {
        const dr = this._draftFromEvent(d.ev, true);
        dr.freq = d.ev.recurrence ? d.ev.recurrence.freq : ""; dr.until = d.ev.recurrence?.until || "";
        this._dlg = { mode: "form", draft: dr }; this._focusNext = true; return this._render();
      }
      case "toast-act": { const act = this._toastAct; this._toastMsg = null; this._toastAct = null; clearTimeout(this._tt); this._render(); if (act) act.fn(); return; }
      case "del": this._dlg = { mode: "del", ev: d.ev }; return this._render();
      case "del-one": return this._delete(true);
      case "del-all": return this._delete(false);
      case "import": this._menu = false; this._dlg = { mode: "import", users: [] }; return this._render();
      case "export": this._menu = false; this._dlg = { mode: "export", users: this._users.map((u) => u.id) }; return this._render();
      case "i-user": { const id = el.dataset.id; d.users = d.users.includes(id) ? d.users.filter((x) => x !== id) : [...d.users, id]; return this._render(); }
      case "do-import": return this._import();
      case "do-export": return this._export();
      case "close": this._dlg = null; return this._render();
      default:
    }
  }
}

/*
 * Registrierung: Ab HA 2026.8 ersetzt das Frontend window.customElements durch eine
 * „scoped registry“. Wird diese Datei vorher geladen, wäre die Karte unsichtbar.
 * Darum: sofort registrieren und danach erneut in der jeweils aktuellen Registry.
 */
const fkDefine = () => {
  const reg = window.customElements; // bei jedem Aufruf neu lesen
  if (!reg || reg.get("familienkalender-card")) return;
  try { reg.define("familienkalender-card", class extends FamilienkalenderCard {}); } catch (e) { /* bereits definiert */ }
};
fkDefine();
try { window.customElements.whenDefined("home-assistant").then(fkDefine); } catch (e) { /* ignorieren */ }
{
  let n = 0;
  const t = setInterval(() => { fkDefine(); if (++n > 60) clearInterval(t); }, 250);
}
window.addEventListener("load", fkDefine);

/*
 * Selbstheilung: Hat das Dashboard die Karte angelegt, bevor diese Datei geladen war,
 * zeigt Home Assistant „Konfigurationsfehler“. Wir suchen solche Fehlerkarten und
 * lassen sie neu aufbauen – genau das, was sonst ein Neuladen des Browsers bewirkt.
 */
const FK_TYPE = "custom:familienkalender-card";
const fkIsOurError = (el) => {
  const tag = el.localName || "";
  if (!tag.includes("error-card") && tag !== "hui-error-card") return false;
  const cfgs = [el._config, el.config, el._origConfig, el.origConfig, el._config && el._config.origConfig, el.config && el.config.origConfig];
  if (cfgs.some((c) => c && c.type === FK_TYPE)) return true;
  try { return ((el.shadowRoot && el.shadowRoot.textContent) || el.textContent || "").includes("familienkalender-card"); } catch (e) { return false; }
};
const fkHeal = () => {
  fkDefine();
  if (!window.customElements || !window.customElements.get("familienkalender-card")) return 0;
  let fixed = 0, seen = 0;
  const stack = [document.documentElement];
  while (stack.length && seen < 20000) {
    const node = stack.pop(); seen++;
    if (node.nodeType === 1 && fkIsOurError(node)) {
      node.dispatchEvent(new Event("ll-rebuild", { bubbles: true, composed: true }));
      fixed++;
    }
    if (node.shadowRoot) stack.push(node.shadowRoot);
    for (let c = node.firstElementChild; c; c = c.nextElementSibling) stack.push(c);
  }
  if (fixed) console.info(`Familienkalender: ${fixed} Karte(n) automatisch neu aufgebaut`);
  return fixed;
};
const fkHealSoon = () => [500, 1500, 3500, 7000, 12000].forEach((ms) => setTimeout(fkHeal, ms));
fkHealSoon();
window.addEventListener("location-changed", fkHealSoon);
window.addEventListener("popstate", fkHealSoon);
document.addEventListener("visibilitychange", () => { if (!document.hidden) fkHealSoon(); });
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "familienkalender-card")) {
  window.customCards.push({ type: "familienkalender-card", name: { de: "Familienkalender", hu: "Családi naptár", en: "Family calendar" }[pickLang(null, null)], description: { de: "Gemeinsamer Kalender für die ganze Familie", hu: "Közös naptár az egész családnak", en: "Shared calendar for the whole family" }[pickLang(null, null)], preview: false });
  console.info(`%c FAMILIENKALENDER %c ${FK_CARD_VERSION} `, "background:#03a9f4;color:#fff;border-radius:3px 0 0 3px", "background:#555;color:#fff;border-radius:0 3px 3px 0");
}
})();
