import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

function normalizeRut(raw: string): string {
  // Remove dots, dashes, spaces
  const cleaned = raw.replace(/[.\-\s]/g, "")
  // If it has a verification digit (last char is digit or k/K after dash or just appended)
  // RUT format: 12345678-9 or 123456789 or 12.345.678-9
  // We want just the numeric body without the verification digit
  // Chilean RUT body is 7-8 digits, verification digit is 1 char
  if (/^\d{7,8}[\dkK]$/.test(cleaned)) {
    return cleaned.slice(0, -1)
  }
  return cleaned
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rut = searchParams.get("rut")

  const supabase = createAdminClient()

  if (rut) {
    const normalizedRut = normalizeRut(rut)
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("rut", normalizedRut)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Alumno no encontrado" },
        { status: 404 }
      )
    }

    // Also fetch tardy count
    const today = new Date().toISOString().split("T")[0]
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split("T")[0]

    // Semester: Mar-Jul = sem1, Aug-Dec = sem2
    const month = new Date().getMonth() // 0-indexed
    const year = new Date().getFullYear()
    const semesterStart =
      month < 7
        ? new Date(year, 2, 1).toISOString().split("T")[0] // March 1
        : new Date(year, 7, 1).toISOString().split("T")[0] // August 1

    const [todayCount, monthCount, semesterCount, totalCount] =
      await Promise.all([
        supabase
          .from("tardies")
          .select("id", { count: "exact", head: true })
          .eq("student_id", data.id)
          .eq("fecha", today),
        supabase
          .from("tardies")
          .select("id", { count: "exact", head: true })
          .eq("student_id", data.id)
          .gte("fecha", startOfMonth),
        supabase
          .from("tardies")
          .select("id", { count: "exact", head: true })
          .eq("student_id", data.id)
          .gte("fecha", semesterStart),
        supabase
          .from("tardies")
          .select("id", { count: "exact", head: true })
          .eq("student_id", data.id),
      ])

    return NextResponse.json({
      ...data,
      tardies_today: todayCount.count || 0,
      tardies_month: monthCount.count || 0,
      tardies_semester: semesterCount.count || 0,
      tardies_total: totalCount.count || 0,
    })
  }

  // Return all students
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("apellido", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE() {
  const supabase = createAdminClient()

  // Delete all students (cascades to tardies)
  const { error } = await supabase.from("students").delete().neq("id", 0)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Base de datos limpiada exitosamente" })
}
