import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, DollarSign, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PDFViewerModal } from '@/components/PDFViewerModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Simulation {
  id: string;
  created_at: string;
  patient_name: string;
  patient_phone?: string;
  treatment_type: 'facetas' | 'clareamento';
  original_image_url: string;
  processed_image_url: string;
  status: string;
  teeth_count?: number;
  technical_report_url?: string;
  budget_pdf_url?: string;
}

export default function SimulationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchSimulation = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('simulations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setSimulation(data as Simulation);
        }
      } catch (error) {
        console.error('Erro ao buscar simulação:', error);
        toast.error('Erro ao carregar simulação');
      } finally {
        setLoading(false);
      }
    };

    fetchSimulation();
  }, [id]);

  const handleNewSimulation = () => {
    navigate('/simulator');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Simulação não encontrada</p>
        <Button onClick={() => navigate('/simulator')}>
          Voltar para Simulador
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/simulations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Simulação Concluída</h1>
            <p className="text-muted-foreground mt-1">
              {simulation.patient_name} • {format(new Date(simulation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Badge className="capitalize">{simulation.treatment_type}</Badge>
      </div>

      {/* Imagens Antes e Depois */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-center">Antes</CardTitle>
          </CardHeader>
          <CardContent>
            {simulation.original_image_url ? (
              <img
                src={simulation.original_image_url}
                alt="Antes"
                className="w-full h-auto rounded-lg border"
              />
            ) : (
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                <p className="text-muted-foreground">Imagem não disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-center">Depois</CardTitle>
          </CardHeader>
          <CardContent>
            {simulation.processed_image_url ? (
              <img
                src={simulation.processed_image_url}
                alt="Depois"
                className="w-full h-auto rounded-lg border"
              />
            ) : (
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                <p className="text-muted-foreground">Imagem não disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações da Simulação */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Informações da Simulação</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="font-medium">{simulation.patient_name}</p>
          </div>
          {simulation.patient_phone && (
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{simulation.patient_phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Tratamento</p>
            <p className="font-medium capitalize">{simulation.treatment_type}</p>
          </div>
          {simulation.teeth_count && (
            <div>
              <p className="text-sm text-muted-foreground">Quantidade de Dentes</p>
              <p className="font-medium">{simulation.teeth_count}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Data da Simulação</p>
            <p className="font-medium">
              {format(new Date(simulation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline" className="capitalize">{simulation.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Documentos e Ações</CardTitle>
          <CardDescription>Visualize os documentos gerados ou crie uma nova simulação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            {simulation.technical_report_url ? (
              <Button
                onClick={() => setShowReportModal(true)}
                className="w-full"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Relatório Técnico
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                disabled
              >
                <FileText className="h-5 w-5 mr-2" />
                Relatório Indisponível
              </Button>
            )}

            {simulation.budget_pdf_url ? (
              <Button
                onClick={() => setShowBudgetModal(true)}
                className="w-full"
                size="lg"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Orçamento
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                disabled
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Orçamento Indisponível
              </Button>
            )}

            <Button
              onClick={handleNewSimulation}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Nova Simulação
            </Button>
          </div>

          {(!simulation.technical_report_url || !simulation.budget_pdf_url) && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              {!simulation.technical_report_url && !simulation.budget_pdf_url
                ? 'Os documentos ainda não foram gerados para esta simulação.'
                : 'Alguns documentos não estão disponíveis para esta simulação.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modais de PDF */}
      {simulation.technical_report_url && (
        <PDFViewerModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          pdfUrl={simulation.technical_report_url}
          title="Relatório Técnico"
        />
      )}

      {simulation.budget_pdf_url && (
        <PDFViewerModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          pdfUrl={simulation.budget_pdf_url}
          title="Orçamento"
        />
      )}
    </div>
  );
}
