import './MetricsDisplay.css'
import { formatMinutesToHours } from '../services/metrics'
import { ANALYSIS_TIME_ZONE } from '../services/timeZone'
import type { BaseMetrics } from '../types/calendar'
import { MetricCard } from './MetricCard'

type MetricsDisplayProps = {
  metrics: BaseMetrics
}

const dayFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: ANALYSIS_TIME_ZONE,
})

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <section className="metrics-dashboard" aria-labelledby="metrics-dashboard-title">
      <div className="metrics-dashboard__heading">
        <h2 id="metrics-dashboard-title">Übersicht</h2>
        <p>Basiskennzahlen für den ausgewählten Analysezeitraum</p>
      </div>

      <div className="metrics-summary">
        <MetricCard
          label="Termine"
          value={String(metrics.eventCount)}
          unit={metrics.eventCount === 1 ? 'Termin' : 'Termine'}
          description="Alle Termine im Analysezeitraum"
        />
        <MetricCard
          label="Meetingzeit"
          value={formatMinutesToHours(metrics.totalMeetingMinutes)}
          description="Summe der einzelnen Termindauern"
        />
        <MetricCard
          label="Durchschnittliche Meetingdauer"
          value={formatMinutesToHours(metrics.averageMeetingDuration ?? 0)}
          description="Durchschnitt pro Termin"
        />
        <MetricCard
          label="Freie Zeitblöcke"
          value={String(metrics.freeTimeBlocks.length)}
          unit={metrics.freeTimeBlocks.length === 1 ? 'Block' : 'Blöcke'}
          description="Zusammenhängende freie Zeit innerhalb der Arbeitszeit"
        />
      </div>

      <article className="events-by-day">
        <div className="events-by-day__heading">
          <h3>Termine pro Tag</h3>
          <p>Anzahl und Meetingzeit je lokalem Kalendertag</p>
        </div>
        <table className="events-by-day__table">
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Termine</th>
              <th scope="col">Meetingzeit</th>
            </tr>
          </thead>
          <tbody>
            {metrics.eventsByDay.map((day) => (
              <tr key={day.date.toISOString()}>
                <td data-label="Datum">{dayFormatter.format(day.date)}</td>
                <td data-label="Termine">{day.eventCount}</td>
                <td data-label="Meetingzeit">{formatMinutesToHours(day.totalDuration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
