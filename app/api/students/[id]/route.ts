import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", parseInt(id))
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
  }

  return NextResponse.json(data)
}

// UPDATE student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { data, error } = await supabase
    .from("students")
    .update({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rut: normalizedRut,
      regimen: regimen?.toUpperCase() === "I" ? "I" : "E",
      curso: curso?.trim() || null,
    })
    .eq("id", parseInt(id))
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Alumno actualizado", student: data })
}

// DELETE single student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  // First check if student exists
  const { data: student } = await supabase
    .from("students")
    .select("nombre, apellido")
    .eq("id", parseInt(id))
    .single()

  if (!student) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
  }

  // Delete the student (tardies will cascade)
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", parseInt(id))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: `Alumno ${student.nombre} ${student.apellido} eliminado`,
  })
}
