import React from 'react';
import { X, Calendar, Phone, Mail, MapPin, FileText, DollarSign, Pencil, Plus, Sparkles, Sun } from 'lucide-react';
import { usePatientDetail } from '@/hooks/usePatientDetail';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhoneNumber } from '@/utils/patientValidation';
import { formatCurrency } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientDetailModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (patientId: string) => void;
  onNewSimulation?: (patientId: string) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onEdit,
  onNewSimulation
}) => {
  const { patient, simulations, loading } = usePatientDetail(patientId);

  if (!patient && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Detalhes do Paciente</DialogTitle>
              <DialogDescription>
                Informações cadastrais e histórico de simulações do paciente
              </DialogDescription>
            </div>
            {patient && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(patient.id);
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* Informações do Paciente */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg text-foreground">{patient.name}</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{formatPhoneNumber(patient.phone)}</span>
                </div>
                
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{patient.email}</span>
                  </div>
                )}
                
                {patient.birth_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(patient.birth_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
                
                {patient.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </div>

              {patient.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Observações:</strong> {patient.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Histórico de Simulações */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Histórico de Simulações ({simulations.length})
              </h4>

              {simulations.length === 0 ? (
                <div className="bg-muted/30 rounded-lg p-6 text-center space-y-2">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma simulação realizada ainda
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crie uma nova simulação para este paciente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {simulations.map((simulation) => (
                    <div
                      key={simulation.id}
                      className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {format(new Date(simulation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                            <Badge 
                              variant={simulation.treatment_type === 'clareamento' ? 'default' : 'secondary'}
                              className="flex items-center gap-1"
                            >
                              {simulation.treatment_type === 'clareamento' ? (
                                <>
                                  <Sun className="w-3 h-3" />
                                  Clareamento
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  Facetas
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {simulation.teeth_count} dentes • Status: {simulation.status}
                          </p>
                        </div>
                        
                        {simulation.final_price && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-primary font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(simulation.final_price)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        {simulation.processed_image_url && (
                          <a
                            href={simulation.processed_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Ver resultado
                          </a>
                        )}
                        {simulation.budget_pdf_url && (
                          <a
                            href={simulation.budget_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Orçamento
                          </a>
                        )}
                        {simulation.technical_report_url && (
                          <a
                            href={simulation.technical_report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Relatório
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer com ação de Nova Simulação */}
            {patient && onNewSimulation && (
              <DialogFooter>
                <Button 
                  onClick={() => {
                    onNewSimulation(patient.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Simulação
                </Button>
              </DialogFooter>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
