import { useState, useEffect } from 'react';
import { getAllLeads, deleteLead, Lead } from '@/services/leadService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

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
