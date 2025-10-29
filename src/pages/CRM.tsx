import { useState } from 'react';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { usePipelineMetrics } from '@/hooks/usePipelineMetrics';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { BudgetDetailModal } from '@/components/BudgetDetailModal';
import { BudgetFormModal } from '@/components/BudgetFormModal';
import { Lead, ExtendedLead } from '@/services/leadService';
import { Budget, updateBudget } from '@/services/budgetService';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, TrendingUp, DollarSign, Target, Sparkles, Smile, Archive } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

export default function CRM() {
  const [showArchived, setShowArchived] = useState(false);
  const { leadsByStage, loading, moveLeadToStage, refresh, deleteLead } = useKanbanBoard(showArchived);
  const { totalLeads, inNegotiation, conversionRate, potentialRevenue } = usePipelineMetrics();
  const [selectedLead, setSelectedLead] = useState<ExtendedLead | null>(null);
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'facetas' | 'clareamento'>('all');
  
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isBudgetDetailOpen, setIsBudgetDetailOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  const handleLeadClick = (lead: ExtendedLead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    refresh();
  };

  const handleViewBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setIsBudgetDetailOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsBudgetFormOpen(true);
  };

  const handleSaveBudget = async (data: any) => {
    try {
      if (selectedBudget) {
        const itemsWithTotals = data.items.map((item: any) => ({
          ...item,
          valor_total: item.quantidade * item.valor_unitario
        }));

        const subtotal = itemsWithTotals.reduce((sum: number, item: any) => 
          sum + item.valor_total, 0);
        const discountAmount = subtotal * (data.discount / 100);
        const finalPrice = subtotal - discountAmount;

        await updateBudget(selectedBudget.id, {
          items: itemsWithTotals,
          subtotal,
          discount_percentage: data.discount,
          discount_amount: discountAmount,
          final_price: finalPrice,
          treatment_type: data.treatment_type
        });

        toast.success('Orçamento atualizado com sucesso!');
      }

      setIsBudgetFormOpen(false);
      setSelectedBudget(null);
      refresh();
    } catch (error) {
      toast.error('Erro ao salvar orçamento');
    }
  };

  const handleDeleteLead = (leadId: string) => {
    deleteLead(leadId);
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      // Buscar o lead no estado atual
      const stage = Object.keys(leadsByStage).find(s =>
        leadsByStage[s].some(l => l.id === leadId)
      );

      if (!stage) {
        throw new Error('Lead não encontrado');
      }

      const lead = leadsByStage[stage].find(l => l.id === leadId);
      if (!lead || !lead.patient_id) {
        throw new Error('Lead inválido');
      }

      // Buscar lead real do banco
      const { getAllLeads, archiveLead } = await import('@/services/leadService');
      const allLeads = await getAllLeads();
      
      const realLead = allLeads.find(l =>
        l.patient_id === lead.patient_id &&
        l.treatment_type === lead.treatment_type
      );

      if (!realLead) {
        throw new Error('Lead não encontrado no banco');
      }

      // Arquivar usando UUID real
      await archiveLead(realLead.id);
      
      toast.success('Lead arquivado com sucesso!');
      refresh();
    } catch (error) {
      console.error('Error archiving lead:', error);
      toast.error('Erro ao arquivar lead');
    }
  };

  // FASE 7: Filtrar leads por tipo de tratamento
  const filteredLeadsByStage = Object.fromEntries(
    Object.entries(leadsByStage).map(([stage, leads]) => [
      stage,
      treatmentFilter === 'all' 
        ? leads 
        : leads.filter(lead => lead.treatment_type === treatmentFilter)
    ])
  ) as typeof leadsByStage;

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
        {/* Header com Filtros - Responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filtro por tipo de tratamento */}
          <Tabs value={treatmentFilter} onValueChange={(v) => setTreatmentFilter(v as typeof treatmentFilter)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Todos</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="facetas" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Facetas</span>
                <span className="sm:hidden">Fac</span>
              </TabsTrigger>
              <TabsTrigger value="clareamento" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Clareamento</span>
                <span className="sm:hidden">Cla</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Toggle para mostrar arquivados */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch
              id="show-archived-crm"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived-crm" className="flex items-center gap-2 cursor-pointer text-sm">
              <Archive className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mostrar Arquivados</span>
              <span className="sm:hidden">Arquivados</span>
            </Label>
          </div>
        </div>

        {/* Métricas - Grid Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Leads
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {totalLeads}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Em Negociação
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {inNegotiation}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Receita Potencial
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(potentialRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board com Leads Filtrados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <KanbanBoard
            leadsByStage={filteredLeadsByStage}
            onLeadClick={handleLeadClick}
            onMoveLeadToStage={moveLeadToStage}
            onDeleteLead={handleDeleteLead}
            onArchiveLead={handleArchiveLead}
          />
        )}

        {/* Modais */}
        <LeadDetailModal
          leadId={selectedLead?.realId || selectedLead?.id || null}
          isOpen={!!selectedLead}
          onClose={handleCloseModal}
          onViewBudget={handleViewBudget}
          onEditBudget={handleEditBudget}
        />

        <BudgetFormModal
          isOpen={isBudgetFormOpen}
          onClose={() => {
            setIsBudgetFormOpen(false);
            setSelectedBudget(null);
          }}
          budget={selectedBudget}
          onSave={handleSaveBudget}
        />

        <BudgetDetailModal
          budgetId={selectedBudgetId}
          isOpen={isBudgetDetailOpen}
          onClose={() => {
            setIsBudgetDetailOpen(false);
            setSelectedBudgetId(null);
          }}
        />
    </div>
  );
}
