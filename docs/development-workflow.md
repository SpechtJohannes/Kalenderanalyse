# Development Workflow

<<<<<<< HEAD
## Qualitätsprüfungen vor einem Pull Request

Vor jedem Pull Request müssen lokal die folgenden Prüfungen erfolgreich laufen:

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run check`

Die vollständige Qualitätsprüfung ist damit immer über denselben Befehl reproduzierbar.

## Automatische Prüfung über GitHub Actions

Jeder Pull Request und jede Änderung auf dem Branch `main` löst den Workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) aus. Der Workflow führt dabei:

1. Installation der Abhängigkeiten mit `npm ci`
2. Lint-Prüfung
3. Tests
4. Produktionsbuild
=======
## Ziel
Hier werden Arbeitsweise, Tooling und Qualitätsstandards festgehalten.

## Status
- Grundworkflow wird etabliert
- Build, Lint und Dokumentation sind Teil der Routine
>>>>>>> origin/main
