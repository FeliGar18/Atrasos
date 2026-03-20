"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface Student {
  id: number
  nombre: string
  apellido: string
  rut: string
  regimen: string
  curso?: string
}

// Form input component - defined outside to prevent re-creation on each render
function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface2 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>
  )
}

// Modal component - defined outside to prevent re-creation on each render
function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="animate-modal-in w-[90%] max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-lg font-bold text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  )
}

interface StudentManagerProps {
  onDataChanged: () => void
  refreshKey?: number
}

export function StudentManager({ onDataChanged, refreshKey }: StudentManagerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [processing, setProcessing] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    regimen: "E",
    curso: "",
  })

  // Load students
  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/students")
      if (res.ok) {
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Error al cargar alumnos")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load on mount only (not on refreshKey to avoid disrupting forms)
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Get unique courses
  const uniqueCursos = Array.from(
    new Set(students.map((s) => s.curso).filter(Boolean))
  ).sort() as string[]

  // Filter students
  const filtered = students.filter((s) => {
    if (filterCurso !== "all" && s.curso !== filterCurso) return false
    if (!searchText) return true
    const search = searchText.toLowerCase()
    const fullName = `${s.nombre} ${s.apellido}`.toLowerCase()
    return fullName.includes(search) || s.rut.includes(search)
  })

  // Open add modal
  const openAddModal = () => {
    setForm({ nombre: "", apellido: "", rut: "", regimen: "E", curso: "" })
    setShowAddModal(true)
  }

  // Open edit modal
  const openEditModal = (student: Student) => {
    setForm({
      nombre: student.nombre,
      apellido: student.apellido,
      rut: student.rut,
      regimen: student.regimen,
      curso: student.curso || "",
    })
    setEditingStudent(student)
  }

  // Handle add student
  const handleAddStudent = async () => {
    if (!form.nombre || !form.apellido || !form.rut) {
      toast.error("Nombre, apellido y RUT son requeridos")
      return
    }
    setProcessing(true)
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al agregar alumno")
        return
      }
      toast.success("Alumno agregado exitosamente")
      setShowAddModal(false)
      loadStudents()
      onDataChanged()
    } catch {
      toast.error("Error al agregar alumno")
    } finally {
      setProcessing(false)
    }
  }

  // Handle edit student
  const handleEditStudent = async () => {
    if (!editingStudent || !form.nombre || !form.apellido || !form.rut) {
      toast.error("Nombre, apellido y RUT son requeridos")
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al actualizar alumno")
        return
      }
      toast.success("Alumno actualizado exitosamente")
      setEditingStudent(null)
      loadStudents()
      onDataChanged()
    } catch {
      toast.error("Error al actualizar alumno")
    } finally {
      setProcessing(false)
    }
  }

  // Handle delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al eliminar alumno")
        return
      }
      toast.success(data.message)
      setDeletingStudent(null)
      loadStudents()
      onDataChanged()
    } catch {
      toast.error("Error al eliminar alumno")
    } finally {
      setProcessing(false)
    }
  }

  // Backup
  const handleBackup = async () => {
    try {
      const res = await fetch("/api/backup")
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const clDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date())
      a.download = `Backup_Completo_${clDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Backup descargado")
    } catch {
      toast.error("Error al generar backup")
    }
  }

  return (
    <>
      {/* Student Manager Card */}
      <div className="card-glow rounded-2xl border border-border bg-card p-6 transition-shadow">
        <div className="card-title-bar mb-4 flex items-center justify-between">
          <span className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Gestionar Alumnos
          </span>
          <button
            onClick={openAddModal}
            className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
          >
            + Agregar Alumno
          </button>
        </div>

        {/* Search and filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <select
            value={filterCurso}
            onChange={(e) => setFilterCurso(e.target.value)}
            className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="all">Todos los cursos</option>
            {uniqueCursos.map((curso) => (
              <option key={curso} value={curso}>
                {curso}
              </option>
            ))}
          </select>
        </div>

        {/* Student list */}
        <div className="max-h-[300px] overflow-y-auto rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {students.length === 0 ? "Sin alumnos en la base de datos" : "Sin resultados"}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Alumno
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Curso
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((student) => (
                  <tr key={student.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">
                        {student.nombre} {student.apellido}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{student.rut}</p>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {student.curso || "---"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(student)}
                          className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 50 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Mostrando 50 de {filtered.length} alumnos
          </p>
        )}

        {/* Backup button */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={handleBackup}
            className="w-full rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success transition-all hover:bg-success/20"
          >
            Descargar Backup Completo
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Agregar Alumno" onClose={() => setShowAddModal(false)}>
          <FormInput
            label="Nombre"
            value={form.nombre}
            onChange={(v) => setForm({ ...form, nombre: v })}
            placeholder="Ej: Juan Carlos"
            required
          />
          <FormInput
            label="Apellido"
            value={form.apellido}
            onChange={(v) => setForm({ ...form, apellido: v })}
            placeholder="Ej: Perez Soto"
            required
          />
          <FormInput
            label="RUT"
            value={form.rut}
            onChange={(v) => setForm({ ...form, rut: v })}
            placeholder="Ej: 12345678-9"
            required
          />
          <FormInput
            label="Curso"
            value={form.curso}
            onChange={(v) => setForm({ ...form, curso: v })}
            placeholder="Ej: 1ro Medio A"
          />
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Regimen
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={form.regimen === "E"}
                  onChange={() => setForm({ ...form, regimen: "E" })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Externo</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={form.regimen === "I"}
                  onChange={() => setForm({ ...form, regimen: "I" })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Interno</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-border bg-surface2 px-5 py-2.5 text-sm text-foreground hover:bg-surface2/80"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddStudent}
              disabled={processing}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {processing ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <Modal title="Editar Alumno" onClose={() => setEditingStudent(null)}>
          <FormInput
            label="Nombre"
            value={form.nombre}
            onChange={(v) => setForm({ ...form, nombre: v })}
            required
          />
          <FormInput
            label="Apellido"
            value={form.apellido}
            onChange={(v) => setForm({ ...form, apellido: v })}
            required
          />
          <FormInput
            label="RUT"
            value={form.rut}
            onChange={(v) => setForm({ ...form, rut: v })}
            required
          />
          <FormInput
            label="Curso"
            value={form.curso}
            onChange={(v) => setForm({ ...form, curso: v })}
          />
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Regimen
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={form.regimen === "E"}
                  onChange={() => setForm({ ...form, regimen: "E" })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Externo</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={form.regimen === "I"}
                  onChange={() => setForm({ ...form, regimen: "I" })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Interno</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setEditingStudent(null)}
              className="rounded-lg border border-border bg-surface2 px-5 py-2.5 text-sm text-foreground hover:bg-surface2/80"
            >
              Cancelar
            </button>
            <button
              onClick={handleEditStudent}
              disabled={processing}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {processing ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <Modal title="Eliminar Alumno" onClose={() => setDeletingStudent(null)}>
          <p className="mb-2 text-sm text-muted-foreground">
            Esta accion eliminara al alumno:
          </p>
          <p className="mb-4 text-lg font-semibold text-foreground">
            {deletingStudent.nombre} {deletingStudent.apellido}
          </p>
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Tambien se eliminaran todos sus registros de atrasos. Esta accion no se puede deshacer.
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setDeletingStudent(null)}
              className="rounded-lg border border-border bg-surface2 px-5 py-2.5 text-sm text-foreground hover:bg-surface2/80"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteStudent}
              disabled={processing}
              className="rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {processing ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
