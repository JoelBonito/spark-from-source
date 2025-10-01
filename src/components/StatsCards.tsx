import React from 'react';
import { FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    accepted: number;
    conversionRate: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Orçamentos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aceitos</p>
            <p className="text-2xl font-bold text-foreground">{stats.accepted}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-foreground">{stats.conversionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
