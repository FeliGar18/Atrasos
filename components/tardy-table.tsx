"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"

interface TardyRecord {
  id: number
  student_id: number
  fecha: string
  hora: string
  descripcion?: string
  created_at: string
}

interface StudentWithTardies {
  id: number
  nombre: string
  apellido: string
  rut: string
  regimen: string
  tardies: TardyRecord[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TardyTableProps {
  refreshKey: number
  onRefresh: () => void
}

export function TardyTable({ refreshKey, onRefresh }: TardyTableProps) {
  const [filterText, setFilterText] = useState("")
  const [filterRegimen, setFilterRegimen] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("today")
  const [selectedStudent, setSelectedStudent] = useState<StudentWithTardies | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: rawTardies, isLoading } = useSWR<
    Array<TardyRecord & { students: { id: number; nombre: string; apellido: string; rut: string; regimen: string } }>
  >(`/api/tardies?period=${filterPeriod}&_=${refreshKey}`, fetcher, { refreshInterval: 10000 })

  // Group tardies by student
  const groupedStudents: StudentWithTardies[] = (() => {
    const records = Array.isArray(rawTardies) ? rawTardies : []
    const map = new Map<number, StudentWithTardies>()

    for (const t of records) {
      if (!t.students) continue
      const sid = t.student_id
      if (!map.has(sid)) {
        map.set(sid, {
          id: t.students.id,
          nombre: t.students.nombre,
          apellido: t.students.apellido,
          rut: t.students.rut,
          regimen: t.students.regimen,
          tardies: [],
        })
      }
      map.get(sid)!.tardies.push({
        id: t.id,
        student_id: t.student_id,
        fecha: t.fecha,
        hora: t.hora,
        descripcion: t.descripcion,
        created_at: t.created_at,
      })
    }

    // Sort each student's tardies from newest to oldest
    for (const s of map.values()) {
      s.tardies.sort((a, b) => b.id - a.id)
    }

    return Array.from(map.values())
  })()

  // Filter
  const filtered = groupedStudents.filter((s) => {
    if (filterRegimen !== "all" && s.regimen !== filterRegimen) return false
    if (!filterText) return true
    const search = filterText.toLowerCase()
    const fullName = `${s.nombre} ${s.apellido}`.toLowerCase()
    return fullName.includes(search) || s.rut.includes(search)
  })

  // Get last tardy for each student
  const getLastTardy = (s: StudentWithTardies) => {
    if (s.tardies.length === 0) return { fecha: "", hora: "" }
    return s.tardies[0]
  }

  // Delete a single tardy
  const deleteTardy = async (tardyId: number) => {
    setDeletingId(tardyId)
    try {
      const res = await fetch(`/api/tardies/${tardyId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Atraso eliminado")
      onRefresh()
      // Update the selected student's tardy list
      if (selectedStudent) {
        const updatedTardies = selectedStudent.tardies.filter((t) => t.id !== tardyId)
        if (updatedTardies.length === 0) {
          setSelectedStudent(null)
        } else {
          setSelectedStudent({ ...selectedStudent, tardies: updatedTardies })
        }
      }
    } catch {
      toast.error("Error al eliminar atraso")
    } finally {
      setDeletingId(null)
    }
  }

  const selectStudent = (s: StudentWithTardies) => {
    setSelectedStudent(selectedStudent?.id === s.id ? null : s)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Main Table Card */}
      <div className="card-glow flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow">
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
            value={filterRegimen}
            onChange={(e) => setFilterRegimen(e.target.value)}
            className="rounded-lg border border-border bg-surface2 px-3.5 py-2.5 font-sans text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="I">Internos</option>
            <option value="E">Externos</option>
          </select>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="rounded-lg border border-border bg-surface2 px-3.5 py-2.5 font-sans text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="today">Hoy</option>
            <option value="month">Este mes</option>
            <option value="semester">Semestre</option>
          </select>
        </div>

        {/* Table */}
        <div className="max-h-[460px] overflow-y-auto rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">
                {groupedStudents.length === 0
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
                    {"Régimen"}
                  </th>
                  <th className="sticky top-0 bg-surface2 px-4 py-3 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Atrasos
                  </th>
                  <th className="sticky top-0 bg-surface2 px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {"Último Atraso"}
                  </th>
                  <th className="sticky top-0 bg-surface2 px-4 py-3 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const count = student.tardies.length
                  const last = getLastTardy(student)
                  const isSelected = selectedStudent?.id === student.id
                  const countClass =
                    count >= 3
                      ? "bg-destructive/20 text-destructive"
                      : count >= 2
                        ? "bg-warning/15 text-warning"
                        : "bg-success/15 text-success"

                  return (
                    <tr
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-white/[0.03] ${isSelected ? "bg-primary/[0.06]" : ""}`}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {student.nombre} {student.apellido}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {student.rut}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
                            student.regimen === "I"
                              ? "border-internal/30 bg-internal/15 text-internal"
                              : "border-external/30 bg-external/15 text-external"
                          }`}
                        >
                          {student.regimen === "I" ? "Interno" : "Externo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg font-mono text-sm font-bold ${countClass}`}
                        >
                          {count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-surface2 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {last.fecha} {last.hora}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Delete the most recent tardy for this student
                            if (student.tardies[0]) {
                              deleteTardy(student.tardies[0].id)
                            }
                          }}
                          disabled={deletingId !== null}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/30 text-destructive transition-all hover:bg-destructive/20"
                          title="Eliminar ultimo atraso"
                          aria-label={`Eliminar ultimo atraso de ${student.nombre} ${student.apellido}`}
                        >
                          {"×"}
                        </button>
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
            {filtered.length} alumno{filtered.length !== 1 ? "s" : ""} con atrasos
          </p>
        )}
      </div>

      {/* Student History Panel */}
      {selectedStudent && (
        <div className="animate-modal-in card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
          <div className="card-title-bar mb-4 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Historial del Alumno
          </div>

          <div className="mb-5 flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground">
              {selectedStudent.nombre} {selectedStudent.apellido}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
                selectedStudent.regimen === "I"
                  ? "border-internal/30 bg-internal/15 text-internal"
                  : "border-external/30 bg-external/15 text-external"
              }`}
            >
              {selectedStudent.regimen === "I" ? "Interno" : "Externo"}
            </span>
          </div>

          {/* History Table */}
          <div className="max-h-[300px] overflow-y-auto rounded-lg">
            <table className="w-full text-sm">
              <tbody>
                {selectedStudent.tardies.map((tardy, index) => (
                  <tr
                    key={tardy.id}
                    className="border-b border-border/40 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-semibold text-muted-foreground">
                      Atraso #{selectedStudent.tardies.length - index}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">
                      {tardy.fecha}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-muted-foreground" title={tardy.descripcion || ""}>
                      {tardy.descripcion || "---"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                      {tardy.hora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setSelectedStudent(null)}
              className="rounded-lg border border-border bg-surface2 px-8 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
