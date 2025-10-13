import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export interface DashboardStats {
  totalPatients: number;
  simulationsMonth: number;
  totalBudgets: number;
  acceptedBudgets: number;
  conversionRate: number;
  potentialRevenue: number;
  confirmedRevenue: number;
  avgTicket: number;
  simulationsByDay: Array<{ date: string; count: number }>;
  funnelDistribution: {
    novo_lead: number;
    qualificacao: number;
    conversao: number;
    fidelizacao: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const last30Days = subDays(today, 30);

  // Total de pacientes
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Simulações este mês
  const { data: simulationsMonth } = await supabase
    .from('simulations')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString());

  // Orçamentos
  const { data: budgets } = await supabase
    .from('budgets')
    .select('final_price, status')
    .eq('user_id', user.id);

  const totalBudgets = budgets?.length || 0;
  const acceptedBudgets = budgets?.filter(b => b.status === 'accepted').length || 0;
  const conversionRate = totalBudgets > 0 ? (acceptedBudgets / totalBudgets) * 100 : 0;
  
  const potentialRevenue = budgets?.reduce((sum, b) => sum + Number(b.final_price || 0), 0) || 0;
  const confirmedRevenue = budgets
    ?.filter(b => b.status === 'accepted')
    .reduce((sum, b) => sum + Number(b.final_price || 0), 0) || 0;
  
  const avgTicket = totalBudgets > 0 ? potentialRevenue / totalBudgets : 0;

  // Simulações por dia (últimos 30 dias)
  const { data: dailySimulations } = await supabase
    .from('simulations')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', last30Days.toISOString())
    .order('created_at', { ascending: true });

  const simulationsByDay = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = dailySimulations?.filter(s => 
      format(new Date(s.created_at), 'yyyy-MM-dd') === dateStr
    ).length || 0;
    return { date: format(date, 'dd/MM'), count };
  });

  // Distribuição no funil (usando tabela leads)
  const { data: leads } = await supabase
    .from('leads')
    .select('stage')
    .eq('user_id', user.id);

  const funnelDistribution = {
    novo_lead: leads?.filter(l => l.stage === 'novo_lead').length || 0,
    qualificacao: leads?.filter(l => l.stage === 'qualificacao').length || 0,
    conversao: leads?.filter(l => l.stage === 'conversao').length || 0,
    fidelizacao: leads?.filter(l => l.stage === 'fidelizacao').length || 0
  };

  return {
    totalPatients: totalPatients || 0,
    simulationsMonth: simulationsMonth?.length || 0,
    totalBudgets,
    acceptedBudgets,
    conversionRate,
    potentialRevenue,
    confirmedRevenue,
    avgTicket,
    simulationsByDay,
    funnelDistribution
  };
}

export async function getExpiredBudgets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('budgets')
    .select('*, patient:patients(name)')
    .eq('user_id', user.id)
    .in('status', ['pending', 'sent', 'viewed'])
    .lte('valid_until', today);

  if (error) {
    console.error('❌ Erro ao buscar orçamentos expirados:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  return data || [];
}

export async function getStaleLeads() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('leads')
    .select('*, patient:patients(name)')
    .eq('user_id', user.id)
    .lt('updated_at', sevenDaysAgo.toISOString())
    .neq('stage', 'conversao')
    .neq('stage', 'fidelizacao');

  if (error) {
    console.error('❌ Erro ao buscar leads inativos:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  return data || [];
}
