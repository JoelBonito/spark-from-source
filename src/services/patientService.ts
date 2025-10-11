import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  status: string;
  user_id: string;
  simulations_count?: number;
}

export interface CreatePatientData {
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
}

export interface UpdatePatientData {
  name?: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  status?: string;
}

export interface PatientWithRelations extends Patient {
  latest_simulation?: {
    id: string;
    original_image_url: string | null;
    processed_image_url: string | null;
    technical_notes: string | null;
    treatment_type: string;
    created_at: string;
  } | null;
  latest_budget?: {
    id: string;
    budget_number: string;
    final_price: number;
    status: string;
    created_at: string;
  } | null;
}

export async function getAllPatients(): Promise<Patient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations:simulations(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(patient => ({
    ...patient,
    simulations_count: patient.simulations?.[0]?.count || 0
  }));
}

export async function getPatientsWithRelations(): Promise<PatientWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations_count:simulations(count),
      latest_simulation:simulations(
        id,
        original_image_url,
        processed_image_url,
        technical_notes,
        treatment_type,
        created_at
      ),
      latest_budget:budgets(
        id,
        budget_number,
        final_price,
        status,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('created_at', { foreignTable: 'latest_simulation', ascending: false })
    .order('created_at', { foreignTable: 'latest_budget', ascending: false })
    .limit(1, { foreignTable: 'latest_simulation' })
    .limit(1, { foreignTable: 'latest_budget' });

  if (error) throw error;

  return (data || []).map(patient => ({
    ...patient,
    simulations_count: patient.simulations_count?.[0]?.count || 0,
    latest_simulation: Array.isArray(patient.latest_simulation) && patient.latest_simulation.length > 0 
      ? patient.latest_simulation[0] 
      : null,
    latest_budget: Array.isArray(patient.latest_budget) && patient.latest_budget.length > 0 
      ? patient.latest_budget[0] 
      : null
  }));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations:simulations(count)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    simulations_count: data.simulations?.[0]?.count || 0
  };
}

export async function createPatient(patientData: CreatePatientData): Promise<Patient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .insert([
      {
        ...patientData,
        user_id: user.id
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePatient(id: string, patientData: UpdatePatientData): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations:simulations(count)
    `)
    .eq('user_id', user.id)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(patient => ({
    ...patient,
    simulations_count: patient.simulations?.[0]?.count || 0
  }));
}

export async function getPatientSimulations(patientId: string) {
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPatientStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Total de pacientes
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Pacientes com simulações
  const { data: patientsWithSimulations } = await supabase
    .from('patients')
    .select('id, simulations:simulations(id)')
    .eq('user_id', user.id);

  const withSimulationsCount = patientsWithSimulations?.filter(
    p => p.simulations && p.simulations.length > 0
  ).length || 0;

  // Pacientes novos este mês
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const { count: newThisMonth } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', firstDayOfMonth.toISOString());

  return {
    total: totalPatients || 0,
    withSimulations: withSimulationsCount,
    newThisMonth: newThisMonth || 0
  };
}
