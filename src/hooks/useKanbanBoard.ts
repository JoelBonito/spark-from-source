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
            realId: baseLead.id, // Preservar UUID real do banco
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
      console.log('🔄 Movendo lead:', { leadId, newStage });

      // Buscar o lead no estado atual
      const stage = Object.keys(leadsByStage).find(s =>
        leadsByStage[s].some(l => l.id === leadId)
      );

      if (!stage) {
        throw new Error('Lead não encontrado no estado local');
      }

      const lead = leadsByStage[stage].find(l => l.id === leadId);
      if (!lead || !lead.patient_id) {
        throw new Error('Lead inválido ou sem patient_id');
      }

      console.log('📋 Lead encontrado:', {
        compositeId: lead.id,
        patient_id: lead.patient_id,
        treatment_type: lead.treatment_type,
        currentStage: stage
      });

      // Buscar todos os leads do banco
      const { getAllLeads } = await import('@/services/leadService');
      const allLeads = await getAllLeads();

      console.log(`🔍 Buscando lead real entre ${allLeads.length} leads...`);

      // Encontrar o lead real pelo patient_id e treatment_type e stage atual
      let realLead = allLeads.find(l =>
        l.patient_id === lead.patient_id &&
        l.treatment_type === lead.treatment_type &&
        l.stage === stage
      );

      // Fallback: buscar sem filtro de stage (caso o stage esteja desatualizado)
      if (!realLead) {
        console.warn('⚠️ Lead não encontrado com stage, buscando sem filtro...');
        realLead = allLeads.find(l =>
          l.patient_id === lead.patient_id &&
          l.treatment_type === lead.treatment_type
        );
      }

      if (!realLead) {
        console.error('❌ Lead não encontrado:', {
          patient_id: lead.patient_id,
          treatment_type: lead.treatment_type,
          currentStage: stage,
          availableLeads: allLeads.filter(l => l.patient_id === lead.patient_id)
        });
        throw new Error('Lead real não encontrado no banco de dados');
      }

      console.log('✅ Lead real encontrado:', {
        realId: realLead.id,
        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realLead.id)
      });

      // Validar UUID antes de atualizar
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realLead.id)) {
        throw new Error(`ID inválido: ${realLead.id} não é um UUID válido`);
      }

      await updateLeadStage(realLead.id, newStage);
      await loadLeads();
      toast.success('Lead movido com sucesso!');
    } catch (err) {
      console.error('❌ Error moving lead:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao mover lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      console.log('🗑️ Deletando lead:', { leadId });

      // Buscar o lead no estado atual
      const stage = Object.keys(leadsByStage).find(s =>
        leadsByStage[s].some(l => l.id === leadId)
      );

      if (!stage) {
        throw new Error('Lead não encontrado no estado local');
      }

      const lead = leadsByStage[stage].find(l => l.id === leadId);
      if (!lead || !lead.patient_id) {
        throw new Error('Lead inválido ou sem patient_id');
      }

      console.log('📋 Lead encontrado para deletar:', {
        compositeId: lead.id,
        patient_id: lead.patient_id,
        treatment_type: lead.treatment_type
      });

      // Buscar todos os leads do banco
      const { getAllLeads } = await import('@/services/leadService');
      const allLeads = await getAllLeads();

      console.log(`🔍 Buscando lead real entre ${allLeads.length} leads...`);

      // Encontrar o lead real pelo patient_id e treatment_type e stage atual
      let realLead = allLeads.find(l =>
        l.patient_id === lead.patient_id &&
        l.treatment_type === lead.treatment_type &&
        l.stage === stage
      );

      // Fallback: buscar sem filtro de stage
      if (!realLead) {
        console.warn('⚠️ Lead não encontrado com stage, buscando sem filtro...');
        realLead = allLeads.find(l =>
          l.patient_id === lead.patient_id &&
          l.treatment_type === lead.treatment_type
        );
      }

      if (!realLead) {
        console.error('❌ Lead não encontrado:', {
          patient_id: lead.patient_id,
          treatment_type: lead.treatment_type,
          currentStage: stage,
          availableLeads: allLeads.filter(l => l.patient_id === lead.patient_id)
        });
        throw new Error('Lead real não encontrado no banco de dados');
      }

      console.log('✅ Lead real encontrado:', {
        realId: realLead.id,
        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realLead.id)
      });

      // Validar UUID antes de deletar
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realLead.id)) {
        throw new Error(`ID inválido: ${realLead.id} não é um UUID válido`);
      }

      await deleteLead(realLead.id);
      await loadLeads();
      toast.success('Lead deletado com sucesso!');
    } catch (err) {
      console.error('❌ Error deleting lead:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar lead');
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
