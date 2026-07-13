# AGENTS.md

# Kalenderanalyse

Diese Datei beschreibt die verbindlichen Entwicklungsrichtlinien für dieses Projekt.

## Produkt

* Das Produkt ist immer eine lokal ausführbare HTML Anwendung.
* Es gibt keine Serverkomponente.
* Alle Kalenderdaten werden ausschließlich lokal im Browser verarbeitet.
* Es gibt keine Cloudpflicht.
* Datenschutz besitzt hohe Priorität.

## Architektur

* React
* TypeScript
* Vite

Die Projektstruktur ist featureorientiert.

Neue Komponenten sollen möglichst wiederverwendbar sein.

Farben, Abstände und Rundungen werden ausschließlich über zentrale Design Tokens definiert.

Alle Komponenten unterstützen Hell und Dunkelmodus.

## Dokumentation

Bei Änderungen muss geprüft werden, ob folgende Dokumente aktualisiert werden müssen:

* docs/product-vision.md
* docs/architecture.md
* docs/design.md
* docs/privacy.md
* docs/scoring-model.md

## Qualität

* TypeScript ohne Fehler
* Tests ergänzen oder aktualisieren
* Bestehende Tests dürfen nicht fehlschlagen
* Keine ungenutzten Komponenten oder Dateien

## Workflow

* Ein Branch pro Issue
* Ein Pull Request pro Issue
* Kleine nachvollziehbare Commits
* Änderungen an der Architektur dokumentieren

## Design

Die visuelle Referenz befindet sich unter:

docs/design/dashboard-light-reference.png

Neue Oberflächen sollen sich an dieser Referenz orientieren.
