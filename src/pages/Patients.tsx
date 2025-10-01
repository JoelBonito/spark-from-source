import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { usePatientForm } from '@/hooks/usePatientForm';
import { PatientTable } from '@/components/PatientTable';
import { PatientModal } from '@/components/PatientModal';
import { PatientDetailModal } from '@/components/PatientDetailModal';
import { Patient, deletePatient, searchPatients, getPatientStats } from '@/services/patientService';
import { PatientFormData } from '@/utils/patientValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { patients, loading, refresh } = usePatients();
  const { saving, createPatient, updatePatient } = usePatientForm();
  
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<Patient | null>(null);
  const [stats, setStats] = useState({ total: 0, withSimulations: 0, newThisMonth: 0 });

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  useEffect(() => {
    loadStats();
  }, [patients]);

  const loadStats = async () => {
    try {
      const data = await getPatientStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPatients(patients);
      return;
    }

    try {
      const results = await searchPatients(query);
      setFilteredPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleView = (patient: Patient) => {
    setDetailPatientId(patient.id);
    setIsDetailModalOpen(true);
  };

  const handleNewSimulation = (patient: Patient) => {
    navigate('/', { state: { selectedPatient: patient } });
  };

  const handleSave = async (data: PatientFormData) => {
    try {
      if (selectedPatient) {
        await updatePatient(selectedPatient.id, data);
        toast({
          title: 'Sucesso',
          description: 'Paciente atualizado com sucesso',
        });
      } else {
        // Garantir que nome e telefone estão presentes
        if (!data.name || !data.phone) {
          toast({
            title: 'Erro',
            description: 'Nome e telefone são obrigatórios',
            variant: 'destructive',
          });
          return;
        }
        await createPatient({
          name: data.name,
          phone: data.phone,
          email: data.email,
          birth_date: data.birth_date,
          address: data.address,
          notes: data.notes,
        });
        toast({
          title: 'Sucesso',
          description: 'Paciente criado com sucesso',
        });
      }
      refresh();
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar paciente',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmPatient) return;

    try {
      await deletePatient(deleteConfirmPatient.id);
      toast({
        title: 'Sucesso',
        description: 'Paciente deletado com sucesso',
      });
      refresh();
      setDeleteConfirmPatient(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar paciente',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Pacientes</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus pacientes
          </p>
        </div>
        <Button onClick={handleNewPatient} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Com Simulações</p>
              <p className="text-2xl font-bold text-foreground">{stats.withSimulations}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Novos Este Mês</p>
              <p className="text-2xl font-bold text-foreground">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-card rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <PatientTable
          patients={filteredPatients}
          onEdit={handleEdit}
          onDelete={(patient) => setDeleteConfirmPatient(patient)}
          onView={handleView}
          onNewSimulation={handleNewSimulation}
        />
      )}

      {/* Modais */}
      <PatientModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <PatientDetailModal
        patientId={detailPatientId}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Confirmação de Delete */}
      <AlertDialog
        open={!!deleteConfirmPatient}
        onOpenChange={() => setDeleteConfirmPatient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o paciente <strong>{deleteConfirmPatient?.name}</strong>?
              {deleteConfirmPatient?.simulations_count ? (
                <span className="block mt-2 text-destructive">
                  Este paciente possui {deleteConfirmPatient.simulations_count} simulações associadas.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
