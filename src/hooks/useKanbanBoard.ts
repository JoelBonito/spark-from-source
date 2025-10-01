import { useState, useEffect } from 'react';
import { getLeadsGroupedByStage } from '@/services/pipelineService';
import { updateLeadStage, Lead } from '@/services/leadService';
import { toast } from 'sonner';

export function useKanbanBoard() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({
    novo_lead: [],
    qualificacao: [],
    conversao: [],
    fidelizacao: []
  });
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeadsGroupedByStage();
      setLeadsByStage(data);
    } catch (err) {
      console.error('Error loading leads:', err);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const moveLeadToStage = async (leadId: string, newStage: string) => {
    try {
      await updateLeadStage(leadId, newStage);
      await loadLeads();
      toast.success('Lead movido com sucesso!');
    } catch (err) {
      console.error('Error moving lead:', err);
      toast.error('Erro ao mover lead');
    }
  };

  return {
    leadsByStage,
    loading,
    refresh: loadLeads,
    moveLeadToStage
  };
}
