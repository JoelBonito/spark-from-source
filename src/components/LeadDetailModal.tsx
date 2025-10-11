import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLeadDetail } from '@/hooks/useLeadDetail';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LeadTimeline } from './LeadTimeline';
import { QuickActions } from './QuickActions';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useState } from 'react';
import { Loader2, FileText, Image, Eye, Pencil, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComparisonViewModal } from './ComparisonViewModal';
import { TechnicalReportDialog } from './TechnicalReportDialog';
import { StatusBadge } from './StatusBadge';
import { Budget } from '@/services/budgetService';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onViewBudget?: (budgetId: string) => void;
  onEditBudget?: (budget: Budget) => void;
}

const stageNames: Record<string, string> = {
  novo_lead: 'Novo Lead',
  qualificacao: 'Qualificação',
  conversao: 'Conversão',
  fidelizacao: 'Fidelização'
};

const stageColors: Record<string, string> = {
  novo_lead: 'secondary',
  qualificacao: 'default',
  conversao: 'default',
  fidelizacao: 'default'
};

export function LeadDetailModal({ leadId, isOpen, onClose, onViewBudget, onEditBudget }: LeadDetailModalProps) {
  const { lead, activities, simulations, budgets, loading, updateLead, addActivity } = useLeadDetail(leadId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    beforeImage: string;
    afterImage: string;
  } | null>(null);
  const [technicalReportModal, setTechnicalReportModal] = useState<{
    isOpen: boolean;
    data: any;
  } | null>(null);

  // Atualizar form quando lead carregar
  useState(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        notes: lead.notes || ''
      });
    }
  });

  const handleSave = async () => {
    try {
      await updateLead(formData);
      setIsEditing(false);
    } catch (err) {
      // Erro já tratado no hook
    }
  };

  const handleAddNote = async (note: string) => {
    await addActivity({
      type: 'note',
      title: 'Nota adicionada',
      description: note
    });
  };

  const handleOpenComparison = (simulation: any) => {
    if (simulation.original_image_url && simulation.processed_image_url) {
      setComparisonModal({
        isOpen: true,
        beforeImage: simulation.original_image_url,
        afterImage: simulation.processed_image_url
      });
    }
  };

  const handleOpenTechnicalReport = (simulation: any) => {
    if (simulation.technical_notes) {
      try {
        const parsedData = typeof simulation.technical_notes === 'string'
          ? JSON.parse(simulation.technical_notes)
          : simulation.technical_notes;
        setTechnicalReportModal({
          isOpen: true,
          data: parsedData
        });
      } catch (error) {
        console.error('Error parsing technical notes:', error);
      }
    }
  };

  if (!isOpen || !leadId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lead ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalhes completos e histórico do lead
                  </DialogDescription>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.phone}
                  </p>
                </div>
                <Badge variant={stageColors[lead.stage] as any}>
                  {stageNames[lead.stage] || lead.stage}
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-6 mt-4">
              {/* Coluna Principal */}
              <div className="col-span-2 space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="simulations">Simulações</TabsTrigger>
                    <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome</label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Telefone</label>
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Observações</label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSave}>Salvar</Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm">{lead.email || 'Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Observações</p>
                            <p className="text-sm whitespace-pre-wrap">
                              {lead.notes || 'Nenhuma observação'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fonte</p>
                            <p className="text-sm capitalize">{lead.source}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data de criação</p>
                            <p className="text-sm">
                              {format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR
                              })}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                          Editar Informações
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline">
                    <LeadTimeline activities={activities} onAddNote={handleAddNote} />
                  </TabsContent>

                  <TabsContent value="simulations">
                    {simulations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma simulação realizada
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {simulations.map((simulation) => (
                          <div
                            key={simulation.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">
                                  {simulation.treatment_type === 'clareamento' 
                                    ? 'Clareamento Total' 
                                    : `${simulation.teeth_count} facetas`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(simulation.created_at), "dd/MM/yyyy 'às' HH:mm")}
                                </p>
                                {simulation.final_price && (
                                  <p className="text-sm font-semibold text-green-600 mt-1">
                                    {formatCurrency(simulation.final_price)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenComparison(simulation)}
                                disabled={!simulation.original_image_url || !simulation.processed_image_url}
                              >
                                <Image className="h-4 w-4 mr-1" />
                                Ver Antes e Depois
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenTechnicalReport(simulation)}
                                disabled={!simulation.technical_notes}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ver Relatório Técnico
                              </Button>

                              {simulation.budget_pdf_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(simulation.budget_pdf_url, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="budgets" className="space-y-4">
                    {budgets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum orçamento gerado
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {budgets.map((budget) => (
                          <div
                            key={budget.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">{budget.budget_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(budget.created_at), "dd/MM/yyyy 'às' HH:mm")}
                                </p>
                                <p className="text-lg font-semibold text-green-600 mt-1">
                                  {formatCurrency(budget.final_price)}
                                </p>
                              </div>
                              <StatusBadge status={budget.status} />
                            </div>

                            <div className="flex gap-2">
                              {onViewBudget && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onViewBudget(budget.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visualizar
                                </Button>
                              )}
                              
                              {onEditBudget && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEditBudget(budget)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Valor da Oportunidade */}
                {lead.opportunity_value && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Valor da Oportunidade
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(lead.opportunity_value)}
                    </p>
                  </div>
                )}

                {/* Ações Rápidas */}
                <QuickActions lead={lead} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Lead não encontrado</p>
          </div>
        )}

        {/* Modais Secundários */}
        {comparisonModal && (
          <ComparisonViewModal
            isOpen={comparisonModal.isOpen}
            onClose={() => setComparisonModal(null)}
            beforeImage={comparisonModal.beforeImage}
            afterImage={comparisonModal.afterImage}
            patientName={lead?.name || ''}
          />
        )}

        {technicalReportModal && (
          <TechnicalReportDialog
            open={technicalReportModal.isOpen}
            onOpenChange={(open) => !open && setTechnicalReportModal(null)}
            data={technicalReportModal.data}
            patientName={lead?.name || ''}
            onDownloadPDF={() => {}}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
