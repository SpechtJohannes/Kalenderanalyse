import { useMemo, useState } from 'react'
import { MetricsDisplay } from '../../shared/components/MetricsDisplay'
import { AnalysisCharts } from '../../shared/components/AnalysisCharts'
import { SectionCard } from '../../shared/components/SectionCard'
import {
  ANALYSIS_PERIOD_OPTIONS,
  createAnalysisDateRange,
  createCustomAnalysisDateRange,
  DEFAULT_ANALYSIS_PERIOD_PRESET,
  formatAnalysisDateRange,
} from '../../shared/services/analysisPeriod'
import { calculateBaseMetricsForRange } from '../../shared/services/metrics'
import { addCalendarDays, getLocalDateKey } from '../../shared/services/timeZone'
import type { AnalysisPeriodPreset } from '../../shared/types/analysis'
import type { CalendarEvent } from '../../shared/types/calendar'

type AnalysisFeatureProps = {
  events?: CalendarEvent[]
}

function isAnalysisPeriodPreset(value: string): value is AnalysisPeriodPreset {
  return ANALYSIS_PERIOD_OPTIONS.some((option) => option.value === value)
}

export function AnalysisFeature({ events }: AnalysisFeatureProps) {
  const now = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => getLocalDateKey(now), [now])
  const [preset, setPreset] = useState<AnalysisPeriodPreset>(DEFAULT_ANALYSIS_PERIOD_PRESET)
  const [customStart, setCustomStart] = useState(todayKey)
  const [customEnd, setCustomEnd] = useState(addCalendarDays(todayKey, 6))

  const validation = useMemo(() => {
    if (preset === 'custom') return createCustomAnalysisDateRange(customStart, customEnd)
    return { range: createAnalysisDateRange(preset, now), error: null }
  }, [customEnd, customStart, now, preset])

  const metrics = useMemo(
    () =>
      validation.range && events ? calculateBaseMetricsForRange(events, validation.range) : null,
    [events, validation.range],
  )

  return (
    <section className="analysis-feature">
      <SectionCard
        title="Analyse-Dashboard"
        description="Basiskennzahlen für den ausgewählten Zeitraum"
        status="Verfügbar"
      />

      <div className="analysis-period">
        <div className="analysis-period__selection">
          <label htmlFor="analysis-period-preset">Analysezeitraum</label>
          <select
            id="analysis-period-preset"
            value={preset}
            onChange={(event) => {
              if (isAnalysisPeriodPreset(event.target.value)) setPreset(event.target.value)
            }}
          >
            {ANALYSIS_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {preset === 'custom' && (
          <div className="analysis-period__custom">
            <label htmlFor="analysis-period-start">
              Startdatum
              <input
                id="analysis-period-start"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label htmlFor="analysis-period-end">
              Enddatum
              <input
                id="analysis-period-end"
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        )}

        {validation.error ? (
          <p className="analysis-period__error" role="alert">
            {validation.error}
          </p>
        ) : (
          validation.range && (
            <p className="analysis-period__summary">
              Analysierter Zeitraum: <strong>{formatAnalysisDateRange(validation.range)}</strong>
            </p>
          )
        )}
      </div>

      {!events && (
        <p className="analysis-feature__empty analysis-feature__empty--standalone">
          Importiere zuerst einen Kalender, um Diagramme und Kennzahlen anzuzeigen.
        </p>
      )}
      {metrics && (
        <div className="analysis-feature__content">
          {metrics.eventCount === 0 && (
            <p className="analysis-feature__empty">Keine Termine im ausgewählten Zeitraum.</p>
          )}
          <MetricsDisplay metrics={metrics} />
          {metrics.eventCount > 0 && <AnalysisCharts metrics={metrics} />}
        </div>
      )}
    </section>
  )
}
