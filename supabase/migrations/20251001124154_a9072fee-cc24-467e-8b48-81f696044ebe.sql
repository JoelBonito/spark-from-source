-- Criar tabela patients
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Obrigatórios
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Opcionais
  email TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  
  -- Controle
  status TEXT DEFAULT 'active',
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_user ON public.patients(user_id);

-- Atualizar tabela simulations
ALTER TABLE public.simulations 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_simulations_patient ON public.simulations(patient_id);

-- RLS Policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();