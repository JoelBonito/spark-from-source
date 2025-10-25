import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tipo_servico: 'Serviço obrigatório' | 'Serviço opcional';
  price: number;
  observacoes: string | null;
  active: boolean;
  required: boolean;
  base: boolean;
  created_at: string;
  updated_at: string;
}

// Função para criar serviços padrão
export async function createDefaultServices(userId: string) {
  const defaultServices = [
    {
      user_id: userId,
      name: 'Facetas Dentárias',
      description: 'Facetas em porcelana feldspática ou dissilicato de lítio',
      tipo_servico: 'Serviço obrigatório',
      price: 2500,
      observacoes: 'Serviço base para simulações de facetas',
      active: true,
      required: true,
      base: true
    },
    {
      user_id: userId,
      name: 'Clareamento Dental',
      description: 'Clareamento dental profissional em consultório',
      tipo_servico: 'Serviço obrigatório',
      price: 800,
      observacoes: 'Serviço base para simulações de clareamento',
      active: true,
      required: true,
      base: true
    }
  ];

  const { error } = await supabase
    .from('services')
    .insert(defaultServices);

  if (error) throw error;
}

// Função para buscar serviços ativos por tipo
export async function getActiveServicesByType(tipo: 'Serviço obrigatório' | 'Serviço opcional') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .eq('tipo_servico', tipo)
    .eq('active', true);

  if (error) throw error;
  return (data || []) as Service[];
}

// Função para buscar serviço por nome
export async function getServiceByName(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', `%${name}%`)
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  return data as Service | null;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('tipo_servico', { ascending: false })
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
    const initializeServices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingServices } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingServices || existingServices.length === 0) {
        try {
          await createDefaultServices(user.id);
        } catch (error) {
          console.error('Erro ao criar serviços padrão:', error);
        }
      }
      
      fetchServices();
    };

    initializeServices();
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
