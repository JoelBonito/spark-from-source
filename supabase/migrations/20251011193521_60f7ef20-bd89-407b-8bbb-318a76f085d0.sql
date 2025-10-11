-- Adicionar status 'archived' ao tipo de status dos orçamentos
-- Não há constraint específica para o campo status na tabela budgets,
-- então apenas vamos garantir que o tipo text permite o novo valor

-- Comentário: O campo status já é do tipo text, então não há restrição.
-- Vamos apenas documentar que agora suportamos 'archived' como status válido.

COMMENT ON COLUMN budgets.status IS 'Status do orçamento: pending, sent, viewed, accepted, rejected, expired, archived';