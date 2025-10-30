import { Users, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SimulationsChart } from '@/components/dashboard/SimulationsChart';
import { LatestSimulations } from '@/components/dashboard/LatestSimulations';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar dados do dashboard. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total de Pacientes"
          value={stats?.totalPatients?.toString() || '0'}
          colorClass="bg-primary/10 text-primary"
        />
        <MetricCard
          icon={FileText}
          label="Simulações Realizadas"
          value={stats?.totalSimulations?.toString() || '0'}
          colorClass="bg-sky-500/10 text-sky-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Taxa de Conversão"
          value={`${stats?.conversionRate || 0}%`}
          colorClass="bg-green-500/10 text-green-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Receita Potencial"
          value={`R$ ${stats?.potentialRevenue?.toLocaleString('pt-BR') || '0'}`}
          colorClass="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Charts and Latest Simulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimulationsChart data={stats?.simulationsByMonth || []} />
        <LatestSimulations 
          simulations={stats?.latestSimulations || []} 
          loading={loading}
        />
      </div>
    </div>
  );
}
