/**
 * Komponente zur Darstellung der Basiskennzahlen
 */

import './MetricsDisplay.css'
import { formatMinutesToHours } from '../services/metrics'
import type { BaseMetrics, DayEventStats } from '../types/calendar'

type MetricsDisplayProps = {
  metrics: BaseMetrics
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="metrics-display">
      <section className="metrics-summary">
        <article className="metric-card">
          <h3 className="metric-card__title">Anzahl Termine</h3>
          <p className="metric-card__value">{metrics.eventCount}</p>
        </article>

        <article className="metric-card">
          <h3 className="metric-card__title">Meetingstunden</h3>
          <p className="metric-card__value">{formatMinutesToHours(metrics.totalMeetingMinutes)}</p>
        </article>

        <article className="metric-card">
          <h3 className="metric-card__title">Ø Meetingdauer</h3>
          <p className="metric-card__value">
            {metrics.averageMeetingDuration !== null
              ? formatMinutesToHours(Math.round(metrics.averageMeetingDuration))
              : '—'}
          </p>
        </article>

        <article className="metric-card">
          <h3 className="metric-card__title">Freie Zeitblöcke</h3>
          <p className="metric-card__value">{metrics.freeTimeBlocks.length}</p>
        </article>
      </section>

      <section className="events-by-day">
        <h3>Termine pro Tag</h3>
        <table className="events-by-day__table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Anzahl Termine</th>
              <th>Gesamtdauer</th>
            </tr>
          </thead>
          <tbody>
            {metrics.eventsByDay.map((day: DayEventStats) => (
              <tr key={day.date.toISOString()}>
                <td>{day.date.toLocaleDateString('de-DE', { weekday: 'short', month: '2-digit', day: '2-digit' })}</td>
                <td>{day.eventCount}</td>
                <td>{formatMinutesToHours(day.totalDuration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
