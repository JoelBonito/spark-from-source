-- Criar tabela de simulações
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT,
  processed_image_url TEXT,
  teeth_count INTEGER DEFAULT 4,
  teeth_analyzed JSONB DEFAULT '["11", "21", "12", "22"]'::jsonb,
  price_per_tooth DECIMAL(10,2) DEFAULT 600.00,
  total_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  budget_data JSONB,
  budget_pdf_url TEXT,
  patient_name TEXT,
  patient_phone TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own simulations"
ON public.simulations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations"
ON public.simulations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations"
ON public.simulations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
ON public.simulations FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_simulations_updated_at
BEFORE UPDATE ON public.simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para PDFs de orçamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('budgets', 'budgets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket
CREATE POLICY "Users can view their own budget PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'budgets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own budget PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'budgets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own budget PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'budgets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own budget PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'budgets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);