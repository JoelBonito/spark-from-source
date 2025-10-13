import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: 'Facetas dentárias' | 'Clareamento' | 'Consulta' | 'Gengivoplastia' | 'Opcional';
  price: number;
  active: boolean;
  required: boolean;
  base: boolean;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setServices((data || []) as Service[]);
    } catch (error: any) {
      toast.error('Erro ao carregar serviços');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const createService = async (serviceData: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('services')
        .insert({ ...serviceData, user_id: user.id })
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao criar serviço:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      if (!data) throw new Error('Falha ao criar serviço');
      
      await fetchServices();
      toast.success('Serviço criado com sucesso');
      return data;
    } catch (error: any) {
      toast.error('Erro ao criar serviço');
      throw error;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchServices();
      toast.success('Serviço atualizado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao atualizar serviço');
      throw error;
    }
  };

  const archiveService = async (id: string) => {
    try {
      await updateService(id, { active: false });
      toast.success('Serviço arquivado');
    } catch (error) {
      toast.error('Erro ao arquivar serviço');
    }
  };

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    archiveService
  };
}
