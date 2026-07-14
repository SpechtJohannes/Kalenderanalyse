import './App.css'
import { AnalysisFeature } from './features/analysis/AnalysisFeature'
import { CalendarFeature } from './features/calendar/CalendarFeature'
import { InsightsFeature } from './features/insights/InsightsFeature'
import { AppShell } from './shared/layout/AppShell'

function App() {
  return (
    <AppShell
      title="Kalenderanalyse"
      subtitle="Eine strukturierte Basis für datengetriebene Einblicke in Kalenderdaten."
    >
      <section className="app-shell__grid" aria-label="Projektbausteine">
        <CalendarFeature />
        <AnalysisFeature />
        <InsightsFeature />
      </section>

      <section className="app-shell__notes">
        <h2>Projektstatus</h2>
        <p>
          Diese erste Version enthält ausschließlich die Projektgrundlage, die dokumentierte
          Produktvision und eine saubere, feature-orientierte Ordnerstruktur.
        </p>
      </section>
    </AppShell>
  )
}

export default App
