"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Student {
  id: number
  nombre: string
  apellido: string
  rut: string
  regimen: string
  tardies_today: number
  tardies_month: number
  tardies_semester: number
  tardies_total: number
}

interface RutSearchProps {
  onTardyRegistered: () => void
}

export function RutSearch({ onTardyRegistered }: RutSearchProps) {
  const [rut, setRut] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    open: boolean
    name: string
    rut: string
    count: number
  }>({ open: false, name: "", rut: "", count: 0 })

  const searchStudent = useCallback(async () => {
    if (!rut.trim()) return
    setLoading(true)
    setStudent(null)
    setNotFound(false)

    try {
      const res = await fetch(`/api/students?rut=${encodeURIComponent(rut.trim())}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setStudent(data)
    } catch {
      toast.error("Error al buscar alumno")
    } finally {
      setLoading(false)
    }
  }, [rut])

  const registerTardy = async () => {
    if (!student) return
    setRegistering(true)
    try {
      const res = await fetch("/api/tardies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student.id, descripcion }),
      })
      if (!res.ok) {
        toast.error("Error al registrar atraso")
        return
      }
      const data = await res.json()
      toast.success(`Atraso registrado: ${student.nombre} ${student.apellido} - ${data.hora}`)

      if (data.alert) {
        setAlertModal({
          open: true,
          name: `${student.nombre} ${student.apellido}`,
          rut: student.rut,
          count: data.total_tardies,
        })
      }

      setStudent(null)
      setRut("")
      setDescripcion("")
      onTardyRegistered()
      inputRef.current?.focus()
    } catch {
      toast.error("Error al registrar atraso")
    } finally {
      setRegistering(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (student) {
        registerTardy()
      } else {
        searchStudent()
      }
    }
  }

  const initials = student
    ? (student.nombre[0] || "") + (student.apellido[0] || "")
    : ""

  return (
    <>
      <div className="card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
        <div className="card-title-bar mb-5 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Registrar Atraso
        </div>

        {/* RUT Input */}
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ingrese RUT del alumno"
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
            value={rut}
            onChange={(e) => {
              setRut(e.target.value)
              setNotFound(false)
              if (!e.target.value.trim()) setStudent(null)
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border-2 border-border bg-surface2 px-5 py-4 font-mono text-xl font-semibold tracking-wider text-foreground outline-none transition-all placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,201,167,0.15)]"
          />
        </div>

        {/* Student Preview */}
        <div
          className={`mb-4 flex min-h-[80px] items-center gap-4 rounded-xl border p-4 transition-all ${
            student
              ? "border-primary bg-primary/5"
              : notFound
                ? "border-destructive bg-destructive/5"
                : "border-border bg-surface2"
          }`}
        >
          {student ? (
            <>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#007a6e] text-xl font-bold text-white">
                {initials.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">
                  {student.nombre} {student.apellido}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={`mr-2 inline-block rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
                      student.regimen === "I"
                        ? "border-internal/30 bg-internal/15 text-internal"
                        : "border-external/30 bg-external/15 text-external"
                    }`}
                  >
                    {student.regimen === "I" ? "Interno" : "Externo"}
                  </span>
                  {student.rut}
                </p>
              </div>
              <div className="text-center">
                <p
                  className={`font-mono text-3xl font-extrabold leading-none ${
                    student.tardies_total >= 3
                      ? "animate-pulse-danger text-destructive"
                      : "text-warning"
                  }`}
                >
                  {student.tardies_total}
                </p>
                <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  atrasos
                </p>
              </div>
            </>
          ) : notFound ? (
            <p className="w-full text-center text-sm text-destructive">
              RUT no encontrado en la base de datos
            </p>
          ) : (
            <p className="w-full text-center text-sm text-muted-foreground">
              Ingrese un RUT para buscar al alumno
            </p>
          )}
        </div>

        {/* Description */}
        {student && (
          <div className="mb-4">
            <textarea
              placeholder="Motivo del atraso (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,201,167,0.15)]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!student && (
            <Button
              onClick={searchStudent}
              disabled={loading || !rut.trim()}
              className="flex-1 bg-secondary text-foreground hover:bg-secondary/80"
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          )}
          <Button
            onClick={registerTardy}
            disabled={!student || registering}
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-[#00a896] py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(0,201,167,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,201,167,0.4)] disabled:opacity-30"
          >
            {"⏰"} Registrar Atraso
          </Button>
        </div>
      </div>

      {/* Alert Modal */}
      {alertModal.open && (
        <div
          className="fixed inset-0 z-[999] grid place-items-center bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlertModal((p) => ({ ...p, open: false }))
          }}
        >
          <div className="animate-modal-in max-w-[440px] rounded-2xl border-2 border-destructive bg-card p-9 text-center shadow-[0_0_60px_rgba(255,71,87,0.3)]">
            <p className="animate-shake mb-4 text-5xl">{"🚨"}</p>
            <h2 className="mb-2.5 text-xl font-extrabold text-destructive">
              Alerta de Atrasos Reiterativos
            </h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              <strong className="text-foreground">{alertModal.name}</strong> ({alertModal.rut}){" "}
              ha acumulado <strong className="text-foreground">{alertModal.count} atrasos</strong>.
              <br /><br />
              <strong className="text-foreground">Se debe llamar al apoderado</strong> por atrasos reiterativos.
            </p>
            <button
              onClick={() => setAlertModal((p) => ({ ...p, open: false }))}
              className="rounded-xl bg-destructive px-8 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,71,87,0.4)]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
