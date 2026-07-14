# Architektur

## Systemkontext

Kalenderanalyse ist eine ausschließlich im Browser ausgeführte, statische HTML-Anwendung. Sie besitzt keine Serverkomponente, kein Backend und keine fachliche Cloud-Abhängigkeit. Sämtliche Kalenderdaten werden auf dem Gerät der nutzenden Person eingelesen, normalisiert, gefiltert und analysiert. Die Anwendung sendet Kalenderinhalte nicht an einen Server.

Ein Produktionsbuild besteht aus statischem HTML, CSS und JavaScript. Er kann lokal oder über einen statischen Webserver ausgeliefert werden; der Auslieferungsweg ändert nichts daran, dass die vollständige fachliche Verarbeitung im Browser stattfindet.

## Status

- Basisarchitektur vorhanden
- Test- und CI-Integration ist eingerichtet
- Basiskennzahlen-Berechnungen implementiert
- Bibliotheksunabhängiges Kalendermodell und ICS-Normalisierung implementiert
- Auswahl und Validierung des Analysezeitraums implementiert
- Dateiauswahl und Verdrahtung des Imports in der Oberfläche noch nicht implementiert
- Weitergehende Auffälligkeiten und Empfehlungen geplant

## Technologien und Verantwortlichkeiten

| Technologie           | Verantwortung                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------- |
| React                 | Komponenten, lokaler UI-Zustand und Darstellung der Analyseauswahl und Ergebnisse            |
| TypeScript            | Statische Typisierung von Komponenten, internem Modell und Fachlogik                         |
| Vite                  | Lokaler Entwicklungsserver und Erzeugung des statischen Produktionsbuilds                    |
| Vitest                | Unit- und Komponententests in einer `jsdom`-Umgebung                                         |
| Testing Library       | Verhaltenstests der React-Komponenten aus Nutzersicht                                        |
| ESLint                | Statische Codeprüfung einschließlich React- und TypeScript-Regeln                            |
| Prettier              | Einheitliche Formatierung von Quellcode, Konfiguration und Dokumentation                     |
| `Intl.DateTimeFormat` | IANA-Zeitzonenregeln und Umwandlung zwischen absoluten Zeitpunkten und lokalen Kalenderdaten |

Der ICS-Parser ist eine projektspezifische TypeScript-Implementierung in `features/calendar/services/icsParser.ts`; es wird derzeit keine externe ICS-Parser-Bibliothek verwendet. Der Parser nimmt Text entgegen und greift weder auf Dateien noch auf das Netzwerk zu. Für die geplante Dateiauswahl kann die standardisierte Browser File API (`<input type="file">` und `File.text()`) verwendet werden. Diese Anbindung ist im aktuellen UI noch nicht umgesetzt und daher keine bereits verwendete Laufzeitkomponente.

## Schichten

### Shared Components

Wiederverwendbare UI-Komponenten:

- **SectionCard** – Einfache Darstellung von Feature-Übersichten
- **AppShell** – Layout-Komponente für die Anwendung
- **MetricsDisplay** – Darstellung von Basiskennzahlen mit Kennzahlenkarten und Tabelle

### Shared Services

Geschäftslogik und Berechnungen:

- **metrics** – Berechnung aller Basiskennzahlen:
  - Anzahl Termine
  - Meetingstunden (Summe aller Termindauern)
  - Durchschnittliche Meetingdauer
  - Freie Zeitblöcke (mit Zusammenführung überlappender/benachbarter Termine)
  - Termine pro Tag
- **analysisPeriod** – Erzeugung, Validierung und Anwendung von Analysezeiträumen
- **timeZone** – zentrale Kalender-, Tagesgrenzen- und Zeitzonenoperationen für `Europe/Berlin`

### Shared Types

Zentrale Typendefinitionen:

- **calendar.ts** – zentrales, bibliotheksunabhängiges `CalendarEvent`-Modell sowie `WorkingHoursConfig`, `BaseMetrics` und verwandte Typen
- **analysis.ts** – Typen für Presets, validierte Datumsschlüssel und absolute Grenzen des Analysezeitraums

