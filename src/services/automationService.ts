import { supabase } from '@/integrations/supabase/client';
import { createLead } from './leadService';
import { createBudget } from './budgetService';
import { addDays } from 'date-fns';

export async function autoProcessSimulation(
  simulationId: string,
  patientId: string | null,
  patientName: string,
  patientPhone: string,
  teethCount: number,
  finalPrice: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Create or update lead
    const leadData = {
      patient_id: patientId || undefined,
      name: patientName,
      phone: patientPhone,
      stage: 'novo_lead' as const,
      opportunity_value: finalPrice,
      source: 'simulacao' as const,
      notes: `Lead criado automaticamente a partir da simulação ${simulationId}`,
    };

    // Check if lead already exists for this patient
    let leadId: string;
    if (patientId) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('patient_id', patientId)
        .eq('user_id', user.id)
        .single();

      if (existingLead) {
        leadId = existingLead.id;
        // Update existing lead with new opportunity value
        await supabase
          .from('leads')
          .update({ 
            opportunity_value: finalPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);
      } else {
        const newLead = await createLead(leadData);
        leadId = newLead.id;
      }
    } else {
      const newLead = await createLead(leadData);
      leadId = newLead.id;
    }

    // 2. Create activity for the lead
    await supabase.from('activities').insert({
      lead_id: leadId,
      type: 'simulation',
      title: 'Simulação realizada',
      description: `Nova simulação de ${teethCount} facetas - Valor: R$ ${finalPrice.toFixed(2)}`,
      user_id: user.id,
      metadata: {
        simulation_id: simulationId,
        teeth_count: teethCount,
        value: finalPrice
      }
    });

    // 3. Create budget in draft status
    const budgetNumber = generateBudgetNumber();
    const budget = await createBudget({
      budget_number: budgetNumber,
      patient_id: patientId || undefined,
      simulation_id: simulationId,
      teeth_count: teethCount,
      price_per_tooth: 600,
      subtotal: finalPrice,
      final_price: finalPrice,
      status: 'draft',
      valid_until: addDays(new Date(), 30),
    });

    console.log('Automation complete:', { leadId, budgetId: budget.id });

    return {
      success: true,
      leadId,
      budgetId: budget.id,
      budgetNumber
    };
  } catch (error) {
    console.error('Error in automation:', error);
    throw error;
  }
}

function generateBudgetNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ORCAM-${year}${month}-${random}`;
}

export async function markExpiredBudgets(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];

  const { data: expiredBudgets, error } = await supabase
    .from('budgets')
    .update({ status: 'expired' })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lt('valid_until', today)
    .select();

  if (error) throw error;

  // Create activities for expired budgets
  if (expiredBudgets && expiredBudgets.length > 0) {
    for (const budget of expiredBudgets) {
      if (budget.patient_id) {
        // Find lead for this patient
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .eq('patient_id', budget.patient_id)
          .eq('user_id', user.id)
          .single();

        if (lead) {
          await supabase.from('activities').insert({
            lead_id: lead.id,
            type: 'budget_expired',
            title: 'Orçamento expirado',
            description: `Orçamento ${budget.budget_number} expirou`,
            user_id: user.id,
          });
        }
      }
    }
  }

  return expiredBudgets?.length || 0;
}
