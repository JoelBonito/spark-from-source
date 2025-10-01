import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Patient } from '@/services/patientService';
import { patientSchema, PatientFormData } from '@/utils/patientValidation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PatientModalProps {
  patient?: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PatientFormData) => Promise<void>;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSave
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient || {}
  });

  useEffect(() => {
    if (isOpen) {
      reset(patient || {});
    }
  }, [isOpen, patient, reset]);

  const onSubmit = async (data: PatientFormData) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome completo do paciente"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(11) 99999-9999"
              className="mt-1"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@exemplo.com"
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              {...register('birth_date')}
              className="mt-1"
            />
            {errors.birth_date && (
              <p className="text-sm text-destructive mt-1">{errors.birth_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Endereço completo"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Anotações sobre o paciente"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
