-- Adicionar campo observacoes
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Renomear coluna category para tipo_servico
ALTER TABLE public.services 
RENAME COLUMN category TO tipo_servico;

-- Atualizar valores existentes para novo formato
UPDATE public.services 
SET tipo_servico = CASE 
  WHEN required = true THEN 'Serviço obrigatório'
  ELSE 'Serviço opcional'
END;

-- Alterar tipo da coluna para TEXT
ALTER TABLE public.services 
ALTER COLUMN tipo_servico TYPE TEXT;

-- Adicionar constraint para validar valores
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_tipo_servico_check;

ALTER TABLE public.services 
ADD CONSTRAINT services_tipo_servico_check 
CHECK (tipo_servico IN ('Serviço obrigatório', 'Serviço opcional'));

-- Comentários explicativos
COMMENT ON COLUMN public.services.tipo_servico IS 'Tipo do serviço: Serviço obrigatório ou Serviço opcional';
COMMENT ON COLUMN public.services.observacoes IS 'Observações adicionais sobre o serviço';