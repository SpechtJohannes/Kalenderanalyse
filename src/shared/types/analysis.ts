export type AnalysisPeriodPreset = 'week' | 'two-weeks' | 'month' | 'three-months' | 'custom'

export type AnalysisDateRange = {
  preset: AnalysisPeriodPreset
  startDateKey: string
  endDateKey: string
  startTime: Date
  endTime: Date
}

export type AnalysisDateRangeValidation =
  | { range: AnalysisDateRange; error: null }
  | { range: null; error: string }
