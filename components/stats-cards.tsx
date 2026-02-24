"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, CalendarDays, GraduationCap, Users } from "lucide-react"

interface StatsCardsProps {
  today: number
  month: number
  semester: number
  totalStudents: number
}

export function StatsCards({
  today,
  month,
  semester,
  totalStudents,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Atrasos Hoy",
      value: today,
      icon: Clock,
      color: "bg-primary text-primary-foreground",
      iconColor: "text-primary-foreground/80",
    },
    {
      label: "Atrasos este Mes",
      value: month,
      icon: CalendarDays,
      color: "bg-accent text-accent-foreground",
      iconColor: "text-accent-foreground/80",
    },
    {
      label: "Atrasos Semestre",
      value: semester,
      icon: GraduationCap,
      color: "bg-warning text-warning-foreground",
      iconColor: "text-warning-foreground/80",
    },
    {
      label: "Alumnos Registrados",
      value: totalStudents,
      icon: Users,
      color: "bg-secondary text-secondary-foreground",
      iconColor: "text-secondary-foreground/80",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={`${stat.color} border-0 py-4`}>
          <CardContent className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/10 ${stat.iconColor}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold leading-none">{stat.value}</p>
              <p className="mt-1 text-xs font-medium opacity-80">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
