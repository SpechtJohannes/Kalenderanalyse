import type {
  BaseMetrics,
  CalendarEvent,
  DayEventStats,
  FreeTimeBlock,
  WorkingHoursConfig,
} from '../types/calendar'

export const DEFAULT_WORKING_HOURS: WorkingHoursConfig = {
  startTime: '08:00',
  endTime: '18:00',
  workDays: [1, 2, 3, 4, 5],
}

type TimeInterval = {
  startTime: Date
  endTime: Date
}

function isValidEvent(event: CalendarEvent): boolean {
  return (
    Number.isFinite(event.startTime.getTime()) &&
    Number.isFinite(event.endTime.getTime()) &&
    event.endTime.getTime() > event.startTime.getTime()
  )
}

function getDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.max(0, (endTime.getTime() - startTime.getTime()) / 60_000)
}

function getEventDurationMinutes(event: CalendarEvent): number {
  return isValidEvent(event) ? getDurationMinutes(event.startTime, event.endTime) : 0
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function nextDay(date: Date): Date {
  const result = startOfDay(date)
  result.setDate(result.getDate() + 1)
  return result
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function dateAtMinutes(date: Date, minutesSinceMidnight: number): Date {
  const result = startOfDay(date)
  result.setHours(
    Math.floor(minutesSinceMidnight / 60),
    minutesSinceMidnight % 60,
    0,
    0,
  )
  return result
}

function overlaps(startTime: Date, endTime: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return startTime < rangeEnd && endTime > rangeStart
}

function clipInterval(
  startTime: Date,
  endTime: Date,
  rangeStart: Date,
  rangeEnd: Date,
): TimeInterval | null {
  if (!overlaps(startTime, endTime, rangeStart, rangeEnd)) return null

  return {
    startTime: new Date(Math.max(startTime.getTime(), rangeStart.getTime())),
    endTime: new Date(Math.min(endTime.getTime(), rangeEnd.getTime())),
  }
}

function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = [...intervals].sort(
    (first, second) => first.startTime.getTime() - second.startTime.getTime(),
  )
  const merged: TimeInterval[] = []

  for (const interval of sorted) {
    const previous = merged[merged.length - 1]
    if (!previous || interval.startTime > previous.endTime) {
      merged.push({ ...interval })
    } else if (interval.endTime > previous.endTime) {
      previous.endTime = interval.endTime
    }
  }

  return merged
}

function getInclusiveAnalysisRange(startDate: Date, endDate: Date): TimeInterval | null {
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return null

  const rangeStart = startOfDay(startDate)
  const rangeEnd = nextDay(endDate)
  return rangeStart < rangeEnd ? { startTime: rangeStart, endTime: rangeEnd } : null
}

export function calculateEventCount(events: CalendarEvent[]): number {
  return events.filter(isValidEvent).length
}

export function calculateTotalMeetingMinutes(events: CalendarEvent[]): number {
  return events.reduce((sum, event) => sum + getEventDurationMinutes(event), 0)
}

export function calculateAverageMeetingDuration(events: CalendarEvent[]): number | null {
  const validEvents = events.filter(isValidEvent)
  if (validEvents.length === 0) return null
  return calculateTotalMeetingMinutes(validEvents) / validEvents.length
}

export function calculateFreeTimeBlocks(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): FreeTimeBlock[] {
  const analysisRange = getInclusiveAnalysisRange(startDate, endDate)
  if (!analysisRange) return []

  const workStartMinutes = timeStringToMinutes(config.startTime)
  const workEndMinutes = timeStringToMinutes(config.endTime)
  if (
    !Number.isFinite(workStartMinutes) ||
    !Number.isFinite(workEndMinutes) ||
    workStartMinutes >= workEndMinutes
  ) {
    return []
  }

  const freeBlocks: FreeTimeBlock[] = []
  const currentDate = new Date(analysisRange.startTime)

  while (currentDate < analysisRange.endTime) {
    if (config.workDays.includes(currentDate.getDay())) {
      const workStart = dateAtMinutes(currentDate, workStartMinutes)
      const workEnd = dateAtMinutes(currentDate, workEndMinutes)
      const busyIntervals = mergeIntervals(
        events
          .filter(isValidEvent)
          .map((event) => clipInterval(event.startTime, event.endTime, workStart, workEnd))
          .filter((interval): interval is TimeInterval => interval !== null),
      )

      let freeStart = workStart
      for (const busy of busyIntervals) {
        if (busy.startTime > freeStart) {
          freeBlocks.push({
            startTime: new Date(freeStart),
            endTime: new Date(busy.startTime),
            duration: getDurationMinutes(freeStart, busy.startTime),
          })
        }
        freeStart = busy.endTime
      }

      if (freeStart < workEnd) {
        freeBlocks.push({
          startTime: new Date(freeStart),
          endTime: new Date(workEnd),
          duration: getDurationMinutes(freeStart, workEnd),
        })
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return freeBlocks
}

export function calculateEventsByDay(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
): DayEventStats[] {
  const analysisRange = getInclusiveAnalysisRange(startDate, endDate)
  if (!analysisRange) return []

  const validEvents = events.filter(isValidEvent)
  const stats: DayEventStats[] = []
  const currentDate = new Date(analysisRange.startTime)

  while (currentDate < analysisRange.endTime) {
    const dayStart = new Date(currentDate)
    const dayEnd = nextDay(dayStart)
    const dayIntervals = validEvents
      .map((event) => clipInterval(event.startTime, event.endTime, dayStart, dayEnd))
      .filter((interval): interval is TimeInterval => interval !== null)

    stats.push({
      date: dayStart,
      eventCount: dayIntervals.length,
      totalDuration: dayIntervals.reduce(
        (sum, interval) => sum + getDurationMinutes(interval.startTime, interval.endTime),
        0,
      ),
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return stats
}

export function calculateBaseMetrics(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  workingHoursConfig: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): BaseMetrics {
  const analysisRange = getInclusiveAnalysisRange(startDate, endDate)
  const relevantEvents = analysisRange
    ? events
        .filter(isValidEvent)
        .map((event) => {
          const interval = clipInterval(
            event.startTime,
            event.endTime,
            analysisRange.startTime,
            analysisRange.endTime,
          )
          return interval ? { ...event, ...interval } : null
        })
        .filter((event): event is CalendarEvent => event !== null)
    : []

  return {
    eventCount: calculateEventCount(relevantEvents),
    totalMeetingMinutes: calculateTotalMeetingMinutes(relevantEvents),
    averageMeetingDuration: calculateAverageMeetingDuration(relevantEvents),
    freeTimeBlocks: calculateFreeTimeBlocks(
      relevantEvents,
      startDate,
      endDate,
      workingHoursConfig,
    ),
    eventsByDay: calculateEventsByDay(relevantEvents, startDate, endDate),
  }
}

export function formatMinutesToHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '-'

  const roundedMinutes = Math.round(minutes)
  const hours = Math.floor(roundedMinutes / 60)
  const remainingMinutes = roundedMinutes % 60
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`
}

export function formatMinutesToDecimalHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '-'
  return `${(minutes / 60).toFixed(1)}h`
}
