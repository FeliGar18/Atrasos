"use client"

import { useEffect, useState } from "react"

interface StatsCardsProps {
  today: number
  month: number
  semester: number
  alertCount: number
}

export function StatsCards({ today, month, semester, alertCount }: StatsCardsProps) {
  const [dateLabel, setDateLabel] = useState("")
  const [monthLabel, setMonthLabel] = useState("")
  const [semLabel, setSemLabel] = useState("")

  useEffect(() => {
    const now = new Date()
    setDateLabel(
      now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" })
    )
    setMonthLabel(
      now.toLocaleDateString("es-CL", { month: "long", year: "numeric" })
    )
    // Use Chile timezone for semester calculation
    const clFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", month: "numeric", year: "numeric" })
    const clParts = clFormatter.formatToParts(now)
    const clMonth = parseInt(clParts.find(p => p.type === "month")?.value || "1")
    const clYear = parseInt(clParts.find(p => p.type === "year")?.value || "2026")

    let sem: string
    if (clMonth >= 3 && clMonth <= 7) {
      sem = "1er Semestre"
    } else if (clMonth >= 8 && clMonth <= 12) {
      sem = "2do Semestre"
    } else {
      // Jan/Feb = vacaciones, show 2do sem from prev year
      sem = "2do Semestre"
    }
    setSemLabel(`${sem} ${clMonth <= 2 ? clYear - 1 : clYear}`)
  }, [])

  const stats = [
    {
      label: "Atrasos Hoy",
      value: today,
      sub: dateLabel,
      color: "#00c9a7",
    },
    {
      label: "Este Mes",
      value: month,
      sub: monthLabel,
      color: "#ffd166",
    },
    {
      label: "Semestre Actual",
      value: semester,
      sub: semLabel,
      color: "#00b4d8",
    },
    {
      label: "Con Alerta (3+)",
      value: alertCount,
      sub: "Alumnos a contactar",
      color: "#ff4757",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-accent-line relative overflow-hidden rounded-[14px] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
          style={{ "--stat-accent": stat.color } as React.CSSProperties}
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {stat.label}
          </p>
          <p
            className={`mt-2 font-mono text-4xl font-extrabold leading-none ${stat.color === "#ff4757" && stat.value > 0 ? "animate-pulse-danger" : ""}`}
            style={{ color: stat.color }}
          >
            {stat.value}
          </p>
          <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
            {stat.sub || "\u00A0"}
          </p>
        </div>
      ))}
    </div>
  )
}
