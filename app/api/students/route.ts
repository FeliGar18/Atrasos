import { createAdminClient } from "@/lib/supabase/admin"
import { getChileToday, getChileStartOfMonth, getChileSemesterStart } from "@/lib/chile-date"
import { NextRequest, NextResponse } from "next/server"

function normalizeRut(raw: string): string {
  let rut = raw.trim()
  // If it contains a dash (e.g., "23308081-0"), take only the body before the dash
  if (rut.includes("-")) {
    rut = rut.split("-")[0]
  }
  // Remove dots, dashes, spaces
  rut = rut.replace(/[.\-\s]/g, "")
  // If the RUT was entered without dash but with verification digit appended (e.g., "233080810")
  // Chilean RUT body is 7-8 digits; if 9+ chars, strip the last char (verification digit)
  if (/^\d{9,}$/.test(rut)) {
    rut = rut.slice(0, -1)
  }
  return rut
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

    // Also fetch tardy count using Chile timezone
    const today = getChileToday()
    const startOfMonth = getChileStartOfMonth()
    const semesterStart = getChileSemesterStart()

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

// CREATE new student
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nombre, apellido, rut, regimen, curso } = body

  if (!nombre || !apellido || !rut) {
    return NextResponse.json(
      { error: "Nombre, apellido y RUT son requeridos" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Normalize RUT
  let normalizedRut = rut.trim()
  if (normalizedRut.includes("-")) {
    normalizedRut = normalizedRut.split("-")[0]
  }
  normalizedRut = normalizedRut.replace(/[.\-\s]/g, "")

  // Check if RUT already exists
  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("rut", normalizedRut)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un alumno con ese RUT" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rut: normalizedRut,
      regimen: regimen?.toUpperCase() === "I" ? "I" : "E",
      curso: curso?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Alumno agregado", student: data })
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
