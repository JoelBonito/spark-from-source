-- Add CEP, City and State columns to user_configs
ALTER TABLE public.user_configs
ADD COLUMN IF NOT EXISTS clinic_zip_code TEXT,
ADD COLUMN IF NOT EXISTS clinic_city TEXT,
ADD COLUMN IF NOT EXISTS clinic_state TEXT;

COMMENT ON COLUMN public.user_configs.clinic_zip_code IS 'CEP da clínica';
COMMENT ON COLUMN public.user_configs.clinic_city IS 'Cidade da clínica';
COMMENT ON COLUMN public.user_configs.clinic_state IS 'Estado da clínica (sigla)';