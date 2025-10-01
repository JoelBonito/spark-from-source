import { useState, useEffect } from 'react';
import { getLeadById, getLeadActivities, updateLead, createActivity, Lead, Activity, UpdateLeadData, CreateActivityData } from '@/services/leadService';
import { getPatientSimulations } from '@/services/patientService';
import { toast } from 'sonner';

export function useLeadDetail(leadId: string | null) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeadData = async () => {
    if (!leadId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const leadData = await getLeadById(leadId);
      setLead(leadData);

      if (leadData) {
        const [activitiesData, simulationsData] = await Promise.all([
          getLeadActivities(leadId),
          leadData.patient_id ? getPatientSimulations(leadData.patient_id) : Promise.resolve([])
        ]);
        setActivities(activitiesData);
        setSimulations(simulationsData);
      }
    } catch (err) {
      console.error('Error loading lead details:', err);
      toast.error('Erro ao carregar detalhes do lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadData();
  }, [leadId]);

  const handleUpdateLead = async (data: UpdateLeadData) => {
    if (!leadId) return;

    try {
      await updateLead(leadId, data);
      await loadLeadData();
      toast.success('Lead atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating lead:', err);
      toast.error('Erro ao atualizar lead');
      throw err;
    }
  };

  const handleAddActivity = async (data: Omit<CreateActivityData, 'lead_id'>) => {
    if (!leadId) return;

    try {
      await createActivity({ ...data, lead_id: leadId });
      await loadLeadData();
      toast.success('Atividade adicionada!');
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Erro ao adicionar atividade');
      throw err;
    }
  };

  return {
    lead,
    activities,
    simulations,
    loading,
    updateLead: handleUpdateLead,
    addActivity: handleAddActivity,
    refresh: loadLeadData
  };
}
