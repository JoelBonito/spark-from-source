import { useState, useEffect } from 'react';
import { Lead, ExtendedLead } from '@/services/leadService';
import { getPatientSimulations } from '@/services/patientService';

export function useExpandedLeads(leads: Lead[]) {
  const [expandedLeads, setExpandedLeads] = useState<ExtendedLead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const expandLeadsWithSimulations = async () => {
      if (leads.length === 0) {
        setExpandedLeads([]);
        return;
      }

      setLoading(true);
      const expanded: ExtendedLead[] = [];
      
      try {
        for (const lead of leads) {
          // Buscar simulações do paciente
          const simulations = lead.patient_id 
            ? await getPatientSimulations(lead.patient_id)
            : [];

          if (simulations.length === 0) {
            // Lead sem simulação = 1 card
            expanded.push({ 
              ...lead, 
              simulationId: null 
            });
          } else {
            // Lead com simulações = N cards
            simulations.forEach((sim, index) => {
              expanded.push({
                ...lead,
                id: `${lead.id}-sim-${sim.id}`, // ID composto para drag-and-drop
                simulationId: sim.id,
                simulation: sim,
                opportunity_value: sim.final_price || lead.opportunity_value,
                treatment_type: (sim.treatment_type as 'facetas' | 'clareamento') || lead.treatment_type
              });
            });
          }
        }
        
        setExpandedLeads(expanded);
      } catch (error) {
        console.error('Error expanding leads:', error);
        // Em caso de erro, retornar leads originais sem expansão
        setExpandedLeads(leads.map(l => ({ ...l, simulationId: null })));
      } finally {
        setLoading(false);
      }
    };

    expandLeadsWithSimulations();
  }, [leads]);

  return { expandedLeads, loading };
}
