import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]
  const month = now.getMonth()
  const year = now.getFullYear()
  const semesterStart =
    month < 7
      ? new Date(year, 2, 1).toISOString().split("T")[0]
      : new Date(year, 7, 1).toISOString().split("T")[0]

  const [todayCount, monthCount, semesterCount, totalStudents, allTardies] =
    await Promise.all([
      supabase
        .from("tardies")
        .select("id", { count: "exact", head: true })
        .eq("fecha", today),
      supabase
        .from("tardies")
        .select("id", { count: "exact", head: true })
        .gte("fecha", startOfMonth),
      supabase
        .from("tardies")
        .select("id", { count: "exact", head: true })
        .gte("fecha", semesterStart),
      supabase
        .from("students")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("tardies")
        .select("student_id"),
    ])

  // Count students with 3+ tardies
  const studentCounts: Record<number, number> = {}
  if (allTardies.data) {
    allTardies.data.forEach((t: { student_id: number }) => {
      studentCounts[t.student_id] = (studentCounts[t.student_id] || 0) + 1
    })
  }
  const alertCount = Object.values(studentCounts).filter((c) => c >= 3).length

  return NextResponse.json({
    today: todayCount.count || 0,
    month: monthCount.count || 0,
    semester: semesterCount.count || 0,
    totalStudents: totalStudents.count || 0,
    alertCount,
  })
}
