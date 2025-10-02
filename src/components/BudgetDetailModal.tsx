import React from 'react';
import { X, FileText, Download, Calendar, User, Phone } from 'lucide-react';
import { useBudgetDetail } from '@/hooks/useBudgetDetail';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BudgetDetailModalProps {
  budgetId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  budgetId,
  isOpen,
  onClose
}) => {
  const { budget, loading } = useBudgetDetail(budgetId);

  if (!budget && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Orçamento</DialogTitle>
          <DialogDescription>
            Informações completas sobre o orçamento do paciente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : budget ? (
          <div className="space-y-6">
            {/* Informações principais */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {budget.budget_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(budget.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <StatusBadge status={budget.status} />
              </div>

              {/* Dados do paciente */}
              {budget.patient && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="text-foreground">{budget.patient.name}</span>
                  </div>
                  {budget.patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{budget.patient.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detalhamento do orçamento */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Detalhamento</h4>
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {budget.teeth_count} facetas × {formatCurrency(budget.price_per_tooth)}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(budget.subtotal)}
                  </span>
                </div>
                
                {budget.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Desconto {budget.discount_percentage > 0 && `(${budget.discount_percentage}%)`}
                    </span>
                    <span>- {formatCurrency(budget.discount_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(budget.final_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Opções de pagamento */}
            {budget.payment_conditions && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Opções de Pagamento</h4>
                <div className="space-y-2">
                  {Array.isArray(budget.payment_conditions) ? (
                    budget.payment_conditions.map((option: any, index: number) => (
                      <div
                        key={index}
                        className="bg-muted/30 rounded-lg p-3 text-sm"
                      >
                        {typeof option === 'string' ? option : JSON.stringify(option)}
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3 text-sm">
                      {JSON.stringify(budget.payment_conditions)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validade */}
            {budget.valid_until && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Válido até:{' '}
                  <span className="text-foreground font-medium">
                    {format(new Date(budget.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </span>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-border">
              {budget.pdf_url && (
                <>
                  <Button
                    onClick={() => window.open(budget.pdf_url!, '_blank')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Ver PDF
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a
                      href={budget.pdf_url}
                      download
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