### Features

Feature-Module für die Anwendung:

- **analysis** – Auswahl des Analysezeitraums, Aufruf der Kennzahlenberechnung und Ergebnisdarstellung
- **calendar** – ICS-Parsing und Normalisierung implementiert; Dateiauswahl und Integration in die Oberfläche geplant
- **insights** – Weitere Analysen und Empfehlungen (geplant)

### Anwendung und Darstellung

`App.tsx` setzt die Feature-Bereiche im gemeinsamen `AppShell` zusammen. React-Komponenten verwalten ausschließlich Darstellungs- und Auswahlzustand. Berechnungen liegen in Services und werden den Komponenten über typisierte Ergebnisse bereitgestellt. Es gibt derzeit kein globales Zustandsframework.

## Basiskennzahlen

### Definition

1. **Anzahl Termine** – Anzahl aller gültigen Termine, die den inklusiven Analysezeitraum berühren
2. **Meetingstunden** – Summe der einzelnen Termindauern innerhalb des Analysezeitraums in Minuten (intern), formatiert als Stunden. Überschneidende Termine werden hier einzeln gezählt.
3. **Durchschnittliche Meetingdauer** – Gesamt-Meetingminuten geteilt durch die Anzahl gültiger Termine; `null`, wenn keine gültigen Termine vorhanden sind
4. **Freie Zeitblöcke** – Kontinuierliche freie Zeit zwischen/um Termine innerhalb der Arbeitszeit
5. **Termine pro Tag** – Anzahl und anteilige Dauer der Termine pro lokalem Kalendertag. Alle Tage im Analysezeitraum werden ausgegeben, auch wenn ihre Anzahl null ist. Mehrtägige Termine zählen an jedem berührten Tag.

### Arbeitszeit-Konfiguration

Standardwerte (konfigurierbar):

- Arbeitsbeginn: 08:00 Uhr
- Arbeitsende: 18:00 Uhr
- Arbeitstage: Montag bis Freitag

### Berechnung der freien Zeitblöcke

1. Iteriere über jeden Tag im Analysezeitraum
2. Für Arbeitstage: Filtere Events des Tages
3. Beschneide Events auf Arbeitszeiten (außerhalb ignoriert)
4. Merge benachbarte und überlappende Events
5. Berechne Lücken zwischen Events innerhalb der Arbeitszeit
6. Ein vollständig freier Arbeitstag zählt als ein Zeitblock

### Sonderfälle

- **Keine Termine**: Vollständiger Tag als freier Block, Durchschnitt = null
- **Ganztägige Termine**: Ihre tatsächliche Start-/Enddauer fließt in Meetingstunden ein; bei freien Blöcken belegen sie nur die überschneidende Arbeitszeit
- **Termine über Mitternacht**: Werden pro berührtem Kalendertag betrachtet
- **Überschneidende Termine**: Werden nur für die belegte Arbeitszeit zusammengeführt; Anzahl und Meetingstunden bleiben terminbezogen
- **Direkt aneinandergrenzende Termine**: Werden als ein Block behandelt
- **Termine außerhalb Arbeitszeit**: Beeinflussen freie Zeitblöcke nicht
- **Negative, leere oder ungültige Dauern**: Werden vollständig aus den Kennzahlen ausgeschlossen
- **Zeitzonen und Sommerzeit**: `Date`-Zeitpunkte werden als absolute Zeitpunkte ausgewertet; Kalendertage und Arbeitszeiten werden ausdrücklich in der zentralen Analysezeitzone `Europe/Berlin` gebildet

## Kalenderimport und Normalisierung

### Internes Terminmodell

