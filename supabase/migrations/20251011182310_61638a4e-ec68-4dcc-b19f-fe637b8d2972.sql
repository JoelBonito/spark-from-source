-- Add treatment_type column to budgets table
ALTER TABLE public.budgets
ADD COLUMN treatment_type text NOT NULL DEFAULT 'facetas';

-- Add check constraint for valid treatment types
ALTER TABLE public.budgets
ADD CONSTRAINT budgets_treatment_type_check 
CHECK (treatment_type IN ('facetas', 'clareamento'));