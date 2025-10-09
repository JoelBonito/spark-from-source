-- FASE 6: Adicionar colunas para suportar orçamento manual

-- 6.1. Adicionar coluna items (JSONB) para armazenar itens customizados
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN budgets.items IS 'Array de itens do orçamento (para orçamentos manuais e automáticos)';

-- 6.2. Adicionar coluna budget_type para diferenciar automático vs manual
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS budget_type text DEFAULT 'automatic' CHECK (budget_type IN ('automatic', 'manual'));

COMMENT ON COLUMN budgets.budget_type IS 'Tipo do orçamento: automatic (via simulação) ou manual (criado pelo dentista)';

-- 6.3. Criar índice para melhorar performance de queries por tipo
CREATE INDEX IF NOT EXISTS idx_budgets_budget_type ON budgets(budget_type);

-- 6.4. Criar índice para melhorar performance de queries por user_id + budget_type
CREATE INDEX IF NOT EXISTS idx_budgets_user_type ON budgets(user_id, budget_type);