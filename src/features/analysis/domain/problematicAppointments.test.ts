import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../../shared/types/calendar'
import {
  evaluateProblematicAppointment,
  findProblematicAppointments,
  PROBLEMATIC_APPOINTMENT_RULES,
} from './problematicAppointments'

function appointment(
  id: string,
  start = '2024-01-08T09:00:00+01:00',
  end = '2024-01-08T10:00:00+01:00',
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  const startTime = new Date(start)
  const endTime = new Date(end)
  return {
    id,
    title: id,
    description: 'Agenda',
    location: null,
    startTime,
    endTime,
    durationMinutes: (endTime.getTime() - startTime.getTime()) / 60_000,
    isAllDay: false,
    status: 'confirmed',
    organizer: null,
    attendees: [],
    ...overrides,
  }
}

describe('Bewertung problematischer Termine', () => {
  it('bewertet eine fehlende Beschreibung', () => {
    const result = evaluateProblematicAppointment(
      appointment('Ohne Agenda', undefined, undefined, { description: null }),
    )
    expect(result.reasons.map((reason) => reason.code)).toEqual(['missing-agenda'])
    expect(result.score).toBe(PROBLEMATIC_APPOINTMENT_RULES.missingAgenda.score)
  })

  it('bewertet einen mindestens zwei Stunden langen Termin', () => {
    const result = evaluateProblematicAppointment(
      appointment('Lang', '2024-01-08T09:00:00+01:00', '2024-01-08T11:00:00+01:00'),
    )
    expect(result.reasons.map((reason) => reason.code)).toContain('very-long')
  })

  it('bewertet einen Termin außerhalb der Arbeitszeit', () => {
    const result = evaluateProblematicAppointment(
      appointment('Früh', '2024-01-08T07:30:00+01:00', '2024-01-08T08:30:00+01:00'),
    )
    expect(result.reasons.map((reason) => reason.code)).toContain('outside-working-hours')
  })

  it('bewertet beide sich überschneidenden Termine', () => {
    const results = findProblematicAppointments([
      appointment('A', '2024-01-08T09:00:00+01:00', '2024-01-08T10:00:00+01:00'),
      appointment('B', '2024-01-08T09:30:00+01:00', '2024-01-08T10:30:00+01:00'),
    ])
    expect(results).toHaveLength(2)
    expect(
      results.every((result) => result.reasons.some((reason) => reason.code === 'overlap')),
    ).toBe(true)
  })

  it('summiert mehrere zutreffende Regeln korrekt', () => {
    const item = appointment('Mehrfach', '2024-01-08T07:00:00+01:00', '2024-01-08T09:00:00+01:00', {
      description: '',
    })
    const result = evaluateProblematicAppointment(item, new Set([item.id]))
    expect(result.reasons).toHaveLength(4)
    expect(result.score).toBe(10 + 20 + 15 + 25)
  })

  it('liefert für einen unproblematischen Termin Score null und keine Gründe', () => {
    expect(evaluateProblematicAppointment(appointment('Gut'))).toMatchObject({
      score: 0,
      reasons: [],
    })
  })

  it('sortiert nach Score, Beginn und zuletzt Titel', () => {
    const results = findProblematicAppointments([
      appointment('Zulu', '2024-01-08T09:00:00+01:00', '2024-01-08T10:00:00+01:00', {
        description: null,
      }),
      appointment('Alpha', '2024-01-08T09:00:00+01:00', '2024-01-08T10:00:00+01:00', {
        description: null,
      }),
      appointment('Hoch', '2024-01-09T07:00:00+01:00', '2024-01-09T09:00:00+01:00', {
        description: null,
      }),
    ])
    expect(results.map((result) => result.appointmentId)).toEqual(['Hoch', 'Alpha', 'Zulu'])
  })

  it('liefert für eine leere Liste ein leeres Ergebnis und verändert Eingaben nicht', () => {
    expect(findProblematicAppointments([])).toEqual([])
    const inputs = [appointment('B'), appointment('A')]
    const order = inputs.map((item) => item.id)
    findProblematicAppointments(inputs)
    expect(inputs.map((item) => item.id)).toEqual(order)
  })
})
