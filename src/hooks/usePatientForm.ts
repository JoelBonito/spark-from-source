import { useState } from 'react';
import { createPatient, updatePatient, CreatePatientData, UpdatePatientData } from '@/services/patientService';

export function usePatientForm() {
  const [saving, setSaving] = useState(false);

  const create = async (data: CreatePatientData) => {
    try {
      setSaving(true);
      const patient = await createPatient(data);
      return patient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, data: UpdatePatientData) => {
    try {
      setSaving(true);
      const patient = await updatePatient(id, data);
      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    createPatient: create,
    updatePatient: update
  };
}
