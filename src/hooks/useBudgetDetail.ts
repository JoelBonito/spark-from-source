import { useState, useEffect } from 'react';
import { getBudgetById, Budget } from '@/services/budgetService';

export function useBudgetDetail(budgetId: string | null) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!budgetId) {
      setBudget(null);
      return;
    }

    const loadBudgetDetail = async () => {
      try {
        setLoading(true);
        const data = await getBudgetById(budgetId);
        setBudget(data);
      } catch (err) {
        console.error('Error loading budget detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetDetail();
  }, [budgetId]);

  return {
    budget,
    loading
  };
}