Alle Funktionen außerhalb der Importgrenze arbeiten ausschließlich mit `CalendarEvent` aus `src/shared/types/calendar.ts`. Ein normalisierter Termin enthält eine stabile ID, Titel, Beschreibung, Ort, Start, Ende, Dauer in Minuten, Ganztagskennzeichnung, Status, Organisator und Teilnehmende. Optionale Text- und Personenwerte werden einheitlich mit `null` dargestellt; Teilnehmende sind immer ein Array. Das Modell exportiert keine Rohstrukturen oder Typen eines ICS-Parsers.

### Verantwortlichkeiten und Datenfluss

```text
Nutzende wählen eine lokale ICS-Datei aus (UI-Anbindung geplant)
  → Browser liest die Datei als Text (File API)
  → `parseIcs` zerlegt die externe ICS-Syntax
  → Parsergrenze normalisiert Rohtermine zu `CalendarEvent[]`
  → `CalendarImportResult` enthält Termine und strukturierte Importhinweise
  → Analysezeitraum filtert und beschneidet absolute Terminintervalle
  → reine Analysefunktionen berechnen Kennzahlen und künftig Auffälligkeiten
  → React-Komponenten stellen Auswahl und Ergebnisse dar
```

Das Einlesen einer lokalen Datei ist von der Formatverarbeitung getrennt. `parseIcs` erhält nur den bereits gelesenen Text. Parserinterne Properties und Parameter bleiben innerhalb von `icsParser.ts`. Fehlerhafte Einträge werden ausgeschlossen und als strukturierte `CalendarImportIssue` gemeldet. Analyseservices und React-Komponenten kennen keine ICS-Rohstrukturen.

Die Dateiauswahl und das Einlesen sind noch nicht mit der Oberfläche verbunden. Parser, Normalisierung, Zeitraumlogik und Basisanalyse sind bereits implementiert und getestet. Nach der künftigen UI-Anbindung verbleiben Dateiinhalt, normalisierte Termine, Importhinweise und Analyseergebnisse im Arbeitsspeicher des Browsers; kein Schritt dieses Datenflusses benötigt eine Serverübertragung.

Für das Parsing wird keine zusätzliche Laufzeitabhängigkeit verwendet. Wiederholungsregeln werden derzeit nicht expandiert; bereits als einzelne `VEVENT`-Blöcke vorhandene Instanzen werden jeweils normalisiert.

### Datum, Uhrzeit und Zeitzonen

- UTC-Werte mit `Z` werden direkt als absolute `Date`-Zeitpunkte gespeichert.
- Werte mit `TZID` werden über die IANA-Zeitzonenunterstützung von `Intl.DateTimeFormat` in absolute Zeitpunkte überführt. Die jeweilige Sommerzeitregel bleibt dadurch erhalten.
- „Floating“-Zeitpunkte ohne UTC-Kennung oder `TZID` werden in der Analysezeitzone `Europe/Berlin` interpretiert.
- Ganztägige `VALUE=DATE`-Werte werden an Tagesgrenzen der Analysezeitzone erzeugt; das in ICS exklusive Enddatum bleibt erhalten.
- Ungültige Datumswerte, fehlende Grenzen und nicht positive Dauern werden verworfen und gemeldet.
- Doppelte UIDs erhalten in Eingabereihenfolge stabile Suffixe wie `#2`, damit keine Termine überschrieben werden.

Die Funktionen in `shared/services/timeZone.ts` kapseln Datumsschlüssel, zonierte Tages- und Arbeitszeitgrenzen sowie Intervallüberschneidungen. Dadurch hängt die fachliche Zuordnung nicht von der Prozesszeitzone des Browsers, Entwicklungsrechners oder CI-Runners ab. Sommer- und Winterzeit werden über die IANA-Regeln von `Intl.DateTimeFormat` berücksichtigt.

## Analysezeitraum

### Modell und Presets

`AnalysisDateRange` beschreibt den ausgewählten Zeitraum durch das Preset, inklusive Start- und Endtag als `YYYY-MM-DD` sowie absolute Grenzen. `startTime` ist der Beginn des Starttags; `endTime` ist die exklusive Grenze am Beginn des Folgetags. Beide Grenzen werden in `Europe/Berlin` erzeugt.

