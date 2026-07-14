import './App.css'
import { useState } from 'react'
import { AnalysisFeature } from './features/analysis/AnalysisFeature'
import { CalendarFeature } from './features/calendar/CalendarFeature'
import { InsightsFeature } from './features/insights/InsightsFeature'
import { AppShell } from './shared/layout/AppShell'
import type { CalendarEvent } from './shared/types/calendar'

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  return (
    <AppShell
      title="Kalenderanalyse"
      subtitle="Eine strukturierte Basis für datengetriebene Einblicke in Kalenderdaten."
    >
      <section className="app-shell__grid" aria-label="Projektbausteine">
        <CalendarFeature onImport={setEvents} />
        <AnalysisFeature events={events} />
        <InsightsFeature />
      </section>

      <section className="app-shell__notes">
        <h2>Projektstatus</h2>
        <p>
          ICS-Dateien werden lokal importiert und analysiert. Die Kalenderdaten verlassen den
          Browser nicht und werden nicht dauerhaft gespeichert.
        </p>
      </section>
    </AppShell>
  )
}

export default App
