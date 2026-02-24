-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  regimen TEXT NOT NULL CHECK (regimen IN ('I', 'E')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tardies (atrasos) table
CREATE TABLE IF NOT EXISTS tardies (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on rut for fast lookups
CREATE INDEX IF NOT EXISTS idx_students_rut ON students(rut);

-- Create index on student_id and fecha for reporting
CREATE INDEX IF NOT EXISTS idx_tardies_student_fecha ON tardies(student_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tardies_fecha ON tardies(fecha);

-- Disable RLS (this is an internal school tool, not multi-tenant)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE tardies DISABLE ROW LEVEL SECURITY;
