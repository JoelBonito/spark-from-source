-- FASE 1: Atualização do Schema do Banco de Dados

-- 1.1 Adicionar colunas às tabelas existentes

-- Tabela simulations: adicionar treatment_type
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS treatment_type TEXT DEFAULT 'facetas' 
CHECK (treatment_type IN ('clareamento', 'facetas'));

CREATE INDEX IF NOT EXISTS idx_simulations_treatment_type ON simulations(treatment_type);
CREATE INDEX IF NOT EXISTS idx_simulations_user_treatment ON simulations(user_id, treatment_type);

-- Tabela budgets: adicionar índice (budget_type já existe)
CREATE INDEX IF NOT EXISTS idx_budgets_budget_type ON budgets(budget_type);

-- Tabela leads: adicionar treatment_type
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS treatment_type TEXT DEFAULT 'facetas' 
CHECK (treatment_type IN ('clareamento', 'facetas'));

CREATE INDEX IF NOT EXISTS idx_leads_treatment_type ON leads(treatment_type);

-- Tabela user_configs: adicionar whitening_simulator_enabled
ALTER TABLE user_configs 
ADD COLUMN IF NOT EXISTS whitening_simulator_enabled BOOLEAN DEFAULT false;

-- 1.2 Criar nova tabela services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Facetas dentárias', 'Clareamento', 'Consulta', 'Gengivoplastia', 'Opcional')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  required BOOLEAN NOT NULL DEFAULT false,
  base BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- RLS Policies para services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own services" ON services;
CREATE POLICY "Users view own services" ON services
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own services" ON services;
CREATE POLICY "Users create own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own services" ON services;
CREATE POLICY "Users update own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own services" ON services;
CREATE POLICY "Users delete own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 1.3 Migrar serviços de user_configs para nova tabela services
INSERT INTO services (user_id, name, description, category, price, active, required, base)
SELECT 
  user_id,
  sp->>'name' as name,
  COALESCE(sp->>'description', '') as description,
  COALESCE(sp->>'category', 'Opcional') as category,
  CAST(COALESCE(sp->>'price', '0') AS NUMERIC) as price,
  COALESCE(CAST(sp->>'active' AS BOOLEAN), true) as active,
  COALESCE(CAST(sp->>'required' AS BOOLEAN), false) as required,
  COALESCE(CAST(sp->>'base' AS BOOLEAN), false) as base
FROM user_configs, jsonb_array_elements(service_prices) as sp
WHERE jsonb_typeof(service_prices) = 'array'
ON CONFLICT DO NOTHING;