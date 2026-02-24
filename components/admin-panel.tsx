"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Settings,
  Trash2,
  DatabaseZap,
  Upload,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface AdminPanelProps {
  onDataChanged: () => void
}

export function AdminPanel({ onDataChanged }: AdminPanelProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "tardies" | "students"
    confirmWord: string
  }>({ open: false, type: "tardies", confirmWord: "" })
  const [confirmInput, setConfirmInput] = useState("")
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openConfirm = (type: "tardies" | "students") => {
    setConfirmDialog({
      open: true,
      type,
      confirmWord: "Limpiar",
    })
    setConfirmInput("")
  }

  const handleConfirm = async () => {
    if (confirmInput !== "Limpiar") {
      toast.error('Debe escribir "Limpiar" exactamente para confirmar')
      return
    }

    setProcessing(true)
    try {
      const url =
        confirmDialog.type === "tardies" ? "/api/tardies" : "/api/students"
      const res = await fetch(url, { method: "DELETE" })

      if (!res.ok) throw new Error()

      const data = await res.json()
      toast.success(data.message)
      setConfirmDialog({ open: false, type: "tardies", confirmWord: "" })
      onDataChanged()
    } catch {
      toast.error("Error al realizar la operacion")
    } finally {
      setProcessing(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al importar archivo")
        return
      }

      toast.success(data.message)
      onDataChanged()
    } catch {
      toast.error("Error al importar archivo")
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Administracion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {importing ? "Importando..." : "Cargar Base de Datos (Excel)"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Columnas: Nombre, Apellido, RUT, Regimen
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
              aria-label="Seleccionar archivo Excel"
            />

            <Button
              variant="outline"
              onClick={() => openConfirm("tardies")}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar Atrasos
            </Button>

            <Button
              variant="outline"
              onClick={() => openConfirm("students")}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <DatabaseZap className="h-4 w-4" />
              Quitar Base de Datos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Accion
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "tardies"
                ? "Esta a punto de eliminar TODOS los registros de atrasos. Esta accion no se puede deshacer."
                : "Esta a punto de eliminar TODA la base de datos de alumnos y sus atrasos. Esta accion no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <p className="text-sm font-medium text-foreground">
              Escriba{" "}
              <span className="rounded bg-destructive/10 px-2 py-0.5 font-mono font-bold text-destructive">
                Limpiar
              </span>{" "}
              para confirmar:
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder='Escriba "Limpiar" aqui'
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirmInput !== "Limpiar" || processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? "Procesando..." : "Confirmar Eliminacion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
