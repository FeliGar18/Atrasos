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

  const [todayCount, monthCount, semesterCount, totalStudents] =
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
    ])

  return NextResponse.json({
    today: todayCount.count || 0,
    month: monthCount.count || 0,
    semester: semesterCount.count || 0,
    totalStudents: totalStudents.count || 0,
  })
}
