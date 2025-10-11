import { useState, useEffect } from 'react';
import { getLeadsGroupedByStage } from '@/services/pipelineService';
import { updateLeadStage, Lead, ExtendedLead, deleteLead } from '@/services/leadService';
import { getPatientSimulations } from '@/services/patientService';
import { toast } from 'sonner';

export function useKanbanBoard() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, ExtendedLead[]>>({
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
      
      // Expandir leads com simulações
      const expandedData: Record<string, ExtendedLead[]> = {
        novo_lead: [],
        qualificacao: [],
        conversao: [],
        fidelizacao: []
      };

      for (const [stage, leads] of Object.entries(data)) {
        const expandedLeads: ExtendedLead[] = [];
        
        for (const lead of leads) {
          const simulations = lead.patient_id 
            ? await getPatientSimulations(lead.patient_id)
            : [];

          if (simulations.length === 0) {
            expandedLeads.push({ ...lead, simulationId: null });
          } else {
            simulations.forEach(sim => {
              expandedLeads.push({
                ...lead,
                id: `${lead.id}-sim-${sim.id}`,
                simulationId: sim.id,
                simulation: sim,
                opportunity_value: sim.final_price || lead.opportunity_value,
                treatment_type: (sim.treatment_type as 'facetas' | 'clareamento') || lead.treatment_type
              });
            });
          }
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
