import { supabase } from '@/integrations/supabase/client';

export type NotificationType =
  | 'simulation_completed'
  | 'simulation_error'
  | 'lead_created'
  | 'lead_stage_changed'
  | 'budget_created'
  | 'budget_status_changed'
  | 'action_reminder'
  | 'patient_created'
  | 'lead_inactive'
  | 'goal_achieved';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationMetadata {
  entity_id?: string;
  entity_type?: 'lead' | 'budget' | 'simulation' | 'patient';
  action_url?: string;
  priority?: NotificationPriority;
  [key: string]: any;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

/**
 * Cria uma notificação persistente no banco de dados
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, metadata = {} } = params;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[NotificationService] Notificação criada:', { type, title });
    return { data, error: null };
  } catch (error) {
    console.error('[NotificationService] Erro ao criar notificação:', error);
    return { data: null, error };
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('[NotificationService] Erro ao marcar como lida:', error);
    return { error };
  }
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('[NotificationService] Erro ao marcar todas como lidas:', error);
    return { error };
  }
}

/**
 * Busca notificações de um usuário
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  unreadOnly = false
) {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[NotificationService] Erro ao buscar notificações:', error);
    return { data: null, error };
  }
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('[NotificationService] Erro ao deletar notificação:', error);
    return { error };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA NOTIFICAÇÕES ESPECÍFICAS
// ============================================================================

/**
 * Cria notificação de simulação concluída
 */
export async function notifySimulationCompleted(
  userId: string,
  simulationType: 'facetas' | 'clareamento',
  patientName: string,
  simulationId: string
) {
  const typeLabel = simulationType === 'facetas' ? 'Facetas' : 'Clareamento';

  return createNotification({
    userId,
    type: 'simulation_completed',
    title: 'Simulação concluída com sucesso',
    message: `Simulação de ${typeLabel} para ${patientName} está pronta`,
    metadata: {
      entity_id: simulationId,
      entity_type: 'simulation',
      action_url: `/simulator?id=${simulationId}`,
      priority: 'high',
      simulation_type: simulationType,
      patient_name: patientName,
    },
  });
}

/**
 * Cria notificação de erro na simulação
 */
export async function notifySimulationError(
  userId: string,
  simulationType: 'facetas' | 'clareamento',
  patientName: string,
  errorMessage: string
) {
  const typeLabel = simulationType === 'facetas' ? 'Facetas' : 'Clareamento';

  return createNotification({
    userId,
    type: 'simulation_error',
    title: 'Erro na simulação',
    message: `Simulação de ${typeLabel} para ${patientName} falhou - ${errorMessage}`,
    metadata: {
      entity_type: 'simulation',
      priority: 'high',
      simulation_type: simulationType,
      patient_name: patientName,
      error: errorMessage,
    },
  });
}

/**
 * Cria notificação de novo lead
 */
export async function notifyNewLead(
  userId: string,
  leadName: string,
  leadId: string,
  origin?: string,
  treatmentType?: string
) {
  const originText = origin ? ` de ${origin}` : '';
  const treatmentText = treatmentType ? ` - ${treatmentType}` : '';

  return createNotification({
    userId,
    type: 'lead_created',
    title: `Novo lead: ${leadName}`,
    message: `Novo lead${originText}${treatmentText}`,
    metadata: {
      entity_id: leadId,
      entity_type: 'lead',
      action_url: `/crm/lead/${leadId}`,
      priority: 'high',
      lead_name: leadName,
      origin,
      treatment_type: treatmentType,
    },
  });
}

/**
 * Cria notificação de mudança de etapa do lead
 */
export async function notifyLeadStageChanged(
  userId: string,
  leadName: string,
  leadId: string,
  newStage: string,
  stageName: string
) {
  return createNotification({
    userId,
    type: 'lead_stage_changed',
    title: `Lead movido para ${stageName}`,
    message: `${leadName} avançou para ${stageName}`,
    metadata: {
      entity_id: leadId,
      entity_type: 'lead',
      action_url: `/crm/lead/${leadId}`,
      priority: 'medium',
      lead_name: leadName,
      new_stage: newStage,
      stage_name: stageName,
    },
  });
}

/**
 * Cria notificação de orçamento criado
 */
export async function notifyBudgetCreated(
  userId: string,
  patientName: string,
  budgetId: string,
  budgetNumber: string,
  totalValue: number
) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalValue);

  return createNotification({
    userId,
    type: 'budget_created',
    title: 'Orçamento criado',
    message: `Orçamento #${budgetNumber} para ${patientName} - ${formattedValue}`,
    metadata: {
      entity_id: budgetId,
      entity_type: 'budget',
      action_url: `/crm?budget=${budgetId}`,
      priority: 'medium',
      patient_name: patientName,
      budget_number: budgetNumber,
      total_value: totalValue,
    },
  });
}

/**
 * Cria notificação de mudança de status do orçamento
 */
export async function notifyBudgetStatusChanged(
  userId: string,
  budgetNumber: string,
  budgetId: string,
  newStatus: 'accepted' | 'rejected',
  patientName?: string
) {
  const statusLabel = newStatus === 'accepted' ? 'aceito' : 'rejeitado';
  const statusEmoji = newStatus === 'accepted' ? '🎉' : '❌';

  return createNotification({
    userId,
    type: 'budget_status_changed',
    title: `Orçamento ${statusLabel}`,
    message: `Orçamento #${budgetNumber} foi ${statusLabel} ${statusEmoji}`,
    metadata: {
      entity_id: budgetId,
      entity_type: 'budget',
      action_url: `/crm?budget=${budgetId}`,
      priority: newStatus === 'accepted' ? 'high' : 'medium',
      budget_number: budgetNumber,
      new_status: newStatus,
      patient_name: patientName,
    },
  });
}

/**
 * Cria notificação de novo paciente cadastrado
 */
export async function notifyPatientCreated(
  userId: string,
  patientName: string,
  patientId: string
) {
  return createNotification({
    userId,
    type: 'patient_created',
    title: 'Novo paciente cadastrado',
    message: `${patientName} foi adicionado aos pacientes`,
    metadata: {
      entity_id: patientId,
      entity_type: 'patient',
      action_url: `/patients/${patientId}`,
      priority: 'low',
      patient_name: patientName,
    },
  });
}

/**
 * Cria notificação de lembrete de ação
 */
export async function notifyActionReminder(
  userId: string,
  leadName: string,
  leadId: string,
  actionDescription: string,
  dueDate: Date
) {
  return createNotification({
    userId,
    type: 'action_reminder',
    title: `Ação pendente: ${leadName}`,
    message: `Lembrete: ${actionDescription} para ${leadName}`,
    metadata: {
      entity_id: leadId,
      entity_type: 'lead',
      action_url: `/crm/lead/${leadId}`,
      priority: 'high',
      lead_name: leadName,
      action_description: actionDescription,
      due_date: dueDate.toISOString(),
    },
  });
}
