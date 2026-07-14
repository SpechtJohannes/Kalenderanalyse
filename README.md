# Kalenderanalyse

Ein lokales Kalender Analyse Tool, das aus einer ICS Datei verständlich zeigt, wie stark der eigene Kalender durch Meetings, Kontextwechsel und problematische Terminanordnungen belastet ist.

## Produktvision

Die Anwendung soll helfen, Zeit und Energie sinnvoller zu nutzen, indem sie wichtige Zusammenhänge aus dem Kalender sichtbar macht. Der Fokus liegt auf klaren Einblicken, Datenschutz und einer schrittweisen Erweiterung der Funktionen.

Die langfristige Ausrichtung, Zielgruppen, Nicht-Ziele und Leitprinzipien beschreibt die [ausführliche Produktvision](docs/product-vision.md).

## Qualitätsprüfungen

Die folgenden Befehle stehen für lokale Prüfungen zur Verfügung:

- `npm test` – startet den interaktiven Testmodus
- `npm run test:run` – führt die Tests einmalig aus
- `npm run lint` – prüft den Code mit ESLint
- `npm run format` – formatiert alle unterstützten Projektdateien mit Prettier
- `npm run format:check` – prüft die Formatierung ohne Dateien zu verändern
- `npm run build` – erstellt den Produktionsbuild
- `npm run check` – führt Formatprüfung, Lint, Tests und Build in einer Reihenfolge aus

## Aktueller Stand

Die technische Grundlage umfasst inzwischen:

- eine feature-orientierte React- und TypeScript-Struktur,
- ICS-Parsing und Normalisierung in ein internes Kalendermodell,
- eine explizite Analysezeitzone und auswählbare Analysezeiträume,
- getestete Basiskennzahlen sowie deren erste Darstellung und
- automatisierte Format-, Lint-, Test- und Build-Prüfungen.

Die Dateiauswahl ist noch nicht mit der Oberfläche verbunden. Weitergehende Auffälligkeiten, Empfehlungen und Visualisierungen sind geplant.

## Projektstruktur

- src/features: feature-spezifische Bausteine
- src/shared: wiederverwendbare UI- und Layoutkomponenten
- docs: Architektur, Design, Workflow, Datenschutz und Produktvision

## Entwicklung

```bash
npm install
npm run dev
```

Für einen Produktionsbuild:

```bash
npm run build
```
