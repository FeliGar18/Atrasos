"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserCheck, AlertTriangle, Clock } from "lucide-react"
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
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchStudent = async () => {
    if (!rut.trim()) {
      toast.error("Ingrese un RUT para buscar")
      return
    }

    setLoading(true)
    setStudent(null)

    try {
      const res = await fetch(
        `/api/students?rut=${encodeURIComponent(rut.trim())}`
      )
      if (!res.ok) {
        toast.error("Alumno no encontrado. Verifique el RUT ingresado.")
        return
      }
      const data = await res.json()
      setStudent(data)
    } catch {
      toast.error("Error al buscar alumno")
    } finally {
      setLoading(false)
    }
  }

  const registerTardy = async () => {
    if (!student) return

    setRegistering(true)
    try {
      const res = await fetch("/api/tardies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student.id }),
      })

      if (!res.ok) {
        toast.error("Error al registrar atraso")
        return
      }

      const data = await res.json()

      toast.success(
        `Atraso registrado para ${student.nombre} ${student.apellido}`
      )

      if (data.alert) {
        setTimeout(() => {
          toast.warning(
            `ALERTA: ${student.nombre} ${student.apellido} tiene ${data.total_tardies} atrasos. Se debe llamar al apoderado por atrasos reiterativos.`,
            {
              duration: 10000,
              important: true,
            }
          )
        }, 500)
      }

      setStudent(null)
      setRut("")
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-primary" />
          Registrar Atraso
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ingrese RUT del alumno (ej: 12345678)"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            autoFocus
          />
          <Button onClick={searchStudent} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ingrese el RUT sin puntos y sin digito verificador. El sistema
          los eliminara automaticamente si los incluye.
        </p>

        {student && (
          <div className="rounded-lg border bg-secondary/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {student.nombre} {student.apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    RUT: {student.rut}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {student.regimen === "I" ? "Interno" : "Externo"}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      {student.tardies_total} atrasos totales
                    </Badge>
                    {student.tardies_total >= 3 && (
                      <Badge
                        variant="destructive"
                        className="bg-destructive text-destructive-foreground"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Llamar apoderado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={registerTardy}
                disabled={registering}
                size="lg"
                className="shrink-0"
              >
                {registering ? "Registrando..." : "Marcar Atraso"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
