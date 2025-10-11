import { useState } from 'react';
import Layout from '@/components/Layout';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { usePipelineMetrics } from '@/hooks/usePipelineMetrics';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { Lead } from '@/services/leadService';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, TrendingUp, DollarSign, Target, Sparkles, Smile } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function CRM() {
  const { leadsByStage, loading, moveLeadToStage, refresh } = useKanbanBoard();
  const { totalLeads, inNegotiation, conversionRate, potentialRevenue } = usePipelineMetrics();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'facetas' | 'clareamento'>('all');

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    refresh();
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
    <Layout>
      <div className="space-y-6">
        {/* Header com Filtro */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CRM - Funil de Vendas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus leads desde a simulação até o fechamento
            </p>
          </div>

          {/* FASE 7: Filtro por tipo de tratamento */}
          <Tabs value={treatmentFilter} onValueChange={(v) => setTreatmentFilter(v as typeof treatmentFilter)}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="facetas" className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Facetas
              </TabsTrigger>
              <TabsTrigger value="clareamento" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Clareamento
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          />
        )}

        {/* Modal de Detalhes */}
        <LeadDetailModal
          leadId={selectedLead?.id || null}
          isOpen={!!selectedLead}
          onClose={handleCloseModal}
        />
      </div>
    </Layout>
  );
}
