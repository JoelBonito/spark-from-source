import React from 'react';
import { Eye, Download, MoreVertical, Pencil, Archive, Sparkles, Sun } from 'lucide-react';
import { Budget } from '@/services/budgetService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BudgetTableProps {
  budgets: Budget[];
  onView: (budget: Budget) => void;
  onStatusChange: (budget: Budget, status: Budget['status']) => void;
  onEdit: (budget: Budget) => void;
  onArchive: (budget: Budget) => void;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  budgets,
  onView,
  onStatusChange,
  onEdit,
  onArchive
}) => {
  if (budgets.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dentes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Validade
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {budgets.map((budget) => (
              <tr key={budget.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {budget.budget_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    {budget.patient?.name || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={budget.treatment_type === 'clareamento' ? 'secondary' : 'default'}>
                    {budget.treatment_type === 'clareamento' ? (
                      <><Sun className="w-3 h-3 mr-1" /> Clareamento</>
                    ) : (
                      <><Sparkles className="w-3 h-3 mr-1" /> Facetas</>
                    )}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{budget.teeth_count}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(budget.final_price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={budget.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(budget.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {budget.valid_until 
                    ? format(new Date(budget.valid_until), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(budget)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {budget.pdf_url && (
                      <a
                        href={budget.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem 
                          onClick={() => onEdit(budget)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar Orçamento
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onStatusChange(budget, 'pending')}>
                          Marcar como Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(budget, 'sent')}>
                          Marcar como Enviado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(budget, 'viewed')}>
                          Marcar como Visualizado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(budget, 'accepted')}>
                          Marcar como Aceito
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(budget, 'rejected')}>
                          Marcar como Recusado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onArchive(budget)}
                          className="cursor-pointer text-destructive"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
