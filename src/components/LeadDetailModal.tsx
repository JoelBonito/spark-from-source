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
import { Loader2, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
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

export function LeadDetailModal({ leadId, isOpen, onClose }: LeadDetailModalProps) {
  const { lead, activities, simulations, loading, updateLead, addActivity } = useLeadDetail(leadId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="simulations">Simulações</TabsTrigger>
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
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {simulation.teeth_count} facetas
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
                              {simulation.budget_pdf_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(simulation.budget_pdf_url, '_blank')}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  PDF
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
      </DialogContent>
    </Dialog>
  );
}
