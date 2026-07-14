export const ANALYSIS_TIME_ZONE = 'Europe/Berlin'

export type ZonedDateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export type DayBoundaries = {
  dateKey: string
  startTime: Date
  endTime: Date
  dayOfWeek: number
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone)
  if (cached) return cached

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  formatterCache.set(timeZone, formatter)
  return formatter
}

export function getZonedDateParts(
  date: Date,
  timeZone: string = ANALYSIS_TIME_ZONE,
): ZonedDateParts {
  const values = Object.fromEntries(
    getFormatter(timeZone).formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

export function getLocalDateKey(
  date: Date,
  timeZone: string = ANALYSIS_TIME_ZONE,
): string {
  const { year, month, day } = getZonedDateParts(date, timeZone)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDateKey(dateKey: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) throw new RangeError(`Ungültiger Kalendertag: ${dateKey}`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = parseDateKey(dateKey)
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12))
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`
}

export function zonedDateTimeToDate(
  parts: ZonedDateParts,
  timeZone: string = ANALYSIS_TIME_ZONE,
): Date {
  const desiredUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  let timestamp = desiredUtc

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const represented = getZonedDateParts(new Date(timestamp), timeZone)
    const representedUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    )
    timestamp += desiredUtc - representedUtc
  }

  return new Date(timestamp)
}

export function dateAtMinutes(
  dateKey: string,
  minutesSinceMidnight: number,
  timeZone: string = ANALYSIS_TIME_ZONE,
): Date {
  const [year, month, day] = parseDateKey(dateKey)
  return zonedDateTimeToDate(
    {
      year,
      month,
      day,
      hour: Math.floor(minutesSinceMidnight / 60),
      minute: minutesSinceMidnight % 60,
      second: 0,
    },
    timeZone,
  )
}

export function getDayBoundaries(
  dateKey: string,
  timeZone: string = ANALYSIS_TIME_ZONE,
): DayBoundaries {
  const [year, month, day] = parseDateKey(dateKey)
  return {
    dateKey,
    startTime: dateAtMinutes(dateKey, 0, timeZone),
    endTime: dateAtMinutes(addCalendarDays(dateKey, 1), 0, timeZone),
    dayOfWeek: new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay(),
  }
}

export function calculateOverlapMinutes(
  startTime: Date,
  endTime: Date,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const overlapStart = Math.max(startTime.getTime(), rangeStart.getTime())
  const overlapEnd = Math.min(endTime.getTime(), rangeEnd.getTime())
  return Math.max(0, (overlapEnd - overlapStart) / 60_000)
}
