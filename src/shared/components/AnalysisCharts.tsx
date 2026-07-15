import type { BaseMetrics } from '../types/calendar'
import {
  createChartSummary,
  createWeekdayChartData,
  formatMinutesToHours,
  type WeekdayChartDatum,
} from '../services/chartData'

type ChartDefinition = {
  title: string
  description: string
  value: (day: WeekdayChartDatum) => number
  formatValue: (value: number) => string
  detail?: (day: WeekdayChartDatum) => string
}

const numberFormat = (value: number) => String(value)

const CHARTS: ChartDefinition[] = [
  {
    title: 'Termine pro Wochentag',
    description: 'Anzahl aller Termine, zusammengefasst nach Wochentag.',
    value: (day) => day.eventCount,
    formatValue: numberFormat,
  },
  {
    title: 'Meetingstunden pro Wochentag',
    description: 'Gesamte Termindauer je Wochentag.',
    value: (day) => day.meetingMinutes,
    formatValue: formatMinutesToHours,
  },
  {
    title: 'Fokuszeit pro Wochentag',
    description: 'Ununterbrochene freie Zeit innerhalb der Arbeitszeit je Wochentag.',
    value: (day) => day.focusMinutes,
    formatValue: formatMinutesToHours,
  },
  {
    title: 'Freie Zeitblöcke pro Wochentag',
    description: 'Anzahl zusammenhängender freier Blöcke innerhalb der Arbeitszeit.',
    value: (day) => day.freeBlockCount,
    formatValue: numberFormat,
    detail: (day) => `Gesamtdauer ${formatMinutesToHours(day.freeBlockMinutes)}`,
  },
]

type AnalysisChartsProps = { metrics: BaseMetrics }

export function AnalysisCharts({ metrics }: AnalysisChartsProps) {
  const data = createWeekdayChartData(metrics)

  return (
    <section className="analysis-charts" aria-labelledby="analysis-charts-title">
      <div className="analysis-charts__heading">
        <h2 id="analysis-charts-title">Analyse nach Wochentagen</h2>
        <p>Werte aus dem gewählten Zeitraum, zusammengefasst von Montag bis Sonntag.</p>
      </div>
      <div className="analysis-charts__grid">
        {CHARTS.map((chart) => {
          const max = Math.max(...data.map(chart.value), 1)
          const descriptionId = `chart-${chart.title.toLowerCase().replace(/ /g, '-')}`
          return (
            <article className="weekday-chart" key={chart.title} aria-describedby={descriptionId}>
              <h3>{chart.title}</h3>
              <p id={descriptionId}>{chart.description}</p>
              <p className="visually-hidden">
                {createChartSummary(data, chart.value, chart.formatValue)}
              </p>
              <div className="weekday-chart__plot" aria-hidden="true">
                {data.map((day) => {
                  const value = chart.value(day)
                  const details = chart.detail?.(day)
                  return (
                    <div className="weekday-chart__column" key={day.weekday}>
                      <span className="weekday-chart__value">{chart.formatValue(value)}</span>
                      <div className="weekday-chart__track" title={details}>
                        <span
                          className="weekday-chart__bar"
                          style={{
                            height: `${value === 0 ? 0 : Math.max((value / max) * 100, 4)}%`,
                          }}
                        />
                      </div>
                      <span className="weekday-chart__label" title={day.label}>
                        {day.shortLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
