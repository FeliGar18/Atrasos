"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface AdminPanelProps {
  onDataChanged: () => void
  refreshKey?: number
}

export function AdminPanel({ onDataChanged, refreshKey }: AdminPanelProps) {
  const [importing, setImporting] = useState(false)
  const [dbStatus, setDbStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load student count from DB on mount and when refreshKey changes
  const loadStudentCount = useCallback(async () => {
    try {
      const res = await fetch("/api/students")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setDbStatus(`${data.length} alumnos en base de datos`)
        } else {
          setDbStatus(null)
        }
      }
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    loadStudentCount()
  }, [loadStudentCount, refreshKey])

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    keyword: string
    action: () => Promise<void>
  } | null>(null)
  const [confirmInput, setConfirmInput] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/students/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al importar archivo")
        return
      }
      toast.success(data.message)
      onDataChanged()
      loadStudentCount()
    } catch {
      toast.error("Error al importar archivo")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openConfirm = (type: "tardies" | "students") => {
    const isLates = type === "tardies"
    setConfirmModal({
      open: true,
      title: isLates ? "Limpiar Atrasos" : "Quitar Base de Datos",
      message: isLates
        ? "Esta accion eliminara <strong>TODOS los registros de atrasos</strong> de forma permanente."
        : "Esta accion eliminara <strong>TODA la base de datos de alumnos</strong> de forma permanente.",
      keyword: "Limpiar",
      action: async () => {
        const url = isLates ? "/api/tardies" : "/api/students"
        const res = await fetch(url, { method: "DELETE" })
        if (!res.ok) throw new Error()
        const data = await res.json()
        toast.success(data.message)
        if (!isLates) setDbStatus(null)
        onDataChanged()
      },
    })
    setConfirmInput("")
  }

  const handleConfirmAction = async () => {
    if (!confirmModal || confirmInput !== confirmModal.keyword) return
    setProcessing(true)
    try {
      await confirmModal.action()
      setConfirmModal(null)
    } catch {
      toast.error("Error al realizar la operacion")
    } finally {
      setProcessing(false)
    }
  }

  // Export buttons
  const exportReport = async (type: string) => {
    try {
      const res = await fetch(`/api/export?period=${type}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const labels: Record<string, string> = {
        today: "Diario",
        month: "Mensual",
        semester: "Semestral",
        all: "Completo",
      }
      const clDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date())
      a.download = `Reporte_${labels[type]}_${clDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Exportado: Reporte ${labels[type]}`)
    } catch {
      toast.error("Error al exportar")
    }
  }

  return (
    <>
      {/* Upload DB Card */}
      <div className="card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
        <div className="card-title-bar mb-5 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Base de Datos Alumnos
        </div>

        <label
          htmlFor="file-upload"
          className="upload-area block"
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <p className="mb-2 text-3xl">{"📂"}</p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-primary">
              {importing ? "Importando..." : "Cargar Excel / CSV"}
            </strong>
            <br />
            Columnas: Nombre, Apellido, RUT, Regimen
          </p>
        </label>

        <p className="mt-2.5 text-center text-xs">
          {dbStatus ? (
            <span className="text-success">{dbStatus}</span>
          ) : (
            <span className="text-muted-foreground">Sin base de datos cargada</span>
          )}
        </p>
      </div>

      {/* Export Reports Card */}
      <div className="card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
        <div className="card-title-bar mb-5 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Exportar Reportes
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "Diario", key: "today", icon: "📅" },
            { label: "Mensual", key: "month", icon: "📆" },
            { label: "Semestral", key: "semester", icon: "📊" },
            { label: "Completo", key: "all", icon: "📋" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => exportReport(item.key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface2 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Card */}
      <div className="card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
        <div className="card-title-bar mb-5 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Administracion
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => openConfirm("tardies")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-surface2 px-4 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10"
          >
            {"🗑"} Limpiar Atrasos
          </button>
          <button
            onClick={() => openConfirm("students")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-surface2 px-4 py-2.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10"
          >
            {"🗃"} Quitar BD
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal?.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModal(null)
          }}
        >
          <div className="animate-modal-in w-[90%] max-w-[420px] rounded-2xl border border-destructive/50 bg-[#1a1a2e] p-8 shadow-[0_0_40px_rgba(255,71,87,0.2)]">
            <h3 className="mb-3 text-lg font-bold text-destructive">
              {confirmModal.title}
            </h3>
            <p
              className="mb-5 text-sm leading-relaxed text-[#b0b0c8]"
              dangerouslySetInnerHTML={{ __html: confirmModal.message }}
            />
            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/[0.08] p-3 text-sm text-[#b0b0c8]">
              Para confirmar, escribe{" "}
              <strong className="font-mono text-destructive">{confirmModal.keyword}</strong>{" "}
              en el campo de abajo:
            </div>
            <input
              type="text"
              placeholder={`Escribe ${confirmModal.keyword} para confirmar`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAction()
              }}
              autoFocus
              className="mb-4 w-full rounded-lg border border-destructive/30 bg-[#0d0d1a] px-3.5 py-2.5 font-mono text-sm text-white outline-none"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="rounded-lg border border-white/15 bg-transparent px-5 py-2.5 text-sm text-[#b0b0c8] transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmInput !== confirmModal.keyword || processing}
                className="rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              >
                {processing ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
