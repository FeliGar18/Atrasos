import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "today"

  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  let dateFilter: string

  switch (period) {
    case "month": {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0]
      break
    }
    case "semester": {
      const month = now.getMonth()
      dateFilter =
        month < 7
          ? new Date(now.getFullYear(), 2, 1).toISOString().split("T")[0]
          : new Date(now.getFullYear(), 7, 1).toISOString().split("T")[0]
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
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json(
        { error: "student_id es requerido" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert new tardy with current date and time
    const { data, error } = await supabase
      .from("tardies")
      .insert({
        student_id,
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Santiago",
        }),
      })
      .select("*, students(*)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check total tardies for alert
    const { count } = await supabase
      .from("tardies")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student_id)

    return NextResponse.json({
      tardy: data,
      total_tardies: count || 0,
      alert: (count || 0) >= 3,
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
