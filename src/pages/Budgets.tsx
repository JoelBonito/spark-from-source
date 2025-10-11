import React, { useState } from 'react';
import { Search, Sparkles, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetStatus } from '@/hooks/useBudgetStatus';
import { BudgetTable } from '@/components/BudgetTable';
import { BudgetDetailModal } from '@/components/BudgetDetailModal';
import { BudgetFilters } from '@/components/BudgetFilters';
import { StatsCards } from '@/components/StatsCards';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Budget } from '@/services/budgetService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetFormModal } from '@/components/BudgetFormModal';
import { createManualBudget } from '@/services/budgetService';

export const Budgets = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'facetas' | 'clareamento'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailBudgetId, setDetailBudgetId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filters = {
    status: activeTab,
    search: searchQuery
  };

  const { budgets, stats, loading, refresh, updateBudget, archiveBudget } = useBudgets(filters);
  const { updateStatus } = useBudgetStatus();

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
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Orçamentos</h2>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os orçamentos gerados
            </p>
          </div>
          <Button onClick={handleNewBudget} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>

        {/* Estatísticas */}
        <StatsCards stats={stats} />

        {/* Filtro por tipo de tratamento */}
        <Tabs value={treatmentFilter} onValueChange={(v) => setTreatmentFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todos
            </TabsTrigger>
            <TabsTrigger value="facetas">
              <Sparkles className="w-4 h-4 mr-2" />
              Facetas
            </TabsTrigger>
            <TabsTrigger value="clareamento">
              <Sparkles className="w-4 h-4 mr-2" />
              Clareamento
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número ou paciente..."
                className="pl-10"
              />
            </div>
          </div>

          <BudgetFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tabela */}
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
          />
        )}

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
      </div>
    </Layout>
  );
};
