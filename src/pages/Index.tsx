import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Zap, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import ComparisonView from "@/components/ComparisonView";
import { PatientSelector } from "@/components/PatientSelector";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { hasConfig, getConfig } from "@/utils/storage";
import { getTimestamp } from "@/utils/formatters";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { getPatientById } from "@/services/patientService";
import { usePatientForm } from "@/hooks/usePatientForm";
import { generateTechnicalReportPDF, generateReportNumber } from "@/services/technicalReportService";
import { useConfig } from "@/contexts/ConfigContext";

// Tipos simplificados
type SimulatorState = 'input' | 'processing' | 'completed';

interface AnalysisResult {
  success: boolean;
  relatorio_tecnico: string;
  orcamento: string;
  treatment_type: 'facetas' | 'clareamento';
  metadata?: {
    model?: string;
    timestamp?: string;
    run_id?: string;
  };
}

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPatient } = usePatientForm();
  const { config } = useConfig();

  // Estados principais
  const [currentState, setCurrentState] = useState<SimulatorState>('input');
  const [hasApiConfig, setHasApiConfig] = useState(false);
  const [simulationType, setSimulationType] = useState<'facetas' | 'clareamento'>('facetas');
  
  // Paciente
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  
  // Imagens
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // Análise e simulação
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  
  // Loading states
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [savingSimulation, setSavingSimulation] = useState(false);
  
  // PDFs
  const [budgetPdfUrl, setBudgetPdfUrl] = useState<string | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);
  const [showBudgetPdfModal, setShowBudgetPdfModal] = useState(false);
  const [showReportPdfModal, setShowReportPdfModal] = useState(false);

  // Auth e Config check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      hasConfig().then((exists) => {
        setHasApiConfig(exists);
        if (!exists) {
          navigate("/config");
        }
      });
    });

    const state = location.state as { selectedPatient?: any };
    if (state?.selectedPatient) {
      setSelectedPatientId(state.selectedPatient.id);
      setPatientName(state.selectedPatient.name);
      setPatientPhone(state.selectedPatient.phone || "");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  // Timer para loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentState === 'processing') {
      const startTime = Date.now();
      interval = setInterval(() => {
        setProcessingTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [currentState]);

  // Load patient data
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Função utilitária para converter URL para Base64
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao converter URL para Base64:', error);
      throw error;
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(patient.name);
        setPatientPhone(patient.phone || "");
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  };

  const handleQuickPatientCreate = async (data: { name: string; phone: string }) => {
    try {
      const patient = await createPatient(data);
      setSelectedPatientId(patient.id);
      setPatientName(patient.name);
      setPatientPhone(patient.phone);
      toast.success("Paciente criado com sucesso!");
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error("Erro ao criar paciente");
    }
  };

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setCurrentState('input');
  };

  // ═════════════════════════════════════════════════════════════════
  // FLUXO CORRIGIDO: GENERATE → ANALYZE
  // ═════════════════════════════════════════════════════════════════
  const handleProcessAndGenerate = async () => {
    if (!originalImage || !patientName) {
      toast.error("Preencha o nome do paciente e faça o upload da foto");
      return;
    }

    setCurrentState('processing');
    setProcessingTime(0);

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      // ========================================
      // FASE 1: GERAÇÃO DA IMAGEM (5-8 segundos)
      // ========================================
      setProcessingStep('Gerando simulação visual...');
      console.log('→ FASE 1: Gerando imagem simulada');

      const idempotencyKeyGenerate = `${currentUser.id}-${Date.now()}-generate`;
      
      const imageResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'generate',
          imageBase64: originalImage,
          treatment_type: simulationType,
          userId: currentUser.id,
          idempotencyKey: idempotencyKeyGenerate
        }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        
        if (errorData.code === 'MODULE_DISABLED') {
          toast.error('Módulo de Clareamento não ativado', {
            description: 'Ative em Configurações para usar este recurso'
          });
          setCurrentState('input');
          return;
        }
        
        if (errorData.code === 'DUPLICATE_REQUEST') {
          toast.info('Processamento já em andamento', {
            description: 'Aguarde a conclusão da geração anterior'
          });
          setCurrentState('input');
          return;
        }
        
        throw new Error(errorData.error || `Erro na geração: ${imageResponse.status}`);
      }

      const imageResult = await imageResponse.json();
      
      if (!imageResult.success || !imageResult.processedImageBase64) {
        throw new Error("Imagem simulada não foi gerada");
      }

      const processedImageBase64 = imageResult.processedImageBase64;
      console.log('✓ FASE 1: Imagem gerada com sucesso');

      // Atualizar estado imediatamente
      setProcessedImage(processedImageBase64);

      // Upload das imagens para storage
      const timestamp = getTimestamp();
      let originalUrl: string | null = null;
      let processedUrl: string | null = null;

      console.log('→ Fazendo upload das imagens...');

      // Upload imagem original
      const originalBlob = await (await fetch(originalImage)).blob();
      const originalFileName = `${currentUser.id}/original-${timestamp}.jpeg`;
      
      await supabase.storage
        .from('original-images')
        .upload(originalFileName, originalBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });
      
      const { data: { publicUrl: origUrl } } = supabase.storage
        .from('original-images')
        .getPublicUrl(originalFileName);
      
      originalUrl = origUrl;

      // Upload imagem processada
      const processedBlob = await (await fetch(processedImageBase64)).blob();
      const processedFileName = `${currentUser.id}/processed-${timestamp}.jpeg`;
      
      await supabase.storage
        .from('processed-images')
        .upload(processedFileName, processedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });
      
      const { data: { publicUrl: procUrl } } = supabase.storage
        .from('processed-images')
        .getPublicUrl(processedFileName);
      
      processedUrl = procUrl;
      
      console.log('✓ Upload concluído:', { originalUrl, processedUrl });

      // ========================================
      // FASE 2: ANÁLISE (ANTES/DEPOIS) (3-5 segundos)
      // ========================================
      setProcessingStep('Gerando relatório técnico e orçamento...');
      console.log('→ FASE 2: Analisando ANTES/DEPOIS');

      const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'analyze',
          beforeImageBase64: originalImage,
          afterImageBase64: processedImageBase64,
          treatment_type: simulationType,
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na análise: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      
      if (!analysisResult.success || !analysisResult.relatorio_tecnico || !analysisResult.orcamento) {
        throw new Error("Relatório ou orçamento não foram gerados");
      }

      console.log('✓ FASE 2: Análise concluída');
      console.log('  - Relatório técnico:', analysisResult.relatorio_tecnico.substring(0, 100) + '...');
      console.log('  - Orçamento:', analysisResult.orcamento.substring(0, 100) + '...');

      // Estruturar dados da análise
      const analysisData: AnalysisResult = {
        success: true,
        relatorio_tecnico: analysisResult.relatorio_tecnico,
        orcamento: analysisResult.orcamento,
        treatment_type: analysisResult.treatment_type || simulationType,
        metadata: analysisResult.metadata
      };

      setAnalysisData(analysisData);

      // ========================================
      // FASE 3: CRIAR SIMULAÇÃO NO BANCO
      // ========================================
      console.log('→ FASE 3: Salvando simulação no banco');

      const { data: simulation } = await supabase
        .from('simulations')
        .insert({
          user_id: currentUser.id,
          patient_id: selectedPatientId,
          patient_name: patientName,
          patient_phone: patientPhone || null,
          original_image_url: originalUrl,
          processed_image_url: processedUrl,
          technical_notes: analysisResult.relatorio_tecnico,
          treatment_type: simulationType,
          budget_data: {
            orcamento: analysisResult.orcamento,
            metadata: analysisResult.metadata,
          },
          status: 'completed',
        })
        .select()
        .single();

      const simulationId = simulation?.id || null;
      setCurrentSimulationId(simulationId);
      
      console.log('✓ FASE 3: Simulação salva:', simulationId);

      // ========================================
      // FASE 4: GERAR PDFs COM IMAGENS
      // ========================================
      setProcessingStep('Gerando documentos PDF...');
      console.log('→ FASE 4: Gerando PDFs');

      const reportNumber = generateReportNumber();
      const budgetNumber = generateBudgetNumber();

      // Converter imagens para Base64 para os PDFs
      const beforeImageBase64 = await urlToBase64(originalImage);
      const afterImageBase64 = await urlToBase64(processedImageBase64);

      // Gerar Relatório Técnico
      console.log('→ Gerando Relatório Técnico PDF...');
      const reportPdf = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: simulationType === 'facetas' ? 4 : 0,
        reportContent: analysisResult.relatorio_tecnico,
        simulationId: simulationId || '',
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64
      });
      
      console.log('✓ Relatório Técnico PDF gerado');

      // Gerar Orçamento
      console.log('→ Gerando Orçamento PDF...');
      const budgetPdf = await generateBudgetPDF({
        budgetNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        budgetContent: analysisResult.orcamento,
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64
      });
      
      console.log('✓ Orçamento PDF gerado');

      setReportPdfUrl(reportPdf);
      setBudgetPdfUrl(budgetPdf);

      // Atualizar simulação com os PDFs
      if (simulationId) {
        await supabase
          .from('simulations')
          .update({
            technical_report_url: reportPdf,
            budget_pdf_url: budgetPdf
          })
          .eq('id', simulationId);
        
        console.log('✓ FASE 4: PDFs salvos na simulação');
      }

      setCurrentState('completed');
      toast.success("Simulação concluída com sucesso!");
      console.log('✅ PROCESSO COMPLETO!');
      
    } catch (err) {
      console.error("❌ Erro ao processar:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(errorMessage);
      setCurrentState('input');
    }
  };

  const handleViewTechnicalReport = () => {
    if (reportPdfUrl) {
      setShowReportPdfModal(true);
    }
  };

  const handleViewBudget = () => {
    if (budgetPdfUrl) {
      setShowBudgetPdfModal(true);
    }
  };

  const handleSaveSimulation = async () => {
    if (!currentSimulationId || !patientName || !analysisData || !originalImage || !processedImage || !reportPdfUrl || !budgetPdfUrl) {
      toast.error("Dados insuficientes para salvar simulação");
      return;
    }

    setSavingSimulation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const reportNumber = generateReportNumber();
      const budgetNumber = generateBudgetNumber();

      // Atualizar status da simulação
      await supabase.from('simulations').update({
        status: 'saved'
      }).eq('id', currentSimulationId);

      // Salvar na tabela reports
      await supabase.from('reports').insert({
        simulation_id: currentSimulationId,
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        report_number: reportNumber,
        pdf_url: reportPdfUrl,
        before_image: originalImage,
        after_image: processedImage,
        treatment_type: simulationType
      });

      // Salvar na tabela budgets
      await supabase.from('budgets').insert({
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        budget_number: budgetNumber,
        pdf_url: budgetPdfUrl,
        before_image: originalImage,
        after_image: processedImage,
        teeth_count: simulationType === 'facetas' ? 4 : 0,
        subtotal: 0,
        final_price: 0,
        price_per_tooth: 0,
        treatment_type: simulationType,
        payment_conditions: {
          tipo_tratamento: simulationType
        }
      });

      if (selectedPatientId) {
        await supabase.from('patients').update({
          last_simulation_date: new Date().toISOString()
        }).eq('id', selectedPatientId);
      }

      await supabase.from('crm_leads').insert({
        patient_id: selectedPatientId,
        simulation_id: currentSimulationId,
        user_id: user.id,
        patient_name: patientName,
        patient_phone: patientPhone || null,
        before_image: originalImage,
        after_image: processedImage,
        status: 'new',
        source: 'simulator',
        treatment_type: simulationType
      });

      toast.success("Simulação salva!");
      handleNewSimulation();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar simulação');
    } finally {
      setSavingSimulation(false);
    }
  };

  const handleNewSimulation = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setProcessingTime(0);
    setProcessingStep('');
    setCurrentState('input');
    setBudgetPdfUrl(null);
    setReportPdfUrl(null);
    setSelectedPatientId(null);
    setPatientName("");
    setPatientPhone("");
  };

  if (!hasApiConfig) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            TruSmile - Simulador de Sorriso
          </h1>
          <p className="text-muted-foreground">
            Transforme sorrisos com IA
          </p>
        </div>

        {/* TELA 1: INPUT (Dados + Upload) */}
        {currentState === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle>Nova Simulação</CardTitle>
              <CardDescription>Escolha o tipo de simulação e preencha os dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Tipo de Simulação */}
              {config?.whiteningSimulatorEnabled && (
                <div className="space-y-2">
                  <Label>Tipo de Simulação</Label>
                  <Tabs value={simulationType} onValueChange={(v) => setSimulationType(v as 'facetas' | 'clareamento')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="facetas">🦷 Facetas Dentárias</TabsTrigger>
                      <TabsTrigger 
                        value="clareamento"
                        disabled={!config?.whiteningSimulatorEnabled}
                      >
                        ✨ Clareamento Dental
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {/* Alert quando módulo desativado */}
                  {simulationType === 'clareamento' && !config?.whiteningSimulatorEnabled && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                      <p className="font-semibold text-destructive">Módulo desativado</p>
                      <p className="text-destructive-foreground">
                        Ative o simulador de clareamento em Configurações → Módulos do Sistema
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Seletor de Paciente */}
              <div className="space-y-2">
                <Label>Paciente</Label>
                <PatientSelector
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  onCreateNew={() => setShowQuickPatientForm(true)}
                />
              </div>

              {/* Dados do Paciente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome do Paciente *</Label>
                  <Input
                    id="patientName"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Telefone (opcional)</Label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label>Foto do Sorriso *</Label>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  currentImage={originalImage}
                  onClear={handleClearImage}
                  disabled={false}
                />
              </div>

              {/* Botão Processar */}
              <Button
                onClick={handleProcessAndGenerate}
                disabled={!patientName || !originalImage}
                size="lg"
                className="w-full"
              >
                <Zap className="h-5 w-5 mr-2" />
                Processar e Gerar Simulação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* LOADING: Processando */}
        {currentState === 'processing' && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
              <p className="text-xl font-medium mb-2">{processingStep}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Aguarde 8-15 segundos
              </p>
              {processingTime > 0 && (
                <div className="space-y-2">
                  <p className="text-lg font-mono text-muted-foreground">
                    {(processingTime / 1000).toFixed(1)}s
                  </p>
                  <div className="w-64 mx-auto bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((processingTime / 15000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TELA 2: RESULTADO */}
        {currentState === 'completed' && analysisData && processedImage && originalImage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulação Concluída</CardTitle>
                <CardDescription>Paciente: {patientName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comparação Antes/Depois */}
                <ComparisonView
                  beforeImage={originalImage}
                  afterImage={processedImage}
                  isProcessing={false}
                  processingTime={0}
                />

                {/* Botões de Documentos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleViewTechnicalReport}
                    disabled={!reportPdfUrl}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Relatório Técnico
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleViewBudget}
                    disabled={!budgetPdfUrl}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Orçamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSimulation}
                disabled={savingSimulation}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingSimulation ? 'Salvando...' : 'Salvar Simulação'}
              </Button>
            </div>
          </div>
        )}

        {/* Modais */}
        <QuickPatientForm
          isOpen={showQuickPatientForm}
          onClose={() => setShowQuickPatientForm(false)}
          onSave={handleQuickPatientCreate}
        />

        {budgetPdfUrl && (
          <PDFViewerModal
            isOpen={showBudgetPdfModal}
            onClose={() => setShowBudgetPdfModal(false)}
            pdfUrl={budgetPdfUrl}
            title="Orçamento"
          />
        )}

        {reportPdfUrl && (
          <PDFViewerModal
            isOpen={showReportPdfModal}
            onClose={() => setShowReportPdfModal(false)}
            pdfUrl={reportPdfUrl}
            title="Relatório Técnico"
          />
        )}
      </div>
    </Layout>
  );
}
