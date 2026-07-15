# Entwicklungsworkflow

## Ziel und Geltungsbereich

Dieses Dokument beschreibt den tatsächlichen Entwicklungsprozess von Kalenderanalyse. Die
verbindlichen technischen und qualitativen Vorgaben stehen in [`AGENTS.md`](../AGENTS.md); die
verfügbaren npm-Befehle sind zusätzlich im [`README.md`](../README.md) aufgeführt. Dieses Dokument
ergänzt diese Vorgaben um den Ablauf von einem GitHub Issue bis zum Merge und zu einem möglichen
Release.

## Branch-Strategie

`main` enthält ausschließlich stabile, geprüfte Versionen. Direkte Entwicklungsarbeit auf `main`
ist nicht vorgesehen. Für jedes GitHub Issue wird ein eigener Branch erstellt; ein Branch behandelt
genau ein Issue.

Das Namensschema lautet `<typ>/<issue-nummer>-<kurze-beschreibung>`. Die Beschreibung verwendet
Kleinbuchstaben, Ziffern und Bindestriche.

- `feature/<issue>-<beschreibung>` für neue Funktionen, zum Beispiel `feature/6-ics-import`
- `feature/<issue>-<beschreibung>` für größere Produktänderungen, zum Beispiel
  `feature/14-diagramme`
- `docs/<issue>-<beschreibung>` für reine Dokumentationsänderungen, zum Beispiel
  `docs/4-entwicklungsworkflow`
- `chore/<issue>-<beschreibung>` für Wartung, Tooling oder Infrastruktur, zum Beispiel
  `chore/18-node-version`
- `fix/<issue>-<beschreibung>` für Fehlerkorrekturen, zum Beispiel `fix/21-zeitzonenwechsel`

## Entwicklungsablauf

1. Zu Beginn `main` lokal aktualisieren.
2. Vom aktuellen `main` einen Branch für das Issue erstellen.
3. Die Änderung in kleinen, nachvollziehbaren Schritten implementieren. Geänderte Architektur,
   Tests und die in `AGENTS.md` genannten Dokumente werden dabei mitgeprüft.
4. Die lokalen Qualitätsprüfungen erfolgreich ausführen.
5. Zusammengehörige Änderungen mit verständlichen Conventional Commits committen.
6. Den Branch nach GitHub pushen.
7. Einen Pull Request erstellen und mit genau einem Issue verknüpfen.
8. Review-Kommentare bearbeiten und die CI erneut erfolgreich durchlaufen lassen.
9. Erst nach erfolgreicher CI und abgeschlossenem Review nach `main` mergen.
10. Nach dem Merge den lokalen und den entfernten Arbeitsbranch löschen.

Die Löschung erfolgt erst, wenn der Merge auf `main` bestätigt ist.

## Pull-Request-Workflow

Ein Pull Request behandelt genau ein GitHub Issue. Sein Titel beschreibt das Ergebnis verständlich;
die Beschreibung nennt die wesentlichen Änderungen und Prüfungen. Mit `Closes #<nummer>` wird das
Issue beim Merge automatisch geschlossen.

Die CI-Konfiguration in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) läuft für jeden
Pull Request und jeden Push auf `main`. Sie installiert die festgeschriebenen Abhängigkeiten mit
`npm ci` und prüft Formatierung, Lint-Regeln, Tests und Produktionsbuild. Ein Pull Request darf erst
gemergt werden, wenn alle CI-Schritte erfolgreich sind und das Review abgeschlossen ist.

Beispiel für eine Pull-Request-Beschreibung:

```markdown
## Änderungen

- Entwicklungsworkflow für Branches, Commits, Pull Requests und Releases dokumentiert

## Prüfungen

- `npm run check`

Closes #4
```

## Commit-Konvention

Commits folgen Conventional Commits im Format `<typ>: <kurze beschreibung>`. Die Beschreibung ist
präzise, steht im Präsens und enthält keinen abschließenden Punkt.