Die zentralen Funktionen in `shared/services/analysisPeriod.ts` definieren folgende Presets, jeweils einschließlich des aktuellen Berliner Kalendertags:

- **Kommende Woche:** aktueller Tag plus sechs weitere Kalendertage, insgesamt sieben Tage
- **Kommende zwei Wochen:** aktueller Tag plus dreizehn weitere Kalendertage, insgesamt vierzehn Tage
- **Kommender Monat:** bis zum korrespondierenden Tag des Folgemonats
- **Kommende drei Monate:** bis zum korrespondierenden Tag drei Monate später
- **Benutzerdefiniert:** frei gewählter Start- und Endtag einschließlich beider Tage

Existiert der korrespondierende Tag im Zielmonat nicht, wird dessen letzter gültiger Tag verwendet. Ein benutzerdefiniertes Enddatum vor dem Startdatum ist ungültig.

### Datenfluss und Grenzen

```text
Auswahl in AnalysisFeature
  → AnalysisDateRange
  → Termine auf [startTime, endTime) filtern und begrenzen
  → calculateBaseMetricsForRange
  → MetricsDisplay
```

Ein Termin wird berücksichtigt, wenn er den halb-offenen absoluten Zeitraum `[startTime, endTime)` überschneidet. Überragende Teile werden vor zeitbasierten Kennzahlen abgeschnitten. Ein Termin, der exakt an `startTime` endet oder exakt an `endTime` beginnt, liegt außerhalb. Die Auswahl wird im Zustand der Analysekomponente gehalten und bleibt deshalb erhalten, wenn sich die übergebenen Importdaten ändern; eine dauerhafte Speicherung über einen Neustart erfolgt nicht.

## Zentrale Architekturentscheidungen

### Lokale Browser-Anwendung

Die Anwendung wird mit Vite als statisches HTML, CSS und JavaScript gebaut und vollständig im Browser ausgeführt. Diese Form schützt sensible Kalenderdaten, ermöglicht eine einfache Bereitstellung und vermeidet die Betriebs- und Sicherheitskomplexität eines Servers.

### Keine Serverkomponente und keine Cloud-Abhängigkeit

Es gibt kein Backend, keine API und keine serverseitige Verarbeitung. Entsprechend sind keine zentrale Speicherung, Authentifizierung oder Benutzerkonten vorgesehen. Die Kernfunktionen dürfen keine Cloud-Dienste benötigen. Statisches Hosting ist als optionaler Auslieferungsweg möglich, stellt aber keine fachliche Abhängigkeit dar: Ein lokal bereitgestellter Produktionsbuild muss dieselben Analysefunktionen ausführen können.

### Vollständige Verarbeitung im Browser

Dateiauswahl, Einlesen, Parsing, Normalisierung, Zeitraumfilterung, Analyse und Darstellung sind als Browser-Datenfluss vorgesehen. Kalenderdaten werden nicht automatisch übertragen. Parser und Fachservices besitzen keine Netzwerkverantwortung.

### Frühe Normalisierung in ein internes Modell

Externe ICS-Strukturen werden an der Importgrenze in `CalendarEvent` überführt. Alle nachfolgenden Schichten verwenden ausschließlich dieses bibliotheksunabhängige Modell. Dadurch bleiben Analysen und Komponenten von Syntaxdetails und einer möglichen späteren Änderung des Parsers unabhängig.

### Trennung der Verantwortlichkeiten

Dateizugriff, Parsing und Normalisierung, Zeitraumlogik, Analyse sowie Darstellung sind getrennte Verantwortlichkeiten. Abhängigkeiten verlaufen von React-Komponenten zu typisierten Fachservices und vom Parser zum gemeinsamen Modell, nicht umgekehrt. Berechnungslogik wird nicht in UI-Komponenten dupliziert.

### Deterministische Zeitberechnung

