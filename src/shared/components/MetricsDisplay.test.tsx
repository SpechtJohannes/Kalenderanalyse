import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BaseMetrics } from '../types/calendar'
import { zonedDateTimeToDate } from '../services/timeZone'
import { MetricCard } from './MetricCard'
import { MetricsDisplay } from './MetricsDisplay'

function card(name: string): HTMLElement {
  const result = screen.getByRole('heading', { name }).closest('article')
  if (!result) throw new Error(`Kennzahlenkarte „${name}“ wurde nicht gefunden.`)
  return result
}

const metrics: BaseMetrics = {
  eventCount: 3,
  totalMeetingMinutes: 150,
  averageMeetingDuration: 50,
  freeTimeBlocks: [
    {
      startTime: new Date('2024-01-08T07:00:00Z'),
      endTime: new Date('2024-01-08T08:00:00Z'),
      duration: 60,
    },
    {
      startTime: new Date('2024-01-08T10:00:00Z'),
      endTime: new Date('2024-01-08T11:00:00Z'),
      duration: 60,
    },
  ],
  eventsByDay: [
    {
      date: zonedDateTimeToDate({
        year: 2024,
        month: 1,
        day: 8,
        hour: 0,
        minute: 0,
        second: 0,
      }),
      eventCount: 3,
      totalDuration: 150,
    },
  ],
}

describe('MetricCard', () => {
  it('stellt ausschließlich fertig übergebene Inhalte ohne interaktives Verhalten dar', () => {
    render(
      <MetricCard
        label="Beispielkennzahl"
        value="2 Std. 30 Min."
        unit="gesamt"
        description="Fertig formatierter Wert"
      />,
    )

    const metricCard = card('Beispielkennzahl')
    expect(metricCard).toHaveTextContent('2 Std. 30 Min.')
    expect(metricCard).toHaveTextContent('gesamt')
    expect(metricCard).toHaveTextContent('Fertig formatierter Wert')
    expect(within(metricCard).queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('MetricsDisplay', () => {
  it('zeigt alle Basiskennzahlen mit verständlichen Beschriftungen und Werten', () => {
    render(<MetricsDisplay metrics={metrics} />)

    expect(within(card('Termine')).getByText('3')).toBeInTheDocument()
    expect(within(card('Termine')).getByText('Termine', { selector: 'span' })).toBeInTheDocument()
    expect(card('Meetingzeit')).toHaveTextContent('2 Std. 30 Min.')
    expect(card('Durchschnittliche Meetingdauer')).toHaveTextContent('50 Min.')
    expect(within(card('Freie Zeitblöcke')).getByText('2')).toBeInTheDocument()
    expect(within(card('Freie Zeitblöcke')).getByText('Blöcke')).toBeInTheDocument()
  })

  it('zeigt Termine pro Tag als nachvollziehbare Tagesliste', () => {
    render(<MetricsDisplay metrics={metrics} />)

    const daily = card('Termine pro Tag')
    expect(within(daily).getByText('Mo., 08.01.2024')).toBeInTheDocument()
    expect(within(daily).getByText('3')).toBeInTheDocument()
    expect(within(daily).getByText('2 Std. 30 Min.')).toBeInTheDocument()
  })

  it('zeigt für einen leeren Zeitraum ausschließlich verständliche Nullwerte', () => {
    render(
      <MetricsDisplay
        metrics={{
          eventCount: 0,
          totalMeetingMinutes: 0,
          averageMeetingDuration: null,
          freeTimeBlocks: [],
          eventsByDay: [{ ...metrics.eventsByDay[0], eventCount: 0, totalDuration: 0 }],
        }}
      />,
    )

    expect(within(card('Termine')).getByText('0')).toBeInTheDocument()
    expect(within(card('Termine')).getByText('Termine', { selector: 'span' })).toBeInTheDocument()
    expect(card('Meetingzeit')).toHaveTextContent('0 Min.')
    expect(card('Durchschnittliche Meetingdauer')).toHaveTextContent('0 Min.')
    expect(within(card('Freie Zeitblöcke')).getByText('0')).toBeInTheDocument()
    expect(within(card('Freie Zeitblöcke')).getByText('Blöcke')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/NaN|Infinity|undefined|null/)
  })
})
