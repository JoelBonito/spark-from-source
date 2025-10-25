-- Adicionar campos de dados do usuário
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_phone TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Adicionar campos de dados da clínica
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS clinic_name TEXT,
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_phone TEXT,
ADD COLUMN IF NOT EXISTS clinic_email TEXT;

-- Adicionar flag para facetas dentárias (ativo por padrão)
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS facets_simulator_enabled BOOLEAN DEFAULT TRUE;

-- Atualizar registros existentes para ter os módulos ativos por padrão
UPDATE public.user_configs 
SET facets_simulator_enabled = TRUE 
WHERE facets_simulator_enabled IS NULL;

UPDATE public.user_configs 
SET crm_enabled = TRUE 
WHERE crm_enabled IS NULL;

UPDATE public.user_configs 
SET whitening_simulator_enabled = TRUE 
WHERE whitening_simulator_enabled IS NULL;