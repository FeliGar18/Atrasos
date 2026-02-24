"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { StatsCards } from "@/components/stats-cards"
import { RutSearch } from "@/components/rut-search"
import { TardyTable } from "@/components/tardy-table"
import { AdminPanel } from "@/components/admin-panel"
import { Clock } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentDate, setCurrentDate] = useState("")
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    function updateDateTime() {
      const now = new Date()
      setCurrentDate(
        now.toLocaleDateString("es-CL", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
      setCurrentTime(
        now.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Santiago",
        })
      )
    }
    updateDateTime()
    const interval = setInterval(updateDateTime, 30000)
    return () => clearInterval(interval)
  }, [])

  const { data: stats } = useSWR(
    `/api/stats?_=${refreshKey}`,
    fetcher,
    { refreshInterval: 15000 }
  )

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Control de Atrasos
              </h1>
              <p className="text-xs text-muted-foreground">
                Sistema de registro y seguimiento
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {currentDate || "\u00A0"}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentTime || "\u00A0"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <StatsCards
          today={stats?.today ?? 0}
          month={stats?.month ?? 0}
          semester={stats?.semester ?? 0}
          totalStudents={stats?.totalStudents ?? 0}
        />

        <RutSearch onTardyRegistered={triggerRefresh} />

        <TardyTable refreshKey={refreshKey} />

        <AdminPanel onDataChanged={triggerRefresh} />
      </main>

      <footer className="border-t bg-card py-4">
        <p className="text-center text-xs text-muted-foreground">
          Sistema de Control de Atrasos &mdash; Uso exclusivo del establecimiento
        </p>
      </footer>
    </div>
  )
}
