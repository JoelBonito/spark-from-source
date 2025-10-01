-- Criar tabela budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identificação
  budget_number TEXT UNIQUE NOT NULL,
  
  -- Relacionamentos
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE SET NULL,
  
  -- Valores
  teeth_count INTEGER NOT NULL,
  price_per_tooth NUMERIC(10,2) DEFAULT 600.00,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  final_price NUMERIC(10,2) NOT NULL,
  
  -- Condições
  payment_conditions JSONB,
  valid_until DATE,
  
  -- Status
  status TEXT DEFAULT 'pending',
  -- pending, sent, viewed, accepted, rejected, expired
  
  -- Documentos
  pdf_url TEXT,
  
  -- Controle
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_patient ON public.budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_number ON public.budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON public.budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();