Termine sind absolute `Date`-Zeitpunkte. Lokale Kalendertage und Arbeitszeiten werden ausdrücklich in der zentralen Analysezeitzone `Europe/Berlin` erzeugt. `Intl.DateTimeFormat` liefert die IANA-Zeitzonenregeln einschließlich Sommerzeit. Die fachlichen Ergebnisse hängen dadurch nicht von der Systemzeitzone des Browsers, Entwicklungsrechners oder CI-Runners ab.

### Testbare Fachlogik

Parser-, Zeitraum-, Zeitzonen- und Kennzahlenfunktionen sind möglichst rein und unabhängig von React. Vitest prüft diese Services direkt; Testing Library prüft die sichtbare Komponenteninteraktion. Grenzfälle wie ungültige Termine, lokale Tageswechsel und Sommerzeit werden mit synthetischen Daten abgedeckt.

### Keine unnötige Komplexität

Der aktuelle Umfang benötigt weder Datenbank noch globales Zustandsframework oder zusätzliche Infrastruktur. Neue Abhängigkeiten und Architekturbausteine werden nur eingeführt, wenn ein konkreter fachlicher Bedarf ihre Kosten rechtfertigt.

## Auslieferung und Betrieb

Ausführung und Auslieferung sind getrennt zu betrachten:

- `npm run dev` startet den lokalen Vite-Entwicklungsserver.
- `npm run build` erzeugt den statischen Produktionsbuild im Verzeichnis `dist`.
- Der Build kann über einen beliebigen lokalen oder entfernten statischen Webserver ausgeliefert werden.
- Eine statische Hosting-Plattform ist optional und verarbeitet keine Kalenderdaten, solange die Anwendung unverändert vollständig im Browser arbeitet.

Vites Entwicklungs- und Preview-Server dienen nur der Auslieferung statischer Anwendungsdateien. Sie sind keine fachlichen Serverkomponenten. Für einen zuverlässigen lokalen Betrieb soll der Produktionsbuild über einen statischen Webserver bereitgestellt werden; Browser-Sicherheitsregeln können Funktionen einer direkt per `file://` geöffneten Seite einschränken.

## Datenschutzfolgen

- Kalenderinhalte und Analyseergebnisse verbleiben im Browser und werden nicht automatisch übertragen.
- Die Anwendung speichert Kalenderdaten derzeit weder persistent noch serverseitig. Der React-Zustand besteht nur für die laufende Seite.
- Repository und automatisierte Tests verwenden keine echten Kalenderdaten, sondern kleine synthetische ICS-Beispiele und künstlich erzeugte Termine.
- Parser und Analyseservices benötigen keinen Netzwerkzugriff.

Die verbindlichen Datenschutzgrundsätze sind in [privacy.md](privacy.md) beschrieben. Die [Produktvision](product-vision.md) legt fest, dass spätere Funktionen die lokale Verarbeitung nicht stillschweigend aufheben dürfen.

## Abgrenzung

Nicht Bestandteil der aktuellen Architektur sind:

- Backend, serverseitige API oder serverseitige Verarbeitung
- Datenbank oder serverseitige Speicherung
- Authentifizierung und Benutzerkonten
- direkte Anbindung an Kalender-APIs
- Telemetrie, externe Analyse- oder Trackingdienste
- persistente Speicherung importierter Kalenderdaten durch die Anwendung
- Expansion von ICS-Wiederholungsregeln

## Tests und Qualitätssicherung

Service-Tests decken ICS-Parsing und Normalisierung, Zeitzonen- und Tagesgrenzen, Analysezeiträume und Basiskennzahlen ab. React-Komponententests prüfen Anwendung und Zeitrauminteraktion in `jsdom`. ESLint prüft TypeScript und React-Regeln; Prettier vereinheitlicht die Formatierung. Der Vite-Build führt zuvor die TypeScript-Prüfung aus.

Die GitHub-Actions-Pipeline installiert Abhängigkeiten reproduzierbar mit `npm ci` und führt Formatprüfung, Lint, Tests sowie Produktionsbuild aus. Die gleichen Schritte stehen lokal über `npm run check` zur Verfügung.
