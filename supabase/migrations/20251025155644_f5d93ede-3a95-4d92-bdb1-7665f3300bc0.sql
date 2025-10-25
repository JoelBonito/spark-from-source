-- Adicionar campo clinic_logo_url na tabela user_configs
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS clinic_logo_url TEXT;

COMMENT ON COLUMN public.user_configs.clinic_logo_url IS 'URL da logomarca da clínica armazenada no Supabase Storage';

-- Criar bucket para logos de clínicas se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket clinic-logos
CREATE POLICY "Users can upload their clinic logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their clinic logo"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'clinic-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their clinic logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'clinic-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their clinic logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'clinic-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);