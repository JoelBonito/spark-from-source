import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BudgetFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BudgetFilters: React.FC<BudgetFiltersProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="bg-muted">
        <TabsTrigger value="all">Todos</TabsTrigger>
        <TabsTrigger value="pending">Pendentes</TabsTrigger>
        <TabsTrigger value="sent">Enviados</TabsTrigger>
        <TabsTrigger value="accepted">Aceitos</TabsTrigger>
        <TabsTrigger value="rejected">Recusados</TabsTrigger>
        <TabsTrigger value="expired">Expirados</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
