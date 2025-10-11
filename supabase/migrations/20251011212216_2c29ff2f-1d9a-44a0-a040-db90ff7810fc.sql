-- FASE 1: Adicionar treatment_type em reports e atualizar trigger

-- 1. Adicionar coluna treatment_type à tabela reports
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS treatment_type text DEFAULT 'facetas'::text;

COMMENT ON COLUMN public.reports.treatment_type IS 'Tipo de tratamento: facetas ou clareamento';

-- 2. Atualizar trigger para propagar treatment_type corretamente
CREATE OR REPLACE FUNCTION public.create_lead_from_simulation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    INSERT INTO leads (
      patient_id, 
      name, 
      phone, 
      stage, 
      opportunity_value, 
      source, 
      treatment_type,
      user_id
    )
    SELECT 
      p.id,
      p.name,
      p.phone,
      'novo_lead',
      NEW.final_price,
      'simulacao',
      NEW.treatment_type,
      NEW.user_id
    FROM patients p
    WHERE p.id = NEW.patient_id
    AND NOT EXISTS (
      SELECT 1 FROM leads 
      WHERE patient_id = NEW.patient_id 
      AND user_id = NEW.user_id
    )
    ON CONFLICT DO NOTHING;
    
    -- Incluir treatment_type na metadata de activities
    INSERT INTO activities (lead_id, type, title, description, user_id, metadata)
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
        'simulation_id', NEW.id, 
        'value', NEW.final_price,
        'treatment_type', NEW.treatment_type
      )
    FROM leads l
    WHERE l.patient_id = NEW.patient_id AND l.user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;