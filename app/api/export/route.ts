import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "today"

  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  let dateFilter: string
  let periodLabel: string

  switch (period) {
    case "month": {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0]
      periodLabel = `Mensual_${now.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`
      break
    }
    case "semester": {
      const month = now.getMonth()
      dateFilter =
        month < 7
          ? new Date(now.getFullYear(), 2, 1).toISOString().split("T")[0]
          : new Date(now.getFullYear(), 7, 1).toISOString().split("T")[0]
      periodLabel = `Semestral_${month < 7 ? "1er" : "2do"}_Semestre_${now.getFullYear()}`
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
