-- FASE 9: Remover coluna service_prices da tabela user_configs
-- O sistema agora usa a tabela 'services' para gerenciar serviços e preços

ALTER TABLE public.user_configs
DROP COLUMN IF EXISTS service_prices;