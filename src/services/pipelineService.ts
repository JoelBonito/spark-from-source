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
    id: 'novo_lead',
    name: 'Novo Lead',
    color: 'gray',
    description: 'Simulação realizada, aguardando contato'
  },
  {
    id: 'qualificacao',
    name: 'Qualificação',
    color: 'blue',
    description: 'Lead qualificado, agendamento em andamento'
  },
  {
    id: 'conversao',
    name: 'Conversão',
    color: 'yellow',
    description: 'Em negociação final'
  },
  {
    id: 'fidelizacao',
    name: 'Fidelização',
    color: 'green',
    description: 'Tratamento realizado, acompanhamento'
  }
];

export function getPipelineStages(): PipelineStage[] {
  return PIPELINE_STAGES;
}

export async function getLeadsGroupedByStage(): Promise<Record<string, Lead[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const grouped: Record<string, Lead[]> = {
    novo_lead: [],
    qualificacao: [],
    conversao: [],
    fidelizacao: []
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
    l.stage === 'qualificacao' || l.stage === 'conversao'
  ).length;

  const converted = leads.filter(l => 
    l.stage === 'conversao' || l.stage === 'fidelizacao'
  ).length;
  const conversionRate = (converted / totalLeads) * 100;

  const potentialRevenue = leads
    .filter(l => l.stage !== 'fidelizacao')
    .reduce((sum, lead) => sum + (lead.opportunity_value || 0), 0);

  return {
    totalLeads,
    inNegotiation,
    conversionRate,
    potentialRevenue
  };
}
