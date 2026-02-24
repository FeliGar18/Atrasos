/**
 * Utility to get dates and times in Chile timezone (America/Santiago).
 * Handles daylight saving time (horario de verano/invierno) automatically.
 */

export function getChileNow(): Date {
  // Get current time as a Chile-formatted string, then parse components
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0"

  return {
    year: parseInt(get("year")),
    month: parseInt(get("month")), // 1-12
    day: parseInt(get("day")),
    hour: parseInt(get("hour")),
    minute: parseInt(get("minute")),
    second: parseInt(get("second")),
  } as unknown as Date
}

interface ChileDate {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

function getChileParts(): ChileDate {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0"

  return {
    year: parseInt(get("year")),
    month: parseInt(get("month")),
    day: parseInt(get("day")),
    hour: parseInt(get("hour")),
    minute: parseInt(get("minute")),
    second: parseInt(get("second")),
  }
}

/** Returns today's date in Chile as "YYYY-MM-DD" */
export function getChileToday(): string {
  const { year, month, day } = getChileParts()
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Returns current time in Chile as "HH:MM:SS" */
export function getChileTime(): string {
  const { hour, minute, second } = getChileParts()
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`
}

/** Returns start of current month in Chile as "YYYY-MM-DD" */
export function getChileStartOfMonth(): string {
  const { year, month } = getChileParts()
  return `${year}-${String(month).padStart(2, "0")}-01`
}

/**
 * Returns start of current Chilean school semester as "YYYY-MM-DD".
 * 1er Semestre: Marzo (03) - Julio (07)
 * 2do Semestre: Agosto (08) - Diciembre (12)
 * Enero/Febrero: vacaciones, se muestra 2do semestre del año anterior
 */
export function getChileSemesterStart(): string {
  const { year, month } = getChileParts()

  if (month >= 3 && month <= 7) {
    // 1er Semestre: March 1st
    return `${year}-03-01`
  } else if (month >= 8 && month <= 12) {
    // 2do Semestre: August 1st
    return `${year}-08-01`
  } else {
    // January/February: still show 2do semestre from previous year
    return `${year - 1}-08-01`
  }
}

/** Returns the current Chile month (1-12) */
export function getChileMonth(): number {
  return getChileParts().month
}

/** Returns the current Chile year */
export function getChileYear(): number {
  return getChileParts().year
}
