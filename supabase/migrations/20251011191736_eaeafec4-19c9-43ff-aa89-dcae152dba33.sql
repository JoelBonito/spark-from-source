-- PATCH 2: Idempotência + Máquina de Estados
-- Adicionar colunas de controle à tabela simulations
ALTER TABLE simulations 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'analyzing', 'generating', 'completed', 'error')),
  ADD COLUMN IF NOT EXISTS run_id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulations_idempotency 
  ON simulations(user_id, idempotency_key) 
  WHERE status != 'error';

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status, created_at);

-- PATCH 4: Versionamento e Rastreabilidade
-- Adicionar colunas de versionamento à tabela reports
ALTER TABLE reports 
  ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT '2.0',
  ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT 'google/gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS prompt_sha256 TEXT;

-- Índice para buscar por versão
CREATE INDEX IF NOT EXISTS idx_reports_version ON reports(prompt_version, created_at);