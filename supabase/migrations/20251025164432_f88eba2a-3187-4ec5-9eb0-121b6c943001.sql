-- Add lead_id to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_budgets_lead_id ON budgets(lead_id);