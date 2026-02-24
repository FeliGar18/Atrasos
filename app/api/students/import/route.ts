import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "El archivo está vacío" },
        { status: 400 }
      )
    }

    // Map Excel columns (case-insensitive)
    const students = jsonData
      .map((row) => {
        const nombre =
          (row["Nombre"] as string) ||
          (row["nombre"] as string) ||
          (row["NOMBRE"] as string) ||
          ""
        const apellido =
          (row["Apellido"] as string) ||
          (row["apellido"] as string) ||
          (row["APELLIDO"] as string) ||
          ""
        let rut =
          (row["RUT"] as string) ||
          (row["rut"] as string) ||
          (row["Rut"] as string) ||
          ""
        const regimen =
          (row["Regimen"] as string) ||
          (row["regimen"] as string) ||
          (row["REGIMEN"] as string) ||
          (row["Régimen"] as string) ||
          (row["régimen"] as string) ||
          ""

        // Normalize RUT: convert to string first (Excel may send as number)
        rut = String(rut).trim()
        // If it contains a dash (e.g., "23308081-0"), split and take the body
        if (rut.includes("-")) {
          rut = rut.split("-")[0]
        }
        // Remove any remaining dots, dashes, spaces
        rut = rut.replace(/[.\-\s]/g, "")
        // If still has a verification digit appended (no dash format like "233080810")
        // Chilean RUT body is 7-8 digits; if 9+ chars and last is digit/k, strip it
        if (/^\d{8,9}[\dkK]?$/.test(rut) && rut.length > 8) {
          rut = rut.slice(0, -1)
        }

        return {
          nombre: String(nombre).trim(),
          apellido: String(apellido).trim(),
          rut: rut.trim(),
          regimen: String(regimen).trim().toUpperCase().charAt(0) === "I" ? "I" : "E",
        }
      })
      .filter((s) => s.nombre && s.apellido && s.rut)

    if (students.length === 0) {
      return NextResponse.json(
        {
          error:
            "No se encontraron datos válidos. Verifique que el archivo tenga columnas: Nombre, Apellido, RUT, Regimen",
        },
        { status: 400 }
      )
    }

    // Deduplicate by RUT - keep the last occurrence of each RUT
    const uniqueMap = new Map<string, (typeof students)[0]>()
    for (const student of students) {
      uniqueMap.set(student.rut, student)
    }
    const uniqueStudents = Array.from(uniqueMap.values())

    const supabase = createAdminClient()

    // Insert in batches of 100 to avoid payload limits
    const batchSize = 100
    let totalImported = 0

    for (let i = 0; i < uniqueStudents.length; i += batchSize) {
      const batch = uniqueStudents.slice(i, i + batchSize)
      const { error } = await supabase
        .from("students")
        .upsert(batch, { onConflict: "rut" })

      if (error) {
        return NextResponse.json(
          { error: `Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}` },
          { status: 500 }
        )
      }
      totalImported += batch.length
    }

    return NextResponse.json({
      message: `Se importaron ${totalImported} alumnos exitosamente`,
      count: totalImported,
    })
  } catch (err) {
    console.error("Import error:", err)
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    )
  }
}
