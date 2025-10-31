import { supabase } from '@/integrations/supabase/client';
import { notifyPatientCreated } from './notificationService';

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

export async function getPatientsWithRelations(showArchived: boolean = false): Promise<PatientWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('patients')
    .select(`
      *,
      simulations!simulations_patient_id_fkey (
        id,
        original_image_url,
        processed_image_url,
        technical_notes,
        treatment_type,
        created_at
      ),
      budgets (
        id,
        budget_number,
        final_price,
        status,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Tentar filtrar por archived, mas se falhar, continuar sem o filtro
  try {
    const { data, error } = await query.eq('archived', showArchived);

    if (error) {
      // Se o erro for relacionado à coluna archived não existir, buscar sem o filtro
      if (error.message?.includes('archived') || error.code === '42703') {
        console.warn('Coluna archived não encontrada, buscando todos os pacientes');
        const fallbackResult = await supabase
          .from('patients')
          .select(`
            *,
            simulations!simulations_patient_id_fkey (
              id,
              original_image_url,
              processed_image_url,
              technical_notes,
              treatment_type,
              created_at
            ),
            budgets (
              id,
              budget_number,
              final_price,
              status,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fallbackResult.error) throw fallbackResult.error;

        return (fallbackResult.data || []).map(patient => {
          const simulationsArray = patient.simulations || [];
          return {
            ...patient,
            simulations_count: simulationsArray.length,
            latest_simulation: simulationsArray.length > 0 ? simulationsArray[0] : null,
            latest_budget: patient.budgets && patient.budgets.length > 0 ? patient.budgets[0] : null
          };
        });
      }
      throw error;
    }

    return (data || []).map(patient => {
      const simulationsArray = patient.simulations || [];
      return {
        ...patient,
        simulations_count: simulationsArray.length,
        latest_simulation: simulationsArray.length > 0 ? simulationsArray[0] : null,
        latest_budget: patient.budgets && patient.budgets.length > 0 ? patient.budgets[0] : null
      };
    });
  } catch (error: any) {
    // Se houver erro relacionado à coluna archived, buscar sem o filtro
    if (error.message?.includes('archived') || error.code === '42703') {
      console.warn('Coluna archived não encontrada, buscando todos os pacientes');
      const { data, error: fallbackError } = await supabase
        .from('patients')
        .select(`
          *,
          simulations!simulations_patient_id_fkey (
            id,
            original_image_url,
            processed_image_url,
            technical_notes,
            treatment_type,
            created_at
          ),
          budgets (
            id,
            budget_number,
            final_price,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;

      return (data || []).map(patient => {
        const simulationsArray = patient.simulations || [];
        return {
          ...patient,
          simulations_count: simulationsArray.length,
          latest_simulation: simulationsArray.length > 0 ? simulationsArray[0] : null,
          latest_budget: patient.budgets && patient.budgets.length > 0 ? patient.budgets[0] : null
        };
      });
    }
    throw error;
  }
}

export async function getPatientById(id: string): Promise<Patient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations:simulations(count)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;

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
    .insert({
      ...patientData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;

  // Criar notificação persistente de novo paciente
  await notifyPatientCreated(user.id, data.name, data.id);

  return data;
}

export async function updatePatient(id: string, patientData: UpdatePatientData): Promise<Patient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .update(patientData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePatient(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function searchPatients(query: string): Promise<PatientWithRelations[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      simulations!simulations_patient_id_fkey (
        id,
        original_image_url,
        processed_image_url,
        technical_notes,
        treatment_type,
        created_at
      ),
      budgets (
        id,
        budget_number,
        final_price,
        status,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(patient => {
    const simulationsArray = patient.simulations || [];
    return {
      ...patient,
      simulations_count: simulationsArray.length,
      latest_simulation: simulationsArray.length > 0 ? simulationsArray[0] : null,
      latest_budget: patient.budgets && patient.budgets.length > 0 ? patient.budgets[0] : null
    };
  });
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

export async function archivePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ archived: true })
    .eq('id', id);

  if (error) throw error;
}

export async function unarchivePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ archived: false })
    .eq('id', id);

  if (error) throw error;
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
