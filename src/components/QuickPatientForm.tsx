import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const quickPatientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
});

type QuickPatientFormData = z.infer<typeof quickPatientSchema>;

interface QuickPatientFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (data: QuickPatientFormData) => Promise<void>;
  onSuccess?: (patientId: string) => void;
  onCancel?: () => void;
}

export const QuickPatientForm: React.FC<QuickPatientFormProps> = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<QuickPatientFormData>({
    resolver: zodResolver(quickPatientSchema)
  });

  const onSubmit = async (data: QuickPatientFormData) => {
    try {
      if (onSave) {
        await onSave(data);
      }
      
      // Se tem onSuccess, significa que é modo integrado (sem Dialog próprio)
      if (onSuccess) {
        // Criar o paciente e retornar o ID
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: patient, error } = await supabase
          .from('patients')
          .insert([{
            name: data.name,
            phone: data.phone,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        if (patient) {
          onSuccess(patient.id);
        }
      }
      
      reset();
      if (onClose) onClose();
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  // Se não tem isOpen definido, renderizar sem Dialog (modo inline)
  if (isOpen === undefined) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="quick-name">Nome *</Label>
          <Input
            id="quick-name"
            {...register('name')}
            placeholder="Nome do paciente"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="quick-phone">Telefone *</Label>
          <Input
            id="quick-phone"
            {...register('phone')}
            placeholder="(11) 99999-9999"
            className="mt-1"
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Criar Paciente Rápido</DialogTitle>
          <DialogDescription>
            Cadastro simplificado com nome e telefone
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="quick-name">Nome *</Label>
            <Input
              id="quick-name"
              {...register('name')}
              placeholder="Nome do paciente"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quick-phone">Telefone *</Label>
            <Input
              id="quick-phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              className="mt-1"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
