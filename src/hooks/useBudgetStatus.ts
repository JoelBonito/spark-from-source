import { useState } from 'react';
import { updateBudgetStatus, Budget } from '@/services/budgetService';

export function useBudgetStatus() {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (id: string, status: Budget['status']) => {
    try {
      setLoading(true);
      const updatedBudget = await updateBudgetStatus(id, status);
      return updatedBudget;
    } catch (error) {
      console.error('Error updating budget status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStatus,
    loading
  };
}
