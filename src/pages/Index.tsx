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
        <div>
          <h1 className="text-4xl font-display font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-base">Visão geral do seu consultório</p>
        </div>
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
      <div className="space-y-8 animate-fade-in">
        <div>
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-6 w-96 mt-3 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold gradient-text tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-base">Visão geral do seu consultório</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Total de Pacientes"
          value={stats?.totalPatients?.toString() || '0'}
          colorClass="bg-primary/10 text-primary"
          change={12.5}
          delay={0}
        />
        <MetricCard
          icon={FileText}
          label="Simulações Realizadas"
          value={stats?.totalSimulations?.toString() || '0'}
          colorClass="bg-accent-blue/10 text-accent-blue"
          change={8.3}
          delay={0.1}
        />
        <MetricCard
          icon={TrendingUp}
          label="Taxa de Conversão"
          value={`${stats?.conversionRate || 0}%`}
          colorClass="bg-success/10 text-success"
          change={5.7}
          delay={0.2}
        />
        <MetricCard
          icon={DollarSign}
          label="Receita Potencial"
          value={`R$ ${stats?.potentialRevenue?.toLocaleString('pt-BR') || '0'}`}
          colorClass="bg-warning/10 text-warning"
          change={15.2}
          delay={0.3}
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
