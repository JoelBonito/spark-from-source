import { useState, useEffect } from 'react';
import { getPipelineMetrics } from '@/services/pipelineService';

interface PipelineMetrics {
  totalLeads: number;
  inNegotiation: number;
  conversionRate: number;
  potentialRevenue: number;
}

export function usePipelineMetrics() {
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    totalLeads: 0,
    inNegotiation: 0,
    conversionRate: 0,
    potentialRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getPipelineMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return {
    ...metrics,
    loading,
    refresh: loadMetrics
  };
}
