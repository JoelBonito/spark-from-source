import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Plus, Archive } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetStatus } from '@/hooks/useBudgetStatus';
import { BudgetTable } from '@/components/BudgetTable';
import { BudgetDetailModal } from '@/components/BudgetDetailModal';
import { BudgetFilters } from '@/components/BudgetFilters';
import { StatsCards } from '@/components/StatsCards';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Budget, createLeadFromBudget } from '@/services/budgetService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetFormModal } from '@/components/BudgetFormModal';
import { createManualBudget } from '@/services/budgetService';
import { CreateOpportunityDialog } from '@/components/CreateOpportunityDialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const Budgets = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'facetas' | 'clareamento'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailBudgetId, setDetailBudgetId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isOpportunityDialogOpen, setIsOpportunityDialogOpen] = useState(false);
  const [opportunityBudget, setOpportunityBudget] = useState<Budget | null>(null);
  const [existingLead, setExistingLead] = useState(false);

  const filters = {
    status: activeTab,
    search: searchQuery
  };

  const { budgets, stats, loading, refresh, updateBudget, archiveBudget } = useBudgets(filters);
  const { updateStatus } = useBudgetStatus();

  // Detectar navegação com states para ações automáticas
  useEffect(() => {
    if (location.state?.createNew) {
      setSelectedBudget(null);
      setIsFormModalOpen(true);
      // Limpar state após uso
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.filterPatientId) {
      setSearchQuery(location.state.filterPatientId);
      // Limpar state após uso
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleView = (budget: Budget) => {
    setDetailBudgetId(budget.id);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (budget: Budget, status: Budget['status']) => {
    try {
      await updateStatus(budget.id, status);
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
      });
      refresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormModalOpen(true);
  };

  const handleArchive = async (budget: Budget) => {
    try {
      await archiveBudget(budget.id);
      toast({
        title: 'Sucesso',
        description: 'Orçamento arquivado com sucesso',
      });
      refresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar orçamento',
        variant: 'destructive',
      });
    }
  };

  const handleNewBudget = () => {
    setSelectedBudget(null);
    setIsFormModalOpen(true);
  };

  const handleSaveBudget = async (data: any) => {
    try {
      if (selectedBudget) {
        // Modo edição
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

        toast({
          title: 'Sucesso',
          description: 'Orçamento atualizado com sucesso',
        });
      } else {
        // Modo criação (usar createManualBudget existente)
        await createManualBudget(data.patient_id, data.items, data.discount);
        
        toast({
          title: 'Sucesso',
          description: 'Orçamento criado com sucesso',
        });
      }

      setIsFormModalOpen(false);
      setSelectedBudget(null);
      refresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar orçamento',
        variant: 'destructive',
      });
    }
  };

  const handleCreateOpportunity = async (budget: Budget) => {
    // Check if lead already exists
    const hasLead = !!budget.lead_id;
    setExistingLead(hasLead);
    setOpportunityBudget(budget);
    setIsOpportunityDialogOpen(true);
  };

  const handleConfirmCreateOpportunity = async () => {
    if (!opportunityBudget) return;

    try {
      const { leadId, isNew } = await createLeadFromBudget(opportunityBudget.id);
      
      toast({
        title: 'Sucesso!',
        description: isNew 
          ? 'Oportunidade criada no CRM' 
          : 'Oportunidade atualizada no CRM',
      });

      setIsOpportunityDialogOpen(false);
      setOpportunityBudget(null);
      refresh();
      
      // Navigate to CRM
      navigate('/crm');
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar oportunidade no CRM',
        variant: 'destructive',
      });
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    if (filters.search) {
      const patientName = budget.patient?.name || '';
      if (!patientName.toLowerCase().includes(filters.search.toLowerCase()) && 
          !budget.budget_number.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
    }
    if (treatmentFilter !== 'all' && budget.treatment_type !== treatmentFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
        {/* Header - Botão de ação */}
        <div className="flex items-center justify-between gap-4">
          <Button onClick={handleNewBudget} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Orçamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>

          {/* Toggle para mostrar arquivados */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch
              id="show-archived-budgets"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived-budgets" className="flex items-center gap-2 cursor-pointer text-sm">
              <Archive className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mostrar Arquivados</span>
              <span className="sm:hidden">Arquivados</span>
            </Label>
          </div>
        </div>

        {/* Estatísticas - Grid Responsivo */}
        <div className="w-full">
          <StatsCards stats={stats} />
        </div>

        {/* Filtros - Tabs Responsivos */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Tabs value={treatmentFilter} onValueChange={(v) => setTreatmentFilter(v as any)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="facetas" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Facetas</span>
                <span className="sm:hidden">Fac</span>
              </TabsTrigger>
              <TabsTrigger value="clareamento" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clareamento</span>
                <span className="sm:hidden">Cla</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Busca e Filtros de Status */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 sm:pl-10"
              />
            </div>
          </div>

          <BudgetFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tabela - Container com overflow responsivo */}
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <BudgetTable
              budgets={filteredBudgets}
              onView={handleView}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onCreateOpportunity={handleCreateOpportunity}
            />
          )}
        </div>

        {/* Modal de detalhes */}
        <BudgetDetailModal
          budgetId={detailBudgetId}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />

        {/* Modal de formulário */}
        <BudgetFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedBudget(null);
          }}
          budget={selectedBudget}
          onSave={handleSaveBudget}
        />

        {/* Dialog de criar oportunidade */}
        <CreateOpportunityDialog
          open={isOpportunityDialogOpen}
          onClose={() => {
            setIsOpportunityDialogOpen(false);
            setOpportunityBudget(null);
          }}
          onConfirm={handleConfirmCreateOpportunity}
          budget={opportunityBudget}
          existingLead={existingLead}
        />
    </div>
  );
};
