import { useState, useEffect } from 'react';
import { getPatientsWithRelations, PatientWithRelations } from '@/services/patientService';

export function usePatients(showArchived: boolean = false) {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientsWithRelations(showArchived);
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
  }, [showArchived]);

  return {
    patients,
    loading,
    error,
    refresh: loadPatients
  };
}
