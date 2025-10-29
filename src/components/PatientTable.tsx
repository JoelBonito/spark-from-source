import React from 'react';
import { Eye, Edit, Image, Trash2, MoreHorizontal, FileText, Images, ClipboardList, Archive } from 'lucide-react';
import { PatientWithRelations } from '@/services/patientService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhoneNumber } from '@/utils/patientValidation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface PatientTableProps {
  patients: PatientWithRelations[];
  onEdit: (patient: PatientWithRelations) => void;
  onDelete: (patient: PatientWithRelations) => void;
  onView: (patient: PatientWithRelations) => void;
  onNewSimulation: (patient: PatientWithRelations) => void;
  onViewComparison: (patient: PatientWithRelations) => void;
  onViewBudget: (patient: PatientWithRelations) => void;
  onEditBudget: (patient: PatientWithRelations) => void;
  onViewTechnicalReport: (patient: PatientWithRelations) => void;
  onArchive: (patient: PatientWithRelations) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  onEdit,
  onDelete,
  onView,
  onNewSimulation,
  onViewComparison,
  onViewBudget,
  onEditBudget,
  onViewTechnicalReport,
  onArchive
}) => {
  if (patients.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">Nenhum paciente encontrado</p>
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Simulações
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data Cadastro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">{patient.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{formatPhoneNumber(patient.phone)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-muted-foreground">
                    {patient.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onView(patient)}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    title="Ver histórico de simulações"
                  >
                    {patient.simulations_count || 0} {(patient.simulations_count || 0) === 1 ? 'simulação' : 'simulações'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => onView(patient)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => onEdit(patient)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Paciente
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => onNewSimulation(patient)}>
                        <Image className="mr-2 h-4 w-4" />
                        Nova Simulação
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Visualizações</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        onClick={() => onViewComparison(patient)}
                        disabled={!patient.latest_simulation?.original_image_url || !patient.latest_simulation?.processed_image_url}
                      >
                        <Images className="mr-2 h-4 w-4" />
                        Ver Antes e Depois
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onViewTechnicalReport(patient)}
                        disabled={!patient.latest_simulation?.technical_notes}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Ver Relatório Técnico
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Orçamentos</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        onClick={() => onViewBudget(patient)}
                        disabled={!patient.latest_budget}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Orçamento
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onEditBudget(patient)}
                        disabled={!patient.latest_budget}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Orçamento
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => onArchive(patient)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar Paciente
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onDelete(patient)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar Paciente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
