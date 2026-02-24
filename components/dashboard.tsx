"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { StatsCards } from "@/components/stats-cards"
import { RutSearch } from "@/components/rut-search"
import { TardyTable } from "@/components/tardy-table"
import { AdminPanel } from "@/components/admin-panel"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    function tick() {
      setCurrentTime(
        new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" })
      )
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: stats } = useSWR(
    `/api/stats?_=${refreshKey}`,
    fetcher,
    { refreshInterval: 15000 }
  )

  const triggerRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="min-h-screen bg-background" style={{
      backgroundImage: "radial-gradient(ellipse at 10% 20%, rgba(0,201,167,0.05) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(0,180,216,0.05) 0%, transparent 50%)"
    }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm" style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground" style={{ boxShadow: "0 0 20px rgba(0,201,167,0.3)" }}>
              {"⏱"}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Control de Atrasos
              </h1>
              <span className="text-[0.7rem] font-normal uppercase tracking-widest text-muted-foreground">
                Sistema de registro y seguimiento
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.08] px-4 py-2 font-mono text-lg tracking-wider text-primary">
            {currentTime || "--:--:--"}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1400px] px-6 py-7">
        {/* Stats Bar - Full width */}
        <StatsCards
          today={stats?.today ?? 0}
          month={stats?.month ?? 0}
          semester={stats?.semester ?? 0}
          alertCount={stats?.alertCount ?? 0}
        />

        {/* Two Column Layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Panel */}
          <div className="flex flex-col gap-5">
            <RutSearch onTardyRegistered={triggerRefresh} />
            <AdminPanel onDataChanged={triggerRefresh} refreshKey={refreshKey} />
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5">
            <TardyTable refreshKey={refreshKey} />
          </div>
        </div>
      </main>
    </div>
  )
}
