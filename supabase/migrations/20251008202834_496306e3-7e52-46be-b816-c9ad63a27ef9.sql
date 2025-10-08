-- Fase 5: Adicionar novos campos à tabela user_configs
ALTER TABLE user_configs 
  ADD COLUMN IF NOT EXISTS claude_api_key text,
  ADD COLUMN IF NOT EXISTS use_claude boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS crm_enabled boolean DEFAULT true;

-- Comentário sobre a coluna prompt_template
-- Mantemos prompt_template por compatibilidade com dados existentes
-- mas ele não será mais usado no ConfigForm