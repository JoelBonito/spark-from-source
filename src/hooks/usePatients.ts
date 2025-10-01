import { useState, useEffect } from 'react';
import { getAllPatients, Patient } from '@/services/patientService';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  return {
    patients,
    loading,
    error,
    refresh: loadPatients
  };
}
