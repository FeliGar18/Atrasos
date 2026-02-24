"use client"

import { useState } from "react"
import useSWR from "swr"

interface TardyRecord {
  id: number
  student_id: number
  fecha: string
  hora: string
  students: {
    id: number
    nombre: string
    apellido: string
    rut: string
    regimen: string
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TardyTableProps {
  refreshKey: number
}

export function TardyTable({ refreshKey }: TardyTableProps) {
  const [period, setPeriod] = useState("today")
  const [filterText, setFilterText] = useState("")

  const { data: tardies, isLoading } = useSWR<TardyRecord[]>(
    `/api/tardies?period=${period}&_=${refreshKey}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  // Group by student for counting
  const studentTardyCounts: Record<number, number> = {}
  const records = Array.isArray(tardies) ? tardies : []
  records.forEach((t) => {
    studentTardyCounts[t.student_id] = (studentTardyCounts[t.student_id] || 0) + 1
  })

  // Filter by text
  const filtered = records.filter((t) => {
    if (!filterText) return true
    const search = filterText.toLowerCase()
    const fullName = `${t.students?.nombre} ${t.students?.apellido}`.toLowerCase()
    return fullName.includes(search) || t.students?.rut?.includes(search)
  })

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/export?period=${period}`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const labels: Record<string, string> = { today: "Diario", month: "Mensual", semester: "Semestral" }
      a.download = `Reporte_Atrasos_${labels[period]}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      console.error("Export error")
    }
  }

  return (
    <div className="card-glow flex flex-1 flex-col rounded-2xl border border-border bg-card p-6 transition-shadow">
      <div className="card-title-bar mb-4 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Registro de Atrasos
      </div>

      {/* Filter Row */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          placeholder="Buscar por nombre o RUT..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface2 px-3.5 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-border bg-surface2 px-3.5 py-2.5 font-sans text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="today">Hoy</option>
          <option value="month">Este mes</option>
          <option value="semester">Semestre</option>
        </select>
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface2 px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary">
            {"📥"} Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[460px] overflow-y-auto rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="mb-3 text-4xl">{"📋"}</p>
            <p className="text-sm">
              {records.length === 0
                ? "Sin registros de atrasos"
                : "Sin resultados para los filtros seleccionados"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Alumno
                </th>
                <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  RUT
                </th>
                <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Regimen
                </th>
                <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Atrasos
                </th>
                <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha / Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tardy) => {
                const count = studentTardyCounts[tardy.student_id] || 0
                const countClass =
                  count >= 3
                    ? "bg-destructive/20 text-destructive animate-pulse-danger"
                    : count >= 2
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success"

                return (
                  <tr
                    key={tardy.id}
                    className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {tardy.students?.nombre} {tardy.students?.apellido}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {tardy.students?.rut}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
                          tardy.students?.regimen === "I"
                            ? "border-internal/30 bg-internal/15 text-internal"
                            : "border-external/30 bg-external/15 text-external"
                        }`}
                      >
                        {tardy.students?.regimen === "I" ? "Interno" : "Externo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-mono text-sm font-bold ${countClass}`}
                      >
                        {count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-surface2 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {tardy.fecha} {tardy.hora}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          Total: {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
