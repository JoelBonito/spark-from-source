import React from 'react';
import { X, Calendar, Phone, Mail, MapPin, FileText, DollarSign } from 'lucide-react';
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
} from '@/components/ui/dialog';

interface PatientDetailModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patientId,
  isOpen,
  onClose
}) => {
  const { patient, simulations, loading } = usePatientDetail(patientId);

  if (!patient && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Paciente</DialogTitle>
          <DialogDescription>
            Informações cadastrais e histórico de simulações do paciente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma simulação realizada ainda
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
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(simulation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
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
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
