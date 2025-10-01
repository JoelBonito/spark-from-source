import { useState, useEffect } from 'react';
import { getAllLeads, Lead } from '@/services/leadService';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLeads();
      setLeads(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  return {
    leads,
    loading,
    error,
    refresh: loadLeads
  };
}