- `feat:` neue Funktionalität
- `fix:` Fehlerkorrektur
- `docs:` ausschließlich Dokumentation
- `refactor:` interne Umstrukturierung ohne beabsichtigte Verhaltensänderung
- `test:` neue oder geänderte Tests
- `style:` Formatierung oder rein visuelle Codeänderungen ohne fachliche Logikänderung
- `chore:` Wartung, Abhängigkeiten oder Entwicklungswerkzeuge

Beispiele:

```text
feat: add weekday analysis charts
fix: handle events across daylight saving changes
docs: document development workflow
refactor: extract chart data transformation
test: cover missing weekdays in chart data
style: align dashboard card spacing
chore: update vite development dependency
```

Ein Commit soll eine logisch zusammengehörige Änderung enthalten. Unabhängige Dokumentations-,
Test- oder Refactoring-Schritte können getrennt committed werden, wenn dies das Review erleichtert.

## Qualitätsprüfungen

Vor jedem Pull Request muss die vollständige lokale Prüfkette erfolgreich laufen:

```bash
npm run check
```

Dieses Skript führt in derselben Reihenfolge aus:

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

`npm test` startet Vitest im interaktiven Modus und eignet sich während der Entwicklung. Für die
einmalige Prüfung vor einem Pull Request und in CI wird `npm run test:run` verwendet. Falls
`npm run format:check` fehlschlägt, kann die Formatierung gezielt mit `npm run format` korrigiert und
danach die Prüfkette erneut ausgeführt werden.

## Release-Prozess

Das Projekt besitzt derzeit keinen automatisierten Release-Workflow und noch keine
`CHANGELOG.md`. Releases werden daher nur erstellt, wenn ein veröffentlichungsfähiger Milestone
vereinbart wurde. Der manuelle Ablauf ist:

1. Alle Issues des Milestones abschließen und prüfen, dass sie über Pull Requests in `main` gemergt
   wurden.
2. Eine `CHANGELOG.md` anlegen beziehungsweise aktualisieren und die Änderungen des Releases
   zusammenfassen.
3. Die Paketversion in `package.json` und `package-lock.json` konsistent erhöhen.
4. `npm run check` auf dem vorgesehenen Release-Stand ausführen.
5. Die Release-Änderungen per Pull Request nach `main` bringen.
6. Auf dem gemergten Commit einen annotierten Git-Tag im Format `v<major>.<minor>.<patch>` setzen.
7. Den Tag zu GitHub pushen.
8. Falls eine veröffentlichte Version vorgesehen ist, aus diesem Tag ein GitHub Release mit den
   relevanten Changelog-Einträgen erstellen.

Ohne vereinbarten Milestone und veröffentlichte Version wird kein Release-Tag erzeugt. Statisches
Hosting ist optional; die Anwendung bleibt gemäß
[`docs/architecture.md`](architecture.md#auslieferung-und-betrieb) vollständig im Browser
ausführbar.

## Konkrete Beispiele

### Branch erstellen

```bash
git switch main
git pull --ff-only
git switch -c docs/4-entwicklungsworkflow
```

### Änderung committen

```bash
git add docs/development-workflow.md
git commit -m "docs: document development workflow"
```

### Branch pushen und Pull Request erstellen

```bash
git push -u origin docs/4-entwicklungsworkflow
gh pr create --title "Entwicklungsworkflow dokumentieren" --body "Closes #4"
```

Nach erfolgreichem Merge und aktualisiertem `main` kann der Branch entfernt werden:

```bash
git switch main
git pull --ff-only
git branch -d docs/4-entwicklungsworkflow
git push origin --delete docs/4-entwicklungsworkflow
```

### Release erstellen

Beispiel für eine vereinbarte Version `0.1.0`, nachdem der Release-Pull-Request gemergt wurde:

```bash
git switch main
git pull --ff-only
npm run check
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0" --notes-file CHANGELOG.md
```

Das letzte Kommando gilt nur, wenn die `CHANGELOG.md` für dieses Release vorbereitet wurde und ein
GitHub Release vorgesehen ist.
