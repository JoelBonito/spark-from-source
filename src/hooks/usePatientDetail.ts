import { useState, useEffect } from 'react';
import { getPatientById, getPatientSimulations, Patient } from '@/services/patientService';

export function usePatientDetail(patientId: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      setSimulations([]);
      return;
    }

    const loadPatientDetail = async () => {
      try {
        setLoading(true);
        const [patientData, simulationsData] = await Promise.all([
          getPatientById(patientId),
          getPatientSimulations(patientId)
        ]);
        setPatient(patientData);
        setSimulations(simulationsData);
      } catch (err) {
        console.error('Error loading patient detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientDetail();
  }, [patientId]);

  return {
    patient,
    simulations,
    loading
  };
}
