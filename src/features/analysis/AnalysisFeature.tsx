import { useMemo } from 'react'
import { MetricsDisplay } from '../../shared/components/MetricsDisplay'
import { SectionCard } from '../../shared/components/SectionCard'
import { calculateBaseMetrics } from '../../shared/services/metrics'
import { addCalendarDays, getDayBoundaries, getLocalDateKey } from '../../shared/services/timeZone'
import type { CalendarEvent } from '../../shared/types/calendar'

export function AnalysisFeature() {
  const metrics = useMemo(() => {
    // TODO: Später über Context/Props vom CalendarFeature bereitgestellt
    const mockEvents: CalendarEvent[] = []

    // Definiere Analysebereich: Aktuelle Woche (für Demo)
    const todayKey = getLocalDateKey(new Date())
    const today = getDayBoundaries(todayKey)
    const daysSinceMonday = (today.dayOfWeek + 6) % 7
    const startOfWeekKey = addCalendarDays(todayKey, -daysSinceMonday)
    const startOfWeek = getDayBoundaries(startOfWeekKey).startTime
    const endOfWeek = getDayBoundaries(addCalendarDays(startOfWeekKey, 4)).startTime

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
