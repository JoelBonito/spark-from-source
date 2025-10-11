import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetStatus } from '@/hooks/useBudgetStatus';
import { BudgetTable } from '@/components/BudgetTable';
import { BudgetDetailModal } from '@/components/BudgetDetailModal';
import { BudgetFilters } from '@/components/BudgetFilters';
import { StatsCards } from '@/components/StatsCards';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Budget } from '@/services/budgetService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Budgets = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'facetas' | 'clareamento'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailBudgetId, setDetailBudgetId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filters = {
    status: activeTab,
    search: searchQuery
  };

  const { budgets, stats, loading, refresh } = useBudgets(filters);
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
        <div>
          <h2 className="text-3xl font-bold text-foreground">Orçamentos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os orçamentos gerados
          </p>
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
          />
        )}

        {/* Modal de detalhes */}
        <BudgetDetailModal
          budgetId={detailBudgetId}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      </div>
    </Layout>
  );
};
