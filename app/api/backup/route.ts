import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  const supabase = createAdminClient()

  // Fetch all students
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .order("apellido", { ascending: true })

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 })
  }

  // Fetch all tardies with student info
  const { data: tardies, error: tardiesError } = await supabase
    .from("tardies")
    .select("*, students(*)")
    .order("fecha", { ascending: false })

  if (tardiesError) {
    return NextResponse.json({ error: tardiesError.message }, { status: 500 })
  }

  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Students
  const studentsData = (students || []).map((s) => ({
    ID: s.id,
    Nombre: s.nombre,
    Apellido: s.apellido,
    RUT: s.rut,
    Curso: s.curso || "",
    Regimen: s.regimen === "I" ? "Interno" : "Externo",
  }))
  const studentsSheet = XLSX.utils.json_to_sheet(studentsData)
  studentsSheet["!cols"] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Alumnos")

  // Sheet 2: Tardies
  const tardiesData = (tardies || []).map((t) => ({
    ID: t.id,
    Alumno: `${t.students?.nombre || ""} ${t.students?.apellido || ""}`,
    RUT: t.students?.rut || "",
    Curso: t.students?.curso || "",
    Regimen: t.students?.regimen === "I" ? "Interno" : "Externo",
    Fecha: t.fecha,
    Hora: t.hora,
    Descripcion: t.descripcion || "",
  }))
  const tardiesSheet = XLSX.utils.json_to_sheet(tardiesData)
  tardiesSheet["!cols"] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(workbook, tardiesSheet, "Atrasos")

  // Sheet 3: Summary by student
  const summaryMap = new Map<number, { nombre: string; apellido: string; rut: string; curso: string; regimen: string; count: number }>()
  for (const t of tardies || []) {
    if (!t.students) continue
    const sid = t.student_id
    if (!summaryMap.has(sid)) {
      summaryMap.set(sid, {
        nombre: t.students.nombre,
        apellido: t.students.apellido,
        rut: t.students.rut,
        curso: t.students.curso || "",
        regimen: t.students.regimen,
        count: 0,
      })
    }
    summaryMap.get(sid)!.count++
  }
  const summaryData = Array.from(summaryMap.values())
    .sort((a, b) => b.count - a.count)
    .map((s) => ({
      Alumno: `${s.nombre} ${s.apellido}`,
      RUT: s.rut,
      Curso: s.curso,
      Regimen: s.regimen === "I" ? "Interno" : "Externo",
      "Total Atrasos": s.count,
    }))
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet["!cols"] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ]
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  // Get Chile date for filename
  const clDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date())

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Backup_Completo_${clDate}.xlsx"`,
    },
  })
}
