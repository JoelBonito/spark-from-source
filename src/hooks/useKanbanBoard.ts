import { useState, useEffect } from 'react';
import { getLeadsGroupedByStage } from '@/services/pipelineService';
import { updateLeadStage, Lead, ExtendedLead, deleteLead } from '@/services/leadService';
import { getPatientSimulations } from '@/services/patientService';
import { toast } from 'sonner';

export function useKanbanBoard() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, ExtendedLead[]>>({
    simulacao: [],
    consulta_tecnica: [],
    fechamento: [],
    acompanhamento: []
  });
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeadsGroupedByStage();
      
      // Agrupamento por patient_id + treatment_type
      const expandedData: Record<string, ExtendedLead[]> = {
        simulacao: [],
        consulta_tecnica: [],
        fechamento: [],
        acompanhamento: []
      };

      for (const [stage, leads] of Object.entries(data)) {
        // Agrupar leads por patient_id + treatment_type
        const grouped = new Map<string, Lead[]>();
        
        for (const lead of leads) {
          const key = `${lead.patient_id}-${lead.treatment_type}`;
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(lead);
        }

        // Criar ExtendedLeads agrupados
        const expandedLeads: ExtendedLead[] = [];
        
        for (const [key, groupedLeads] of grouped.entries()) {
          // Usar o primeiro lead como base
          const baseLead = groupedLeads[0];
          
          // Buscar todas as simulações do tipo de tratamento
          const simulations = baseLead.patient_id 
            ? (await getPatientSimulations(baseLead.patient_id)).filter(
                sim => sim.treatment_type === baseLead.treatment_type
              )
            : [];

          // Calcular valor total das simulações
          const totalValue = simulations.reduce((sum, sim) => sum + (sim.final_price || 0), 0);

          expandedLeads.push({
            ...baseLead,
            id: key, // ID composto: patient_id-treatment_type
            simulationId: simulations.length > 0 ? simulations[0].id : null,
            simulation: simulations[0],
            opportunity_value: totalValue || baseLead.opportunity_value,
            simulationCount: simulations.length
          });
        }
        
        expandedData[stage as keyof typeof expandedData] = expandedLeads;
      }
      
      setLeadsByStage(expandedData);
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
      // Extrair o ID real do lead (pode ser composto)
      const realLeadId = leadId.includes('-sim-') 
        ? leadId.split('-sim-')[0] 
        : leadId;
      
      await updateLeadStage(realLeadId, newStage);
      await loadLeads();
      toast.success('Lead movido com sucesso!');
    } catch (err) {
      console.error('Error moving lead:', err);
      toast.error('Erro ao mover lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      // Extrair o ID real do lead
      const realLeadId = leadId.includes('-sim-') 
        ? leadId.split('-sim-')[0] 
        : leadId;
      
      await deleteLead(realLeadId);
      await loadLeads();
      toast.success('Lead deletado com sucesso!');
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Erro ao deletar lead');
    }
  };

  return {
    leadsByStage,
    loading,
    refresh: loadLeads,
    moveLeadToStage,
    deleteLead: handleDeleteLead
  };
}
