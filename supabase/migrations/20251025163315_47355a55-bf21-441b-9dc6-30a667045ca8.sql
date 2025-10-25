-- Adicionar campo archived na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Atualizar stages para os novos nomes
UPDATE leads SET stage = 'simulacao' WHERE stage = 'novo_lead';
UPDATE leads SET stage = 'consulta_tecnica' WHERE stage = 'qualificacao';
UPDATE leads SET stage = 'fechamento' WHERE stage = 'conversao';
UPDATE leads SET stage = 'acompanhamento' WHERE stage = 'fidelizacao';

-- Criar função para criar/atualizar lead quando simulação e report são criados
CREATE OR REPLACE FUNCTION create_or_update_lead_from_report()
RETURNS TRIGGER AS $$
DECLARE
  existing_lead_id UUID;
  patient_data RECORD;
  total_simulations_value NUMERIC;
BEGIN
  -- Buscar dados do paciente
  SELECT p.id, p.name, p.phone 
  INTO patient_data
  FROM patients p
  JOIN simulations s ON s.patient_id = p.id
  WHERE s.id = NEW.simulation_id;

  IF patient_data.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular valor total das simulações deste paciente e tipo de tratamento
  SELECT COALESCE(SUM(final_price), 0)
  INTO total_simulations_value
  FROM simulations
  WHERE patient_id = patient_data.id
    AND treatment_type = NEW.treatment_type
    AND user_id = NEW.user_id
    AND status = 'completed';

  -- Verificar se já existe lead para este paciente + tipo de tratamento
  SELECT id INTO existing_lead_id
  FROM leads
  WHERE patient_id = patient_data.id
    AND treatment_type = NEW.treatment_type
    AND user_id = NEW.user_id
  LIMIT 1;

  IF existing_lead_id IS NOT NULL THEN
    -- Atualizar lead existente
    UPDATE leads
    SET 
      opportunity_value = total_simulations_value,
      updated_at = now()
    WHERE id = existing_lead_id;
  ELSE
    -- Criar novo lead
    INSERT INTO leads (
      patient_id,
      name,
      phone,
      stage,
      opportunity_value,
      source,
      treatment_type,
      user_id,
      archived
    ) VALUES (
      patient_data.id,
      patient_data.name,
      patient_data.phone,
      'simulacao',
      total_simulations_value,
      'simulacao',
      NEW.treatment_type,
      NEW.user_id,
      FALSE
    );

    -- Criar atividade inicial
    INSERT INTO activities (
      lead_id,
      type,
      title,
      description,
      user_id,
      metadata
    )
    SELECT 
      l.id,
      'simulation',
      'Simulação realizada',
      CASE 
        WHEN NEW.treatment_type = 'clareamento' THEN 'Nova simulação de clareamento dental'
        ELSE 'Nova simulação de facetas dentárias'
      END,
      NEW.user_id,
      jsonb_build_object(
        'report_id', NEW.id,
        'treatment_type', NEW.treatment_type
      )
    FROM leads l
    WHERE l.patient_id = patient_data.id 
      AND l.treatment_type = NEW.treatment_type
      AND l.user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger na tabela reports
DROP TRIGGER IF EXISTS on_report_created ON reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION create_or_update_lead_from_report();