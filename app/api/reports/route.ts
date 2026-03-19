import { createAdminClient } from "@/lib/supabase/admin"
import { getChileToday, getChileStartOfMonth, getChileSemesterStart } from "@/lib/chile-date"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  const today = getChileToday()
  const startOfMonth = getChileStartOfMonth()
  const semesterStart = getChileSemesterStart()

  // Get all tardies with student data for this semester
  const { data: tardies, error } = await supabase
    .from("tardies")
    .select("*, students(*)")
    .gte("fecha", semesterStart)
    .order("fecha", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 1. Ranking of students by tardy count
  const studentCounts: Record<number, {
    id: number
    nombre: string
    apellido: string
    rut: string
    regimen: string
    curso: string
    count: number
    lastTardy: string
  }> = {}

  for (const t of tardies || []) {
    const sid = t.student_id
    if (!studentCounts[sid]) {
      studentCounts[sid] = {
        id: t.students.id,
        nombre: t.students.nombre,
        apellido: t.students.apellido,
        rut: t.students.rut,
        regimen: t.students.regimen,
        curso: t.students.curso || "Sin curso",
        count: 0,
        lastTardy: t.fecha,
      }
    }
    studentCounts[sid].count++
    if (t.fecha > studentCounts[sid].lastTardy) {
      studentCounts[sid].lastTardy = t.fecha
    }
  }

  const ranking = Object.values(studentCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  // 2. Tardies by day of week
  const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
  const byDayOfWeek: Record<string, number> = {
    "Lunes": 0, "Martes": 0, "Miercoles": 0, "Jueves": 0, "Viernes": 0
  }
  
  for (const t of tardies || []) {
    const date = new Date(t.fecha + "T12:00:00")
    const dayName = dayNames[date.getDay()]
    if (byDayOfWeek[dayName] !== undefined) {
      byDayOfWeek[dayName]++
    }
  }

  const dayOfWeekData = Object.entries(byDayOfWeek).map(([day, count]) => ({
    day,
    atrasos: count
  }))

  // 3. Tardies by month (last 6 months)
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const byMonth: Record<string, number> = {}
  
  for (const t of tardies || []) {
    const [year, month] = t.fecha.split("-")
    const key = `${monthNames[parseInt(month) - 1]} ${year}`
    byMonth[key] = (byMonth[key] || 0) + 1
  }

  const monthlyData = Object.entries(byMonth).map(([month, count]) => ({
    month,
    atrasos: count
  }))

  // 4. Tardies by course
  const byCourse: Record<string, { total: number, internos: number, externos: number }> = {}
  
  for (const t of tardies || []) {
    const curso = t.students?.curso || "Sin curso"
    if (!byCourse[curso]) {
      byCourse[curso] = { total: 0, internos: 0, externos: 0 }
    }
    byCourse[curso].total++
    if (t.students?.regimen === "I") {
      byCourse[curso].internos++
    } else {
      byCourse[curso].externos++
    }
  }

  const courseData = Object.entries(byCourse)
    .map(([curso, data]) => ({
      curso,
      ...data
    }))
    .sort((a, b) => b.total - a.total)

  // 5. Daily trend (last 30 days)
  const dailyTrend: Record<string, number> = {}
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  for (const t of tardies || []) {
    const tDate = new Date(t.fecha + "T12:00:00")
    if (tDate >= thirtyDaysAgo) {
      dailyTrend[t.fecha] = (dailyTrend[t.fecha] || 0) + 1
    }
  }

  const trendData = Object.entries(dailyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, count]) => ({
      fecha: fecha.substring(5), // MM-DD format
      atrasos: count
    }))

  // Summary stats
  const todayCount = (tardies || []).filter(t => t.fecha === today).length
  const monthCount = (tardies || []).filter(t => t.fecha >= startOfMonth).length
  const semesterCount = tardies?.length || 0
  const alertCount = Object.values(studentCounts).filter(s => s.count >= 3).length

  return NextResponse.json({
    ranking,
    dayOfWeekData,
    monthlyData,
    courseData,
    trendData,
    summary: {
      today: todayCount,
      month: monthCount,
      semester: semesterCount,
      alertCount,
      totalStudentsWithTardies: Object.keys(studentCounts).length
    }
  })
}
