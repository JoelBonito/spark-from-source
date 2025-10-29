import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, TrendingUp, Calendar, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { usePatientForm } from '@/hooks/usePatientForm';
import { PatientTable } from '@/components/PatientTable';
import { PatientModal } from '@/components/PatientModal';
import { PatientDetailModal } from '@/components/PatientDetailModal';
import { ComparisonViewModal } from '@/components/ComparisonViewModal';
import { TechnicalReportDialog } from '@/components/TechnicalReportDialog';
import { BudgetDetailModal } from '@/components/BudgetDetailModal';
import { BudgetFormModal } from '@/components/BudgetFormModal';
import { PatientWithRelations, deletePatient, searchPatients, getPatientStats, archivePatient } from '@/services/patientService';
import { updateBudget } from '@/services/budgetService';
import type { Budget } from '@/services/budgetService';
import { PatientFormData } from '@/utils/patientValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [showArchived, setShowArchived] = useState(false);
  const { patients, loading, refresh } = usePatients(showArchived);
  const { saving, createPatient, updatePatient } = usePatientForm();

  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<PatientWithRelations | null>(null);
  const [stats, setStats] = useState({ total: 0, withSimulations: 0, newThisMonth: 0 });

  // Estados para modais de visualização
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    beforeImage: string;
    afterImage: string;
    patientName: string;
  } | null>(null);

  const [technicalReportModal, setTechnicalReportModal] = useState<{
    isOpen: boolean;
    data: any;
    patientName: string;
  } | null>(null);

  const [budgetDetailModal, setBudgetDetailModal] = useState<{
    isOpen: boolean;
    budgetId: string;
  } | null>(null);

  const [budgetFormModal, setBudgetFormModal] = useState<{
    isOpen: boolean;
    budget: Budget;
    patientName: string;
  } | null>(null);

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

  const handleEdit = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleView = (patient: PatientWithRelations) => {
    setDetailPatientId(patient.id);
    setIsDetailModalOpen(true);
  };

  const handleNewSimulation = (patient: PatientWithRelations) => {
    navigate('/', { state: { selectedPatient: patient } });
  };

  const handleEditFromDetail = (patientId: string) => {
    setIsDetailModalOpen(false);
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      setIsModalOpen(true);
    }
  };

  const handleNewSimulationFromDetail = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      navigate('/simulator', { state: { selectedPatient: patient } });
    }
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

  const handleViewComparison = (patient: PatientWithRelations) => {
    if (!patient.latest_simulation?.original_image_url || 
        !patient.latest_simulation?.processed_image_url) {
      toast({
        title: 'Aviso',
        description: 'Este paciente não possui imagens de simulação',
        variant: 'destructive'
      });
      return;
    }

    setComparisonModal({
      isOpen: true,
      beforeImage: patient.latest_simulation.original_image_url,
      afterImage: patient.latest_simulation.processed_image_url,
      patientName: patient.name
    });
  };

  const handleViewTechnicalReport = (patient: PatientWithRelations) => {
    if (!patient.latest_simulation?.technical_notes) {
      toast({
        title: 'Aviso',
        description: 'Este paciente não possui relatório técnico',
        variant: 'destructive'
      });
      return;
    }

    let parsedData;
    try {
      if (typeof patient.latest_simulation.technical_notes === 'string') {
        // Tenta fazer parse como JSON
        try {
          parsedData = JSON.parse(patient.latest_simulation.technical_notes);
        } catch {
          // String simples - não é relatório completo
          toast({
            title: 'Relatório não disponível',
            description: 'Relatório técnico não está disponível para esta simulação',
            variant: 'destructive'
          });
          return;
        }
      } else {
        parsedData = patient.latest_simulation.technical_notes;
      }
      
      // Validar estrutura completa
      if (!parsedData?.analise_resumo || !parsedData?.valores || !parsedData?.relatorio_tecnico) {
        toast({
          title: 'Dados incompletos',
          description: 'Os dados do relatório técnico estão incompletos',
          variant: 'destructive'
        });
        return;
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao processar relatório técnico',
        variant: 'destructive'
      });
      return;
    }

    setTechnicalReportModal({
      isOpen: true,
      data: parsedData,
      patientName: patient.name
    });
  };

  const handleViewBudget = (patient: PatientWithRelations) => {
    if (!patient.latest_budget) {
      toast({
        title: 'Aviso',
        description: 'Este paciente não possui orçamento',
        variant: 'destructive'
      });
      return;
    }

    setBudgetDetailModal({
      isOpen: true,
      budgetId: patient.latest_budget.id
    });
  };

  const handleEditBudget = async (patient: PatientWithRelations) => {
    if (!patient.latest_budget) {
      toast({
        title: 'Aviso',
        description: 'Este paciente não possui orçamento',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', patient.latest_budget.id)
        .single();

      if (error) throw error;

      setBudgetFormModal({
        isOpen: true,
        budget: data as Budget,
        patientName: patient.name
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar orçamento',
        variant: 'destructive'
      });
    }
  };

  const handleArchivePatient = async (patient: PatientWithRelations) => {
    try {
      await archivePatient(patient.id);
      toast({
        title: 'Sucesso',
        description: 'Paciente arquivado com sucesso',
      });
      refresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar paciente',
        variant: 'destructive',
      });
    }
  };

  const handleSaveBudget = async (data: any) => {
    if (!budgetFormModal) return;

    try {
      const itemsWithTotals = data.items.map((item: any) => ({
        ...item,
        valor_total: item.quantidade * item.valor_unitario
      }));

      const subtotal = itemsWithTotals.reduce((sum: number, item: any) => 
        sum + item.valor_total, 0);
      const discountAmount = subtotal * (data.discount / 100);
      const finalPrice = subtotal - discountAmount;

      await updateBudget(budgetFormModal.budget.id, {
        items: itemsWithTotals,
        subtotal,
        discount_percentage: data.discount,
        discount_amount: discountAmount,
        final_price: finalPrice,
        treatment_type: data.treatment_type
      });

      toast({
        title: 'Sucesso',
        description: 'Orçamento atualizado com sucesso!'
      });

      setBudgetFormModal(null);
      refresh();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar orçamento',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
        {/* Header - Botão de ação */}
        <div className="flex items-center justify-between gap-4">
          <Button onClick={handleNewPatient} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Paciente</span>
            <span className="sm:hidden">Novo</span>
          </Button>

          {/* Toggle para mostrar arquivados */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch
              id="show-archived-patients"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived-patients" className="flex items-center gap-2 cursor-pointer text-sm">
              <Archive className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mostrar Arquivados</span>
              <span className="sm:hidden">Arquivados</span>
            </Label>
          </div>
        </div>

        {/* Estatísticas - Grid Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de Pacientes</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Com Simulações</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.withSimulations}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Novos Este Mês</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.newThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Busca - Responsivo */}
        <div className="bg-card rounded-lg border p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-9 sm:pl-10"
            />
          </div>
        </div>

        {/* Tabela - Container com overflow responsivo */}
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
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
            onViewComparison={handleViewComparison}
            onViewBudget={handleViewBudget}
            onEditBudget={handleEditBudget}
            onViewTechnicalReport={handleViewTechnicalReport}
            onArchive={handleArchivePatient}
          />
        )}
        </div>

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
          onEdit={handleEditFromDetail}
          onNewSimulation={handleNewSimulationFromDetail}
        />

        {/* Modais de Visualização */}
        {comparisonModal && (
          <ComparisonViewModal
            isOpen={comparisonModal.isOpen}
            onClose={() => setComparisonModal(null)}
            beforeImage={comparisonModal.beforeImage}
            afterImage={comparisonModal.afterImage}
            patientName={comparisonModal.patientName}
          />
        )}

        {technicalReportModal && (
          <TechnicalReportDialog
            open={technicalReportModal.isOpen}
            onOpenChange={(open) => !open && setTechnicalReportModal(null)}
            data={technicalReportModal.data}
            patientName={technicalReportModal.patientName}
            onDownloadPDF={() => {
              toast({
                title: 'Info',
                description: 'Download do relatório em desenvolvimento'
              });
            }}
          />
        )}

        {budgetDetailModal && (
          <BudgetDetailModal
            budgetId={budgetDetailModal.budgetId}
            isOpen={budgetDetailModal.isOpen}
            onClose={() => setBudgetDetailModal(null)}
          />
        )}

        {budgetFormModal && (
          <BudgetFormModal
            isOpen={budgetFormModal.isOpen}
            onClose={() => setBudgetFormModal(null)}
            budget={budgetFormModal.budget}
            onSave={handleSaveBudget}
          />
        )}

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
