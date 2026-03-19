"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  GraduationCap,
} from "lucide-react"

interface RankingStudent {
  id: number
  nombre: string
  apellido: string
  rut: string
  regimen: string
  curso: string
  count: number
  lastTardy: string
}

interface ReportsData {
  ranking: RankingStudent[]
  dayOfWeekData: { day: string; atrasos: number }[]
  monthlyData: { month: string; atrasos: number }[]
  courseData: { curso: string; total: number; internos: number; externos: number }[]
  trendData: { fecha: string; atrasos: number }[]
  summary: {
    today: number
    month: number
    semester: number
    alertCount: number
    totalStudentsWithTardies: number
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = ["#00c9a7", "#00b4d8", "#ffd166", "#ff4757", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"]

const chartConfig = {
  atrasos: {
    label: "Atrasos",
    color: "#00c9a7",
  },
  internos: {
    label: "Internos",
    color: "#00b4d8",
  },
  externos: {
    label: "Externos",
    color: "#ffd166",
  },
}

export function ReportsPanel({ refreshKey }: { refreshKey: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<"ranking" | "charts" | "courses">("ranking")
  const printRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useSWR<ReportsData>(
    isExpanded ? `/api/reports?_=${refreshKey}` : null,
    fetcher
  )

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de impresion")
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Atrasos - Liceo Bicentenario Industrial</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1a2235; border-bottom: 2px solid #00c9a7; padding-bottom: 10px; }
            h2 { color: #00c9a7; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #1a2235; color: white; }
            tr:nth-child(even) { background: #f5f5f5; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
            .badge-interno { background: #e0f7fa; color: #00796b; }
            .badge-externo { background: #fff3e0; color: #e65100; }
            .badge-alert { background: #ffebee; color: #c62828; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .summary-item { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #00c9a7; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Reporte de Atrasos</h1>
          <p>Liceo Bicentenario Industrial Ing. Ricardo Fenner Ruedi</p>
          <p>Fecha: ${new Date().toLocaleDateString("es-CL")}</p>
          ${printContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExportPDF = async () => {
    toast.info("Preparando PDF...")
    // Use print dialog as PDF (users can "Save as PDF" from print dialog)
    handlePrint()
  }

  const tabs = [
    { id: "ranking" as const, label: "Ranking", icon: Trophy },
    { id: "charts" as const, label: "Graficos", icon: BarChart3 },
    { id: "courses" as const, label: "Por Curso", icon: GraduationCap },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface2/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Reportes Avanzados
            </h2>
            <p className="text-xs text-muted-foreground">Ranking, graficos y estadisticas</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border p-5">
          {/* Action Buttons */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-sm font-medium text-foreground hover:bg-surface2/70 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-lg bg-surface2 px-3 py-2 text-sm font-medium text-foreground hover:bg-surface2/70 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-lg bg-surface2 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !data ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-surface2 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{data.summary.semester}</div>
                  <div className="text-xs text-muted-foreground">Semestre</div>
                </div>
                <div className="rounded-xl bg-surface2 p-3 text-center">
                  <div className="text-2xl font-bold text-accent">{data.summary.month}</div>
                  <div className="text-xs text-muted-foreground">Este Mes</div>
                </div>
                <div className="rounded-xl bg-surface2 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{data.summary.totalStudentsWithTardies}</div>
                  <div className="text-xs text-muted-foreground">Alumnos</div>
                </div>
                <div className="rounded-xl bg-surface2 p-3 text-center">
                  <div className="text-2xl font-bold text-destructive">{data.summary.alertCount}</div>
                  <div className="text-xs text-muted-foreground">Con Alerta</div>
                </div>
              </div>

              {/* Printable Content */}
              <div ref={printRef}>
                {/* Ranking Tab */}
                {activeTab === "ranking" && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Trophy className="h-4 w-4 text-warning" />
                      Top 20 Alumnos con Mas Atrasos
                    </h3>
                    <div className="max-h-[400px] overflow-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-surface2">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Alumno</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Curso</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Atrasos</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Ultimo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.ranking.slice(0, 20).map((student, index) => (
                            <tr key={student.id} className="border-t border-border/50 hover:bg-surface2/50">
                              <td className="px-3 py-2 font-mono text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-foreground">
                                  {student.nombre} {student.apellido}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <span className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    student.regimen === "I"
                                      ? "bg-internal/20 text-internal badge-interno"
                                      : "bg-external/20 text-external badge-externo"
                                  }`}>
                                    {student.regimen === "I" ? "INT" : "EXT"}
                                  </span>
                                  {student.rut}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{student.curso}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-bold ${
                                  student.count >= 5
                                    ? "bg-destructive/20 text-destructive badge-alert"
                                    : student.count >= 3
                                    ? "bg-warning/20 text-warning"
                                    : "bg-primary/20 text-primary"
                                }`}>
                                  {student.count}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                                {student.lastTardy}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Charts Tab */}
                {activeTab === "charts" && (
                  <div className="space-y-6">
                    {/* By Day of Week */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        Atrasos por Dia de la Semana
                      </h3>
                      <div className="h-[200px] rounded-xl bg-surface2 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.dayOfWeekData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                            <XAxis dataKey="day" tick={{ fill: "#8892a4", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#8892a4", fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ background: "#1a2235", border: "1px solid #1e2d45", borderRadius: "8px" }}
                              labelStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="atrasos" fill="#00c9a7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Monthly Trend */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        Tendencia Mensual
                      </h3>
                      <div className="h-[200px] rounded-xl bg-surface2 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                            <XAxis dataKey="month" tick={{ fill: "#8892a4", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#8892a4", fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ background: "#1a2235", border: "1px solid #1e2d45", borderRadius: "8px" }}
                              labelStyle={{ color: "#fff" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="atrasos"
                              stroke="#00b4d8"
                              strokeWidth={2}
                              dot={{ fill: "#00b4d8", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Daily Trend (Last 30 days) */}
                    {data.trendData.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <TrendingUp className="h-4 w-4 text-warning" />
                          Ultimos 30 Dias
                        </h3>
                        <div className="h-[200px] rounded-xl bg-surface2 p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                              <XAxis dataKey="fecha" tick={{ fill: "#8892a4", fontSize: 10 }} />
                              <YAxis tick={{ fill: "#8892a4", fontSize: 12 }} />
                              <Tooltip
                                contentStyle={{ background: "#1a2235", border: "1px solid #1e2d45", borderRadius: "8px" }}
                                labelStyle={{ color: "#fff" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="atrasos"
                                stroke="#ffd166"
                                strokeWidth={2}
                                dot={{ fill: "#ffd166", r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Courses Tab */}
                {activeTab === "courses" && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Atrasos por Curso
                    </h3>
                    
                    {/* Chart */}
                    <div className="mb-4 h-[250px] rounded-xl bg-surface2 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.courseData.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                          <XAxis type="number" tick={{ fill: "#8892a4", fontSize: 12 }} />
                          <YAxis dataKey="curso" type="category" tick={{ fill: "#8892a4", fontSize: 11 }} width={80} />
                          <Tooltip
                            contentStyle={{ background: "#1a2235", border: "1px solid #1e2d45", borderRadius: "8px" }}
                            labelStyle={{ color: "#fff" }}
                          />
                          <Bar dataKey="internos" stackId="a" fill="#00b4d8" name="Internos" />
                          <Bar dataKey="externos" stackId="a" fill="#ffd166" name="Externos" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="max-h-[300px] overflow-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-surface2">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Curso</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Total</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Internos</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Externos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.courseData.map((course) => (
                            <tr key={course.curso} className="border-t border-border/50 hover:bg-surface2/50">
                              <td className="px-3 py-2 font-medium text-foreground">{course.curso}</td>
                              <td className="px-3 py-2 text-center font-bold text-primary">{course.total}</td>
                              <td className="px-3 py-2 text-center text-internal">{course.internos}</td>
                              <td className="px-3 py-2 text-center text-external">{course.externos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
