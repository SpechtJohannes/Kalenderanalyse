import { useMemo } from 'react'
import { MetricsDisplay } from '../../shared/components/MetricsDisplay'
import { SectionCard } from '../../shared/components/SectionCard'
import { calculateBaseMetrics } from '../../shared/services/metrics'
import type { CalendarEvent } from '../../shared/types/calendar'

export function AnalysisFeature() {
  const metrics = useMemo(() => {
    // TODO: Später über Context/Props vom CalendarFeature bereitgestellt
    const mockEvents: CalendarEvent[] = []

    // Definiere Analysebereich: Aktuelle Woche (für Demo)
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Montag
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 4) // Freitag

    return calculateBaseMetrics(mockEvents, startOfWeek, endOfWeek)
  }, [])

  return (
    <section className="analysis-feature">
      <SectionCard
        title="Analyse"
        description="Basiskennzahlen für den ausgewählten Zeitraum"
        status="In Entwicklung"
      />
      <div className="analysis-feature__content">
        <MetricsDisplay metrics={metrics} />
      </div>
    </section>
  )
}
