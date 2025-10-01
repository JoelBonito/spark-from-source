import { useState } from 'react';
import Layout from '@/components/Layout';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { usePipelineMetrics } from '@/hooks/usePipelineMetrics';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { Lead } from '@/services/leadService';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function CRM() {
  const { leadsByStage, loading, moveLeadToStage, refresh } = useKanbanBoard();
  const { totalLeads, inNegotiation, conversionRate, potentialRevenue } = usePipelineMetrics();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    refresh();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM - Funil de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads desde a simulação até o fechamento
          </p>
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

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <KanbanBoard
            leadsByStage={leadsByStage}
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
