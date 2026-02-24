import { createAdminClient } from "@/lib/supabase/admin"
import { getChileToday, getChileStartOfMonth, getChileSemesterStart, getChileMonth, getChileYear } from "@/lib/chile-date"
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "today"

  const supabase = createAdminClient()
  const today = getChileToday()
  const chileMonth = getChileMonth()
  const chileYear = getChileYear()

  let dateFilter: string
  let periodLabel: string

  switch (period) {
    case "month": {
      dateFilter = getChileStartOfMonth()
      const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
      periodLabel = `Mensual_${monthNames[chileMonth - 1]}_${chileYear}`
      break
    }
    case "semester": {
      dateFilter = getChileSemesterStart()
      const sem = chileMonth >= 3 && chileMonth <= 7 ? "1er" : "2do"
      periodLabel = `Semestral_${sem}_Semestre_${chileYear}`
      break
    }
    case "complete": {
      dateFilter = "2000-01-01"
      periodLabel = `Completo_${today}`
      break
    }
    default:
      dateFilter = today
      periodLabel = `Diario_${today}`
  }

  const query = supabase
    .from("tardies")
    .select("*, students(*)")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })

  if (period === "today") {
    query.eq("fecha", dateFilter)
  } else {
    query.gte("fecha", dateFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format data for Excel
  const excelData = (data || []).map((tardy) => ({
    Nombre: tardy.students?.nombre || "",
    Apellido: tardy.students?.apellido || "",
    RUT: tardy.students?.rut || "",
    Regimen: tardy.students?.regimen === "I" ? "Interno" : "Externo",
    Fecha: tardy.fecha,
    Hora: tardy.hora,
    Descripcion: tardy.descripcion || "",
  }))

  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Atrasos")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Reporte_Atrasos_${periodLabel}.xlsx"`,
    },
  })
}
