import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id?: string;
  name: string;
  phone: string;
  email?: string;
  stage: string;
  opportunity_value?: number;
  source: string;
  assigned_to?: string;
  tags?: string[];
  notes?: string;
  next_action?: string;
  next_action_date?: string;
  user_id: string;
  patient?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface Activity {
  id: string;
  created_at: string;
  type: string;
  title: string;
  description?: string;
  lead_id: string;
  user_id: string;
  metadata?: any;
}

export interface CreateLeadData {
  patient_id?: string;
  name: string;
  phone: string;
  email?: string;
  stage?: string;
  opportunity_value?: number;
  source?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateLeadData {
  name?: string;
  phone?: string;
  email?: string;
  stage?: string;
  opportunity_value?: number;
  tags?: string[];
  notes?: string;
  next_action?: string;
  next_action_date?: string;
}

export interface CreateActivityData {
  lead_id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: any;
}

export async function getAllLeads(): Promise<Lead[]> {
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
  return data || [];
}

export async function getLeadsByStage(stage: string): Promise<Lead[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('user_id', user.id)
    .eq('stage', stage)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createLead(leadData: CreateLeadData): Promise<Lead> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        ...leadData,
        user_id: user.id
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLead(id: string, leadData: UpdateLeadData): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeadStage(id: string, newStage: string): Promise<Lead> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Atualizar o stage
  const { data: lead, error } = await supabase
    .from('leads')
    .update({ stage: newStage })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Criar activity automática
  const stageNames: Record<string, string> = {
    novo_lead: 'Novo Lead',
    qualificacao: 'Qualificação',
    conversao: 'Conversão',
    fidelizacao: 'Fidelização'
  };

  await createActivity({
    lead_id: id,
    type: 'stage_change',
    title: `Lead movido para ${stageNames[newStage] || newStage}`,
    description: `O lead foi movido para a etapa de ${stageNames[newStage] || newStage}`,
    metadata: { previous_stage: lead.stage, new_stage: newStage }
  });

  return lead;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getLeadActivities(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createActivity(activityData: CreateActivityData): Promise<Activity> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activities')
    .insert([
      {
        ...activityData,
        user_id: user.id
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLeadStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id);

  if (!leads) {
    return {
      total: 0,
      byStage: {
        novo_lead: 0,
        qualificacao: 0,
        conversao: 0,
        fidelizacao: 0
      },
      conversionRate: 0,
      potentialRevenue: 0
    };
  }

  const total = leads.length;
  const byStage = {
    novo_lead: leads.filter(l => l.stage === 'novo_lead').length,
    qualificacao: leads.filter(l => l.stage === 'qualificacao').length,
    conversao: leads.filter(l => l.stage === 'conversao').length,
    fidelizacao: leads.filter(l => l.stage === 'fidelizacao').length
  };

  const converted = byStage.conversao + byStage.fidelizacao;
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;

  const potentialRevenue = leads.reduce((sum, lead) => {
    return sum + (lead.opportunity_value || 0);
  }, 0);

  return {
    total,
    byStage,
    conversionRate,
    potentialRevenue
  };
}

export async function searchLeads(query: string): Promise<Lead[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      patient:patients(name, phone, email)
    `)
    .eq('user_id', user.id)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
