"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClipboardList,
  Download,
  AlertTriangle,
} from "lucide-react"
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

  const { data: tardies, isLoading } = useSWR<TardyRecord[]>(
    `/api/tardies?period=${period}&_=${refreshKey}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  // Count tardies per student for alert
  const studentTardyCounts: Record<number, number> = {}
  if (tardies && Array.isArray(tardies)) {
    tardies.forEach((t) => {
      studentTardyCounts[t.student_id] =
        (studentTardyCounts[t.student_id] || 0) + 1
    })
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/export?period=${period}`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const periodLabels: Record<string, string> = {
        today: "Diario",
        month: "Mensual",
        semester: "Semestral",
      }
      a.download = `Reporte_Atrasos_${periodLabels[period]}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      console.error("Export error")
    }
  }

  const records = Array.isArray(tardies) ? tardies : []

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Registro de Atrasos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs
              value={period}
              onValueChange={setPeriod}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="today">Hoy</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
                <TabsTrigger value="semester">Semestre</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="mb-2 h-10 w-10 opacity-40" />
            <p className="text-sm">No hay atrasos registrados en este periodo</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Apellido</TableHead>
                  <TableHead className="font-semibold">RUT</TableHead>
                  <TableHead className="font-semibold">Regimen</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Hora</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((tardy, index) => (
                  <TableRow key={tardy.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tardy.students?.nombre}
                    </TableCell>
                    <TableCell>{tardy.students?.apellido}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {tardy.students?.rut}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tardy.students?.regimen === "I"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tardy.students?.regimen === "I"
                          ? "Interno"
                          : "Externo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{tardy.fecha}</TableCell>
                    <TableCell>{tardy.hora}</TableCell>
                    <TableCell>
                      {studentTardyCounts[tardy.student_id] >= 3 ? (
                        <Badge
                          variant="destructive"
                          className="gap-1 bg-destructive text-destructive-foreground"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Reiterativo
                        </Badge>
                      ) : (
                        <Badge variant="outline">Registrado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {records.length > 0 && (
          <p className="mt-3 text-right text-sm text-muted-foreground">
            Total: {records.length} atraso{records.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
