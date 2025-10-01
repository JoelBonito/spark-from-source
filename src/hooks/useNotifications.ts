import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useNotifications() {
  useEffect(() => {
    let userId: string | undefined;

    // Get user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      // Subscribe to budget updates
      const budgetsChannel = supabase
        .channel('budgets-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'budgets',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            if (payload.new.status === 'accepted') {
              toast.success(`Orçamento ${payload.new.budget_number} foi aceito! 🎉`);
            }
          }
        )
        .subscribe();

      // Subscribe to new leads
      const leadsChannel = supabase
        .channel('leads-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leads',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            toast.info(`Novo lead: ${payload.new.name}`);
          }
        )
        .subscribe();

      // Subscribe to stage changes
      const stageChannel = supabase
        .channel('stage-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            if (payload.old.stage !== payload.new.stage) {
              const stageNames: Record<string, string> = {
                novo_lead: 'Novo Lead',
                qualificacao: 'Qualificação',
                conversao: 'Conversão',
                fidelizacao: 'Fidelização'
              };
              toast.info(`${payload.new.name} movido para ${stageNames[payload.new.stage]}`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(budgetsChannel);
        supabase.removeChannel(leadsChannel);
        supabase.removeChannel(stageChannel);
      };
    });
  }, []);
}
