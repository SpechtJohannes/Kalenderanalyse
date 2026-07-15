import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../../shared/types/calendar'
import type { ProblematicAppointmentEvaluation } from '../domain/problematicAppointments'
import { ProblematicAppointmentsList } from './ProblematicAppointmentsList'

function evaluation(
  id: string,
  score: number,
  start: string,
  reasonCount = 1,
): ProblematicAppointmentEvaluation {
  const appointment: CalendarEvent = {
    id,
    title: id,
    description: null,
    location: null,
    startTime: new Date(start),
    endTime: new Date(new Date(start).getTime() + 60 * 60_000),
    durationMinutes: 60,
    isAllDay: false,
    status: 'confirmed',
    organizer: null,
    attendees: [],
  }
  return {
    appointmentId: id,
    appointment,
    score,
    reasons: Array.from({ length: reasonCount }, (_, index) => ({
      code: index === 0 ? 'missing-agenda' : 'overlap',
      label: index === 0 ? 'Agenda fehlt' : 'Terminüberschneidung',
      description:
        index === 0
          ? 'Der Termin besitzt keine Beschreibung oder Agenda.'
          : 'Der Termin überschneidet sich mit einem anderen Termin.',
      score: index === 0 ? 10 : 25,
    })),
  }
}

describe('ProblematicAppointmentsList', () => {
  it('zeigt den Zustand ohne Kalenderdaten', () => {
    render(<ProblematicAppointmentsList />)
    expect(
      screen.getByText(
        'Importiere zuerst einen Kalender, um problematische Termine zu identifizieren.',
      ),
    ).toBeInTheDocument()
  })

  it('zeigt eine positive Meldung ohne problematische Termine', () => {
    render(<ProblematicAppointmentsList evaluations={[]} />)
    expect(
      screen.getByText('Im gewählten Zeitraum wurden keine problematischen Termine gefunden.'),
    ).toBeInTheDocument()
  })

  it('zeigt Termine in übergebener Reihenfolge mit allen Gründen', () => {
    render(
      <ProblematicAppointmentsList
        evaluations={[
          evaluation('Höchster Score', 35, '2024-01-08T09:00:00+01:00', 2),
          evaluation('Niedriger Score', 10, '2024-01-09T09:00:00+01:00'),
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem').filter((item) => item.querySelector('article'))
    expect(within(items[0]).getByRole('heading', { name: 'Höchster Score' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('heading', { name: 'Niedriger Score' })).toBeInTheDocument()
    expect(screen.getAllByText(/Der Termin besitzt keine Beschreibung/)).toHaveLength(2)
    expect(screen.getByText(/Der Termin überschneidet sich/)).toBeInTheDocument()
    expect(screen.queryByText('missing-agenda')).not.toBeInTheDocument()
  })
})
