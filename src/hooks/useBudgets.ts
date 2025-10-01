import { useState, useEffect } from 'react';
import { getAllBudgets, getBudgetStats, Budget, BudgetFilters } from '@/services/budgetService';

export function useBudgets(filters?: BudgetFilters) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const [budgetsData, statsData] = await Promise.all([
        getAllBudgets(filters),
        getBudgetStats()
      ]);
      setBudgets(budgetsData);
      setStats(statsData);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [JSON.stringify(filters)]);

  return {
    budgets,
    stats,
    loading,
    error,
    refresh: loadBudgets
  };
}
