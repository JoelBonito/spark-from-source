import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Activity, TrendingUp, DollarSign, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/utils/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar dados do dashboard</AlertDescription>
      </Alert>
    );
  }

  const COLORS = ['hsl(var(--muted))', 'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-2))'];

  const funnelData = [
    { name: 'Novo Lead', value: stats.funnelDistribution.novo_lead },
    { name: 'Qualificação', value: stats.funnelDistribution.qualificacao },
    { name: 'Conversão', value: stats.funnelDistribution.conversao },
    { name: 'Fidelização', value: stats.funnelDistribution.fidelizacao }
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Users}
            label="Total de Pacientes"
            value={stats.totalPatients.toString()}
            colorClass="bg-primary/10 text-primary"
          />
          <MetricCard
            icon={Activity}
            label="Simulações (Mês)"
            value={stats.simulationsMonth.toString()}
            colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
          <MetricCard
            icon={TrendingUp}
            label="Taxa de Conversão"
            value={`${stats.conversionRate.toFixed(1)}%`}
            colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
          />
          <MetricCard
            icon={DollarSign}
            label="Ticket Médio"
            value={formatCurrency(stats.avgTicket)}
            colorClass="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          />
        </div>

        {/* Cards de Receita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Receita Potencial</h3>
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(stats.potentialRevenue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stats.totalBudgets} orçamentos gerados</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Receita Confirmada</h3>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.confirmedRevenue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stats.acceptedBudgets} orçamentos aceitos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha - Simulações */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Simulações (Últimos 30 dias)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.simulationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Funil */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Distribuição no Funil</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Resumo Rápido
            </h3>
            <div className="space-y-3">
              <AlertItem 
                type="success" 
                text={`${stats.totalPatients} pacientes cadastrados`} 
              />
              <AlertItem 
                type="info" 
                text={`${stats.simulationsMonth} simulações realizadas este mês`} 
              />
              {stats.conversionRate > 0 && (
                <AlertItem 
                  type="warning" 
                  text={`Taxa de conversão: ${stats.conversionRate.toFixed(1)}%`} 
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass: string;
}

function MetricCard({ icon: Icon, label, value, colorClass }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  type: 'warning' | 'info' | 'success';
  text: string;
}

function AlertItem({ type, text }: AlertItemProps) {
  const variants = {
    warning: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-500/20',
    success: 'bg-green-500/10 text-green-800 dark:text-green-400 border-green-500/20'
  };

  return (
    <div className={`p-3 rounded-lg border ${variants[type]}`}>
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}
