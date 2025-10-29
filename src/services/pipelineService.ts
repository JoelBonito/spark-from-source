import { supabase } from '@/integrations/supabase/client';
import { Lead } from './leadService';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'simulacao',
    name: 'Simulação',
    color: 'gray',
    description: 'Simulação realizada, aguardando contato'
  },
  {
    id: 'consulta_tecnica',
    name: 'Consulta Técnica',
    color: 'blue',
    description: 'Agendamento de consulta técnica'
  },
  {
    id: 'fechamento',
    name: 'Fechamento',
    color: 'yellow',
    description: 'Negociação e fechamento do tratamento'
  },
  {
    id: 'acompanhamento',
    name: 'Acompanhamento',
    color: 'green',
    description: 'Tratamento em andamento ou concluído'
  }
];

export function getPipelineStages(): PipelineStage[] {
  return PIPELINE_STAGES;
}

export async function getLeadsGroupedByStage(showArchived: boolean = false): Promise<Record<string, Lead[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('user_id', user.id)
    .eq('archived', showArchived)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar leads agrupados:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  const grouped: Record<string, Lead[]> = {
    simulacao: [],
    consulta_tecnica: [],
    fechamento: [],
    acompanhamento: []
  };

  (data || []).forEach((lead: any) => {
    if (grouped[lead.stage]) {
      grouped[lead.stage].push(lead as Lead);
    }
  });

  return grouped;
}

export async function getPipelineMetrics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id);

  if (!leads || leads.length === 0) {
    return {
      totalLeads: 0,
      inNegotiation: 0,
      conversionRate: 0,
      potentialRevenue: 0
    };
  }

  const totalLeads = leads.length;
  const inNegotiation = leads.filter(l => 
    l.stage === 'consulta_tecnica' || l.stage === 'fechamento'
  ).length;

  const converted = leads.filter(l => 
    l.stage === 'fechamento' || l.stage === 'acompanhamento'
  ).length;
  const conversionRate = (converted / totalLeads) * 100;

  const potentialRevenue = leads
    .filter(l => l.stage !== 'acompanhamento')
    .reduce((sum, lead) => sum + (lead.opportunity_value || 0), 0);

  return {
    totalLeads,
    inNegotiation,
    conversionRate,
    potentialRevenue
  };
}
