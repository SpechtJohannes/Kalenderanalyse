import { DEFAULT_WORKING_HOURS, formatMinutesToHours } from '../../../shared/services/metrics'
import { dateAtMinutes, getDayBoundaries, getLocalDateKey } from '../../../shared/services/timeZone'
import type { CalendarEvent, WorkingHoursConfig } from '../../../shared/types/calendar'

export type ProblematicAppointmentReason = {
  code: 'missing-agenda' | 'very-long' | 'outside-working-hours' | 'overlap'
  label: string
  description: string
  score: number
}

export type ProblematicAppointmentEvaluation = {
  appointmentId: string
  appointment: CalendarEvent
  score: number
  reasons: ProblematicAppointmentReason[]
}

export const PROBLEMATIC_APPOINTMENT_RULES = {
  missingAgenda: { score: 10 },
  veryLong: { minimumMinutes: 120, score: 20 },
  outsideWorkingHours: { score: 15 },
  overlap: { score: 25 },
} as const

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function isOutsideWorkingHours(
  appointment: CalendarEvent,
  workingHours: WorkingHoursConfig,
): boolean {
  const startKey = getLocalDateKey(appointment.startTime)
  const endKey = getLocalDateKey(new Date(appointment.endTime.getTime() - 1))
  const startDay = getDayBoundaries(startKey)
  if (startKey !== endKey || !workingHours.workDays.includes(startDay.dayOfWeek)) return true

  const workStart = dateAtMinutes(startKey, timeToMinutes(workingHours.startTime))
  const workEnd = dateAtMinutes(startKey, timeToMinutes(workingHours.endTime))
  return appointment.startTime < workStart || appointment.endTime > workEnd
}

function findOverlappingAppointmentIds(appointments: CalendarEvent[]): Set<string> {
  const sorted = [...appointments].sort(
    (first, second) =>
      first.startTime.getTime() - second.startTime.getTime() ||
      first.endTime.getTime() - second.endTime.getTime() ||
      first.id.localeCompare(second.id),
  )
  const overlappingIds = new Set<string>()
  let furthestEnding: CalendarEvent | undefined

  for (const appointment of sorted) {
    if (furthestEnding && appointment.startTime < furthestEnding.endTime) {
      overlappingIds.add(furthestEnding.id)
      overlappingIds.add(appointment.id)
    }
    if (!furthestEnding || appointment.endTime > furthestEnding.endTime) {
      furthestEnding = appointment
    }
  }
  return overlappingIds
}

export function evaluateProblematicAppointment(
  appointment: CalendarEvent,
  overlappingIds: ReadonlySet<string> = new Set(),
  workingHours: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): ProblematicAppointmentEvaluation {
  const reasons: ProblematicAppointmentReason[] = []

  if (!appointment.description?.trim()) {
    reasons.push({
      code: 'missing-agenda',
      label: 'Agenda fehlt',
      description: 'Der Termin besitzt keine Beschreibung oder Agenda.',
      score: PROBLEMATIC_APPOINTMENT_RULES.missingAgenda.score,
    })
  }
  if (appointment.durationMinutes >= PROBLEMATIC_APPOINTMENT_RULES.veryLong.minimumMinutes) {
    reasons.push({
      code: 'very-long',
      label: 'Sehr langer Termin',
      description: `Der Termin dauert ${formatMinutesToHours(appointment.durationMinutes)}.`,
      score: PROBLEMATIC_APPOINTMENT_RULES.veryLong.score,
    })
  }
  if (isOutsideWorkingHours(appointment, workingHours)) {
    reasons.push({
      code: 'outside-working-hours',
      label: 'Außerhalb der Arbeitszeit',
      description: 'Der Termin liegt teilweise außerhalb deiner Arbeitszeit.',
      score: PROBLEMATIC_APPOINTMENT_RULES.outsideWorkingHours.score,
    })
  }
  if (overlappingIds.has(appointment.id)) {
    reasons.push({
      code: 'overlap',
      label: 'Terminüberschneidung',
      description: 'Der Termin überschneidet sich mit einem anderen Termin.',
      score: PROBLEMATIC_APPOINTMENT_RULES.overlap.score,
    })
  }

  return {
    appointmentId: appointment.id,
    appointment,
    score: reasons.reduce((total, reason) => total + reason.score, 0),
    reasons,
  }
}

export function findProblematicAppointments(
  appointments: CalendarEvent[],
  workingHours: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): ProblematicAppointmentEvaluation[] {
  const overlappingIds = findOverlappingAppointmentIds(appointments)
  return appointments
    .map((appointment) => evaluateProblematicAppointment(appointment, overlappingIds, workingHours))
    .filter((evaluation) => evaluation.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.appointment.startTime.getTime() - second.appointment.startTime.getTime() ||
        first.appointment.title.localeCompare(second.appointment.title, 'de'),
    )
}
