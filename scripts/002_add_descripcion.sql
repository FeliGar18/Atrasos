-- Add descripcion column to tardies table for justification notes
ALTER TABLE tardies ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
