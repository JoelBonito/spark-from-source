-- Criar tabela de relatórios técnicos
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  pdf_url TEXT,
  before_image TEXT,
  after_image TEXT
);

-- Adicionar coluna de imagens à tabela budgets existente
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS before_image TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS after_image TEXT;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- Criar tabela de leads do CRM
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  before_image TEXT,
  after_image TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'simulator'
);

-- Adicionar coluna de última simulação em patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_simulation_date TIMESTAMPTZ;

-- Adicionar coluna de status em simulations se não existir
ALTER TABLE public.simulations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Enable RLS para reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reports" 
ON public.reports FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable RLS para crm_leads
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own leads" 
ON public.crm_leads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own leads" 
ON public.crm_leads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own leads" 
ON public.crm_leads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own leads" 
ON public.crm_leads FOR DELETE 
USING (auth.uid() = user_id);