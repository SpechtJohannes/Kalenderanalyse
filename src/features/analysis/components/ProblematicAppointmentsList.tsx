import { ANALYSIS_TIME_ZONE } from '../../../shared/services/timeZone'
import type { ProblematicAppointmentEvaluation } from '../domain/problematicAppointments'
import './ProblematicAppointmentsList.css'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: ANALYSIS_TIME_ZONE,
})
const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: ANALYSIS_TIME_ZONE,
})

type ProblematicAppointmentsListProps = {
  evaluations?: ProblematicAppointmentEvaluation[]
}

export function ProblematicAppointmentsList({ evaluations }: ProblematicAppointmentsListProps) {
  return (
    <section className="problematic-appointments" aria-labelledby="problematic-appointments-title">
      <div className="problematic-appointments__heading">
        <h2 id="problematic-appointments-title">Problematische Termine</h2>
        <p>Nachvollziehbare Hinweise, nach Score absteigend sortiert.</p>
      </div>
      {!evaluations ? (
        <p>Importiere zuerst einen Kalender, um problematische Termine zu identifizieren.</p>
      ) : evaluations.length === 0 ? (
        <p className="problematic-appointments__success">
          Im gewählten Zeitraum wurden keine problematischen Termine gefunden.
        </p>
      ) : (
        <ol className="problematic-appointments__list">
          {evaluations.map(({ appointment, appointmentId, score, reasons }) => (
            <li key={appointmentId}>
              <article className="problematic-appointment">
                <div className="problematic-appointment__header">
                  <div>
                    <h3>{appointment.title}</h3>
                    <p>
                      {dateFormatter.format(appointment.startTime)},{' '}
                      {timeFormatter.format(appointment.startTime)}–
                      {timeFormatter.format(appointment.endTime)} Uhr
                    </p>
                  </div>
                  <p
                    className="problematic-appointment__score"
                    aria-label={`${score} Problempunkte`}
                  >
                    {score} Punkte
                  </p>
                </div>
                <ul className="problematic-appointment__reasons">
                  {reasons.map((reason) => (
                    <li key={reason.code}>
                      <strong>{reason.label}:</strong> {reason.description}{' '}
                      <span>+{reason.score}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
