-- FASE 2: Adicionar status padrão e constraint no banco de dados

-- 1. Atualizar budgets existentes sem status ou com status inválido para 'pending'
UPDATE budgets 
SET status = 'pending' 
WHERE status IS NULL 
   OR status NOT IN ('pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'archived');

-- 2. Adicionar constraint NOT NULL com valor padrão
ALTER TABLE budgets 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN status SET NOT NULL;

-- 3. Adicionar check constraint para validar apenas status permitidos
ALTER TABLE budgets
ADD CONSTRAINT valid_budget_status 
CHECK (status IN ('pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'archived'));