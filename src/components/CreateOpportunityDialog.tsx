import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Budget } from '@/services/budgetService';
import { formatCurrency } from '@/utils/formatters';
import { Sparkles } from 'lucide-react';

interface CreateOpportunityDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budget: Budget | null;
  existingLead: boolean;
}

export const CreateOpportunityDialog: React.FC<CreateOpportunityDialogProps> = ({
  open,
  onClose,
  onConfirm,
  budget,
  existingLead,
}) => {
  if (!budget) return null;

  const treatmentLabel = budget.treatment_type === 'facetas' ? 'Facetas' : 'Clareamento';

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {existingLead ? 'Atualizar Oportunidade no CRM' : 'Criar Oportunidade no CRM'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-4">
            <div className="text-sm text-foreground">
              <p className="font-medium mb-2">Resumo do Orçamento:</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente:</span>
                  <span className="font-medium">{budget.patient?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tratamento:</span>
                  <span className="font-medium">{treatmentLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-primary">{formatCurrency(budget.final_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orçamento:</span>
                  <span className="font-medium">{budget.budget_number}</span>
                </div>
              </div>
            </div>
            
            {existingLead ? (
              <p className="text-sm text-muted-foreground">
                Um lead já existe para este paciente e tratamento. Ele será atualizado e movido para o estágio <strong>Fechamento</strong>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Um novo lead será criado no estágio <strong>Fechamento</strong> do CRM.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {existingLead ? 'Atualizar Lead' : 'Criar Lead'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
