import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../../shared/types/calendar'
import { AnalysisFeature } from './AnalysisFeature'

function event(id: string, start: string, end: string): CalendarEvent {
  const startTime = new Date(start)
  const endTime = new Date(end)
  return {
    id,
    title: id,
    description: null,
    location: null,
    startTime,
    endTime,
    durationMinutes: (endTime.getTime() - startTime.getTime()) / 60_000,
    isAllDay: false,
    status: 'confirmed',
    organizer: null,
    attendees: [],
  }
}

function eventCount(): HTMLElement {
  const card = screen.getByRole('heading', { name: 'Termine' }).closest('article')
  if (!card) throw new Error('Kennzahlenkarte wurde nicht gefunden.')
  return within(card).getByText(/^\d+$/)
}

describe('AnalysisFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-08T12:00:00+01:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zeigt die kommende Woche als Standard und einen verständlichen Leerzustand', () => {
    render(<AnalysisFeature />)

    expect(screen.getByLabelText('Analysezeitraum')).toHaveValue('week')
    expect(screen.getByText(/08\.01\.2024 bis 14\.01\.2024/)).toBeInTheDocument()
    expect(screen.getByText('Keine Termine im ausgewählten Zeitraum.')).toBeInTheDocument()
    expect(eventCount()).toHaveTextContent('0')
  })

  it('aktualisiert Kennzahlen unmittelbar nach einer geänderten Auswahl', () => {
    const events = [
      event('first-week', '2024-01-10T09:00:00+01:00', '2024-01-10T10:00:00+01:00'),
      event('second-week', '2024-01-18T09:00:00+01:00', '2024-01-18T10:00:00+01:00'),
    ]
    render(<AnalysisFeature events={events} />)

    expect(eventCount()).toHaveTextContent('1')
    fireEvent.change(screen.getByLabelText('Analysezeitraum'), {
      target: { value: 'two-weeks' },
    })

    expect(screen.getByText(/08\.01\.2024 bis 21\.01\.2024/)).toBeInTheDocument()
    expect(eventCount()).toHaveTextContent('2')
  })

  it('zeigt und validiert einen benutzerdefinierten Zeitraum', () => {
    render(<AnalysisFeature />)
    fireEvent.change(screen.getByLabelText('Analysezeitraum'), {
      target: { value: 'custom' },
    })

    const start = screen.getByLabelText('Startdatum')
    const end = screen.getByLabelText('Enddatum')
    expect(start).toHaveValue('2024-01-08')
    expect(end).toHaveValue('2024-01-14')

    fireEvent.change(start, { target: { value: '2024-01-20' } })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Das Enddatum darf nicht vor dem Startdatum liegen.',
    )
    expect(screen.queryByRole('heading', { name: 'Termine' })).not.toBeInTheDocument()

    fireEvent.change(end, { target: { value: '2024-01-20' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/20\.01\.2024 bis 20\.01\.2024/)).toBeInTheDocument()
    expect(eventCount()).toHaveTextContent('0')
  })

  it('behält die Auswahl bei aktualisierten Importdaten bei', () => {
    const { rerender } = render(<AnalysisFeature events={[]} />)
    fireEvent.change(screen.getByLabelText('Analysezeitraum'), {
      target: { value: 'two-weeks' },
    })

    rerender(
      <AnalysisFeature
        events={[event('new-import', '2024-01-18T09:00:00+01:00', '2024-01-18T10:00:00+01:00')]}
      />,
    )

    expect(screen.getByLabelText('Analysezeitraum')).toHaveValue('two-weeks')
    expect(eventCount()).toHaveTextContent('1')
  })
})
