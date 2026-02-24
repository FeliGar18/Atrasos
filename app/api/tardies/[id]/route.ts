import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "ID de atraso invalido" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("tardies")
    .delete()
    .eq("id", Number(id))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Atraso eliminado exitosamente" })
}
