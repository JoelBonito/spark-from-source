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

  try {
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
      // Se o erro for relacionado à coluna archived não existir, buscar sem o filtro
      if (error.message?.includes('archived') || error.code === '42703') {
        console.warn('Coluna archived não encontrada em leads, buscando todos os leads');
        const fallbackResult = await supabase
          .from('leads')
          .select(`
            *,
            patient:patients(name, phone, email)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fallbackResult.error) {
          console.error('❌ Erro ao buscar leads agrupados:', {
            code: fallbackResult.error.code,
            message: fallbackResult.error.message,
            details: fallbackResult.error.details,
            hint: fallbackResult.error.hint
          });
          throw fallbackResult.error;
        }

        const grouped: Record<string, Lead[]> = {
          simulacao: [],
          consulta_tecnica: [],
          fechamento: [],
          acompanhamento: []
        };

        (fallbackResult.data || []).forEach((lead: any) => {
          if (grouped[lead.stage]) {
            grouped[lead.stage].push(lead as Lead);
          }
        });

        return grouped;
      }

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
  } catch (error: any) {
    // Se houver erro relacionado à coluna archived, buscar sem o filtro
    if (error.message?.includes('archived') || error.code === '42703') {
      console.warn('Coluna archived não encontrada em leads, buscando todos os leads');
      const { data, error: fallbackError } = await supabase
        .from('leads')
        .select(`
          *,
          patient:patients(name, phone, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('❌ Erro ao buscar leads agrupados:', {
          code: fallbackError.code,
          message: fallbackError.message,
          details: fallbackError.details,
          hint: fallbackError.hint
        });
        throw fallbackError;
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
    throw error;
  }
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
