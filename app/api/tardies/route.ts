import { createAdminClient } from "@/lib/supabase/admin"
import { getChileToday, getChileStartOfMonth, getChileSemesterStart, getChileTime } from "@/lib/chile-date"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "today"

  const supabase = createAdminClient()
  const today = getChileToday()

  let dateFilter: string

  switch (period) {
    case "month": {
      dateFilter = getChileStartOfMonth()
      break
    }
    case "semester": {
      dateFilter = getChileSemesterStart()
      break
    }
    default:
      dateFilter = today
  }

  const query = supabase
    .from("tardies")
    .select("*, students(*)")
    .order("created_at", { ascending: false })

  if (period === "today") {
    query.eq("fecha", dateFilter)
  } else {
    query.gte("fecha", dateFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, descripcion } = body

    if (!student_id) {
      return NextResponse.json(
        { error: "student_id es requerido" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert new tardy with current Chile date and time
    const insertData: { student_id: number; fecha: string; hora: string; descripcion?: string } = {
      student_id,
      fecha: getChileToday(),
      hora: getChileTime(),
    }

    if (descripcion && descripcion.trim()) {
      insertData.descripcion = descripcion.trim()
    }

    const { data, error } = await supabase
      .from("tardies")
      .insert(insertData)
      .select("*, students(*)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check total tardies for alert - triggers every 3 (3, 6, 9, 12...)
    const { count } = await supabase
      .from("tardies")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student_id)

    const totalTardies = count || 0
    const shouldAlert = totalTardies >= 3 && totalTardies % 3 === 0

    return NextResponse.json({
      tardy: data,
      total_tardies: totalTardies,
      alert: shouldAlert,
    })
  } catch {
    return NextResponse.json(
      { error: "Error al registrar atraso" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const supabase = createAdminClient()

  const { error } = await supabase.from("tardies").delete().neq("id", 0)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Atrasos limpiados exitosamente" })
}
