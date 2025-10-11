import React from 'react';
import { DollarSign, CreditCard, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BudgetDisplayProps {
  teethCount: number;
  onTeethCountChange?: (count: number) => void;
  budget: any;
  editable?: boolean;
  treatmentType?: 'facetas' | 'clareamento';
}

export const BudgetDisplay = ({
  teethCount,
  onTeethCountChange,
  budget,
  editable = false,
  treatmentType = 'facetas'
}: BudgetDisplayProps) => {
  const getTreatmentLabel = () => {
    return treatmentType === 'facetas' ? 'Facetas Dentárias' : 'Clareamento Dental';
  };

  const getTeethLabel = () => {
    return treatmentType === 'facetas' ? 'facetas' : 'dentes';
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-foreground">Orçamento Automático</h3>
        </div>
        <Badge variant={treatmentType === 'facetas' ? 'default' : 'secondary'} className="gap-1">
          <Sparkles className="w-3 h-3" />
          {getTreatmentLabel()}
        </Badge>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Número de {treatmentType === 'facetas' ? 'Facetas Detectadas' : 'Dentes para Clareamento'}
            </p>
            <div className="flex items-center gap-3">
              {editable ? (
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={teethCount}
                  onChange={(e) => onTeethCountChange?.(parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-input bg-background rounded-lg text-center font-bold text-2xl"
                />
              ) : (
                <p className="text-3xl font-bold text-foreground">{teethCount}</p>
              )}
              <span className="text-muted-foreground">{getTeethLabel()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Valor por {treatmentType === 'facetas' ? 'Faceta' : 'Dente'}
            </p>
            <p className="text-2xl font-bold text-foreground">
              R$ {budget.pricePerTooth.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground">Valor Total</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {budget.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Opções de Pagamento */}
      <div>
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Opções de Pagamento
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budget.paymentOptions.map((option: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                option.discount > 0
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : 'border-border bg-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-foreground">{option.name}</p>
                {option.discount > 0 && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-bold">
                    -{option.discount}%
                  </span>
                )}
              </div>
              
              <p className="text-2xl font-bold text-foreground mb-1">
                {option.installments}x R$ {option.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              
              <p className="text-sm text-muted-foreground">
                Total: R$ {option.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex gap-2">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Informações Importantes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Orçamento válido por 30 dias</li>
              <li>Parcelamento sem juros no cartão de crédito</li>
              <li>Inclui planejamento digital 3D e acompanhamento</li>
              <li>Valores sujeitos a avaliação clínica presencial</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
