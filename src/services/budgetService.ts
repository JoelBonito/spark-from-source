import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';
import { generateBudgetNumber, generateManualBudgetPDF } from './pdfService';

export interface Budget {
  id: string;
  created_at: string;
  updated_at: string;
  budget_number: string;
  patient_id: string | null;
  simulation_id: string | null;
  teeth_count: number;
  price_per_tooth: number;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  final_price: number;
  payment_conditions: any;
  valid_until: string | null;
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  pdf_url: string | null;
  user_id: string;
  budget_type?: 'automatic' | 'manual';
  treatment_type: 'facetas' | 'clareamento';
  items?: any[];
  patient?: {
    name: string;
    phone: string;
  };
  simulation?: any;
}

export interface CreateBudgetData {
  budget_number: string;
  patient_id?: string;
  simulation_id?: string;
  teeth_count: number;
  price_per_tooth?: number;
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_price: number;
  payment_conditions?: any;
  valid_until?: Date;
  pdf_url?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  budget_type?: 'automatic' | 'manual';
  items?: any[];
}

export interface BudgetFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export async function getAllBudgets(filters?: BudgetFilters): Promise<Budget[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('budgets')
    .select(`
      *,
      patient:patients(name, phone)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom.toISOString());
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo.toISOString());
  }

  if (filters?.search) {
    query = query.or(
      `budget_number.ilike.%${filters.search}%,patient.name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(budget => ({
    ...budget,
    patient: (budget.patient as any) || null,
    status: budget.status as Budget['status'],
    budget_type: (budget.budget_type as 'automatic' | 'manual') || 'automatic',
    treatment_type: (budget.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(budget.items) ? budget.items : (budget.items ? [budget.items] : [])
  }));
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      patient:patients(name, phone, email),
      simulation:simulations(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    patient: data.patient?.[0] || null,
    simulation: data.simulation?.[0] || null,
    status: data.status as Budget['status'],
    budget_type: (data.budget_type as 'automatic' | 'manual') || 'automatic',
    treatment_type: (data.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : [])
  };
}

export async function createBudget(budgetData: CreateBudgetData): Promise<Budget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        ...budgetData,
        user_id: user.id,
        valid_until: budgetData.valid_until 
          ? budgetData.valid_until.toISOString().split('T')[0]
          : addDays(new Date(), 30).toISOString().split('T')[0],
        status: budgetData.status || 'pending'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    status: data.status as Budget['status'],
    budget_type: (data.budget_type as 'automatic' | 'manual') || 'automatic',
    treatment_type: (data.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : [])
  };
}

export async function updateBudgetStatus(
  id: string, 
  status: Budget['status']
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    status: data.status as Budget['status'],
    budget_type: (data.budget_type as 'automatic' | 'manual') || 'automatic',
    treatment_type: (data.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : [])
  };
}

export async function searchBudgets(query: string): Promise<Budget[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      patient:patients(name, phone)
    `)
    .eq('user_id', user.id)
    .or(`budget_number.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(budget => ({
    ...budget,
    patient: budget.patient?.[0] || null,
    status: budget.status as Budget['status'],
    budget_type: (budget.budget_type as 'automatic' | 'manual') || 'automatic',
    treatment_type: (budget.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(budget.items) ? budget.items : (budget.items ? [budget.items] : [])
  }));
}

export async function getBudgetStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('status')
    .eq('user_id', user.id);

  if (error) throw error;

  const total = budgets?.length || 0;
  const pending = budgets?.filter(b => 
    ['pending', 'sent', 'viewed'].includes(b.status)
  ).length || 0;
  const accepted = budgets?.filter(b => b.status === 'accepted').length || 0;
  const rejected = budgets?.filter(b => b.status === 'rejected').length || 0;
  const conversionRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0';

  return {
    total,
    pending,
    accepted,
    rejected,
    conversionRate: parseFloat(conversionRate)
  };
}

export async function markExpiredBudgets(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('budgets')
    .update({ status: 'expired' })
    .lt('valid_until', today)
    .in('status', ['pending', 'sent', 'viewed'])
    .select();

  if (error) throw error;
  return data?.length || 0;
}

// FASE 4: Criar orçamento manual
export async function createManualBudget(
  patientId: string,
  items: Array<{
    servico: string;
    quantidade: number;
    valor_unitario: number;
    observacoes?: string;
  }>,
  discount: number = 10
): Promise<Budget> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Buscar dados do paciente
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('name, phone')
    .eq('id', patientId)
    .single();

  if (patientError) throw patientError;
  if (!patient) throw new Error('Paciente não encontrado');

  // Calcular valores
  const itemsWithTotals = items.map(item => ({
    ...item,
    valor_total: item.quantidade * item.valor_unitario
  }));

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.valor_total, 0);
  const discountAmount = subtotal * (discount / 100);
  const finalPrice = subtotal - discountAmount;

  // Gerar número de orçamento
  const budgetNumber = generateBudgetNumber();

  // Gerar PDF
  const pdfUrl = await generateManualBudgetPDF({
    budgetNumber,
    patientName: patient.name,
    patientPhone: patient.phone,
    date: new Date(),
    items: itemsWithTotals,
    subtotal,
    desconto_percentual: discount,
    desconto_valor: discountAmount,
    total: finalPrice
  });

  // Salvar no banco de dados
  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        user_id: user.id,
        patient_id: patientId,
        budget_number: budgetNumber,
        budget_type: 'manual',
        items: itemsWithTotals,
        teeth_count: 0, // Não aplicável para orçamento manual
        price_per_tooth: 0,
        subtotal,
        discount_percentage: discount,
        discount_amount: discountAmount,
        final_price: finalPrice,
        pdf_url: pdfUrl,
        valid_until: addDays(new Date(), 30).toISOString().split('T')[0],
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    status: data.status as Budget['status'],
    budget_type: data.budget_type as 'automatic' | 'manual',
    treatment_type: (data.treatment_type as 'facetas' | 'clareamento') || 'facetas',
    items: Array.isArray(data.items) ? data.items : []
  };
}
