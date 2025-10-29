-- Add archived column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_archived ON patients(archived);