-- Criar tabela leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados básicos
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Funil
  stage TEXT DEFAULT 'novo_lead',
  -- Etapas: novo_lead, qualificacao, conversao, fidelizacao
  
  -- Financeiro
  opportunity_value DECIMAL(10,2),
  
  -- Controle
  source TEXT DEFAULT 'simulacao',
  assigned_to UUID,
  tags TEXT[],
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  
  user_id UUID NOT NULL
);

-- Criar tabela activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  type TEXT NOT NULL,
  -- Tipos: note, call, email, whatsapp, stage_change, meeting, simulation
  title TEXT NOT NULL,
  description TEXT,
  
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_patient ON leads(patient_id);
CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at em leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar lead automaticamente ao fazer simulação
CREATE OR REPLACE FUNCTION create_lead_from_simulation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a simulação tem paciente e não existe lead
  IF NEW.patient_id IS NOT NULL THEN
    INSERT INTO leads (patient_id, name, phone, stage, opportunity_value, source, user_id)
    SELECT 
      p.id,
      p.name,
      p.phone,
      'novo_lead',
      NEW.final_price,
      'simulacao',
      NEW.user_id
    FROM patients p
    WHERE p.id = NEW.patient_id
    AND NOT EXISTS (
      SELECT 1 FROM leads WHERE patient_id = NEW.patient_id AND user_id = NEW.user_id
    )
    ON CONFLICT DO NOTHING;
    
    -- Criar activity de simulação
    INSERT INTO activities (lead_id, type, title, description, user_id, metadata)
    SELECT 
      l.id,
      'simulation',
      'Simulação realizada',
      'Nova simulação de facetas dentárias',
      NEW.user_id,
      jsonb_build_object('simulation_id', NEW.id, 'value', NEW.final_price)
    FROM leads l
    WHERE l.patient_id = NEW.patient_id AND l.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_lead_from_simulation
AFTER INSERT ON simulations
FOR EACH ROW
EXECUTE FUNCTION create_lead_from_simulation();