import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string): Promise<ServiceCategory | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('service_categories')
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast.success('Categoria criada com sucesso!');
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Esta categoria já existe');
      } else {
        console.error('Erro ao criar categoria:', error);
        toast.error('Erro ao criar categoria');
      }
      return null;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria removida');
    } catch (error: any) {
      console.error('Erro ao remover categoria:', error);
      toast.error('Erro ao remover categoria');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    createCategory,
    deleteCategory,
    refetch: fetchCategories
  };
}
