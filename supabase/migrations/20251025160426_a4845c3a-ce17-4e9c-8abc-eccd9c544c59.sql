-- Adicionar campo de categoria personalizável na tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS categoria TEXT;

COMMENT ON COLUMN public.services.categoria IS 'Categoria personalizável do serviço (ex: Estética, Preventivo, Restaurador, etc.)';

-- Criar tabela para sugestões de categorias (opcional, para autocomplete)
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own categories"
ON public.service_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON public.service_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.service_categories
FOR DELETE
USING (auth.uid() = user_id);

COMMENT ON TABLE public.service_categories IS 'Categorias personalizadas de serviços criadas pelos usuários';