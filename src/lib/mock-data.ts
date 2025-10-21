export const mockPatients = [
  { id: '1', name: 'Maria Silva', email: 'maria@example.com', phone: '11999999999', created_at: new Date().toISOString() },
  { id: '2', name: 'João Santos', email: 'joao@example.com', phone: '11988888888', created_at: new Date().toISOString() },
  { id: '3', name: 'Ana Costa', email: 'ana@example.com', phone: '11977777777', created_at: new Date().toISOString() },
];

export const mockSimulations = [
  {
    id: '1',
    patient_name: 'Maria Silva',
    patient_id: '1',
    treatment_type: 'facetas',
    created_at: new Date().toISOString(),
    status: 'completed',
    original_image_url: '',
    processed_image_url: '',
    user_id: '1'
  },
  {
    id: '2',
    patient_name: 'João Santos',
    patient_id: '2',
    treatment_type: 'clareamento',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed',
    original_image_url: '',
    processed_image_url: '',
    user_id: '1'
  },
];

export const mockLeads = [
  { id: '1', name: 'Pedro Costa', stage: 'novo_lead', phone: '11977777777', email: 'pedro@example.com', created_at: new Date().toISOString(), user_id: '1' },
  { id: '2', name: 'Carla Lima', stage: 'qualificacao', phone: '11966666666', email: 'carla@example.com', created_at: new Date().toISOString(), user_id: '1' },
];

export const mockMetrics = {
  totalSimulations: 45,
  totalPatients: 32,
  conversionRate: 68,
  totalLeads: 12,
};

export const mockChartData = [
  { month: 'Jan', value: 12 },
  { month: 'Fev', value: 19 },
  { month: 'Mar', value: 15 },
  { month: 'Abr', value: 25 },
  { month: 'Mai', value: 22 },
  { month: 'Jun', value: 30 },
];
