# Development Workflow

## Ziel

Dieses Dokument beschreibt die Arbeitsweise, das Tooling und die Qualitätsstandards des Projekts.

## Qualitätsprüfungen vor einem Pull Request

Vor jedem Pull Request müssen lokal folgende Prüfungen erfolgreich laufen:

- `npm run format:check`
- `npm run lint`
- `npm run test:run`
- `npm run build`

Mit `npm run check` lässt sich die vollständige Prüfkette reproduzierbar ausführen. `npm run format` formatiert alle von Prettier unterstützten Projektdateien.

## Automatische Prüfung über GitHub Actions

Jeder Pull Request und jede Änderung auf `main` löst den Workflow in `.github/workflows/ci.yml` aus. Nach `npm ci` prüft der Workflow Formatierung und Lint-Regeln, führt die Tests aus und erstellt den Produktionsbuild.
