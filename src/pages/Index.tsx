import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Zap, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  relatorio_tecnico?: string;
  orcamento?: string;
  analise_data?: any;
  metadata?: {
    total_chars?: number;
    finish_reason?: string;
    truncated?: boolean;
    model?: string;
    timestamp?: string;
  };
}

// ═════════════════════════════════════════════════════════════════
// CORREÇÃO 1: Helper para Construir Dados do Orçamento
// ═════════════════════════════════════════════════════════════════

function buildBudgetDataFromAnalysis(
  budgetNumber: string,
  patientName: string,
  patientPhone: string | undefined,
  beforeImage: string,
  afterImage: string,
  treatmentType: 'facetas' | 'clareamento'
) {
  // Orçamento fixo por tipo
  const itens = treatmentType === 'clareamento' 
    ? [
        {
          servico: 'Clareamento Dental Profissional',
          quantidade: 1,
          valor_unitario: 1200,
          valor_total: 1200
        },
        {
          servico: 'Consulta de Planejamento',
          quantidade: 1,
          valor_unitario: 150,
          valor_total: 150
        }
      ]
    : [
        {
          servico: 'Facetas em Resina Composta',
          quantidade: 4,
          valor_unitario: 600,
          valor_total: 2400
        },
        {
          servico: 'Clareamento Complementar',
          quantidade: 1,
          valor_unitario: 800,
          valor_total: 800
        },
        {
          servico: 'Consulta de Planejamento',
          quantidade: 1,
          valor_unitario: 150,
          valor_total: 150
        }
      ];

  const subtotal = itens.reduce((sum, item) => sum + item.valor_total, 0);
  const desconto_percentual = 10;
  const desconto_valor = subtotal * (desconto_percentual / 100);
  const total = subtotal - desconto_valor;

  return {
    budgetNumber,
    patientName,
    patientPhone,
    date: new Date(),
    itens,
    opcionais: [],
    subtotal,
    desconto_percentual,
    desconto_valor,
    total,
    beforeImage,
    afterImage
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
  const [analiseJSON, setAnaliseJSON] = useState<any>(null);
  
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

  const fetchActiveServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ Usuário não autenticado');
        return [];
      }

      const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar serviços:', error);
        return [];
      }

      console.log(`✅ ${services?.length || 0} serviços ativos encontrados`);
      return services || [];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
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

  // FLUXO UNIFICADO: Análise + Geração
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

      // ========================================
      // PASSO 1: ANÁLISE (mantém fluxo atual)
      // ========================================
      setProcessingStep('Analisando foto e gerando documentos...');
      
      const servicosAtivos = await fetchActiveServices();
      console.log('✓ Serviços ativos carregados:', servicosAtivos.length);
      
      const servicosParaEdge = servicosAtivos.map(s => ({
        name: s.name,
        category: s.category || 'outros',
        price: s.price
      }));
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const idempotencyKey = currentUser ? `${currentUser.id}-${Date.now()}-analyze` : undefined;
      
      const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'analyze',
          imageBase64: originalImage,
          servicos_ativos: servicosParaEdge,
          treatment_type: simulationType,
          idempotencyKey,
          userId: currentUser?.id,
          simulationId: null
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        
        if (errorData.code === 'MODULE_DISABLED') {
          toast.error('Módulo de clareamento desativado', {
            description: 'Ative em Configurações para usar este recurso'
          });
          setCurrentState('input');
          return;
        }
        
        if (errorData.code === 'DUPLICATE_REQUEST') {
          toast.info('Processamento já em andamento', {
            description: 'Aguarde a conclusão da análise anterior'
          });
          setCurrentState('input');
          return;
        }
        
        throw new Error(errorData.error || `Erro na análise: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      
      if (!analysisResult.success || !analysisResult.analise_data) {
        throw new Error("JSON de análise não encontrado na resposta");
      }

      const analiseJSON = analysisResult.analise_data;
      setAnaliseJSON(analiseJSON);
      
      console.log('📊 Análise JSON recebida:', analiseJSON);

      const analysisDataCompat: AnalysisResult = {
        success: true,
        analise_data: analiseJSON,
        metadata: analysisResult.metadata
      };
      
      setAnalysisData(analysisDataCompat);

      // Salvar simulação inicial
      const { data: { user } } = await supabase.auth.getUser();
      let simulationId: string | null = null;

      if (user) {
        const timestamp = getTimestamp();
        
        const fetchResponse = await fetch(originalImage);
        const blob = await fetchResponse.blob();
        const originalFileName = `${user.id}/original-${timestamp}.jpeg`;
        
        await supabase.storage
          .from('original-images')
          .upload(originalFileName, blob, {
            contentType: blob.type,
            upsert: true,
            cacheControl: '3600',
          });
        
        const { data: { publicUrl: originalUrl } } = supabase.storage
          .from('original-images')
          .getPublicUrl(originalFileName);

        const { data: simulation } = await supabase
          .from('simulations')
          .insert({
            user_id: user.id,
            patient_id: selectedPatientId,
            patient_name: patientName,
            patient_phone: patientPhone || null,
            original_image_url: originalUrl,
            technical_notes: JSON.stringify(analiseJSON),
            treatment_type: simulationType,
            status: 'analyzed',
          })
          .select()
          .single();

        simulationId = simulation.id;
        setCurrentSimulationId(simulationId);
      }

      // ========================================
      // PASSO 2: GERAÇÃO DE IMAGEM
      // ========================================
      setProcessingStep('Gerando simulação visual...');

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
          config: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          },
        }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na geração: ${imageResponse.status}`);
      }

      const imageResult = await imageResponse.json();
      const processedImageBase64 = imageResult.processedImageBase64;

      // Upload da imagem processada
      let processedImageUrl: string | null = null;
      
      if (user && simulationId) {
        const timestamp = getTimestamp();
        const fetchResponse = await fetch(processedImageBase64);
        const blob = await fetchResponse.blob();
        const processedFileName = `${user.id}/processed-${timestamp}.jpeg`;
        
        await supabase.storage
          .from('processed-images')
          .upload(processedFileName, blob, {
            contentType: blob.type,
            upsert: true,
            cacheControl: '3600',
          });
        
        const { data: { publicUrl } } = supabase.storage
          .from('processed-images')
          .getPublicUrl(processedFileName);

        console.log('✓ Imagem processada salva:', publicUrl);
        processedImageUrl = publicUrl;
        
        await supabase
          .from('simulations')
          .update({
            processed_image_url: processedImageUrl,
            status: 'completed',
          })
          .eq('id', simulationId);
      }

      setProcessedImage(processedImageUrl);

      // ========================================
      // PASSO 3: GERAR PDFs
      // ========================================
      setProcessingStep('Gerando documentos com imagens...');

      const reportNumber = generateReportNumber();
      const budgetNumber = generateBudgetNumber();

      const beforeImageBase64 = originalImage ? await urlToBase64(originalImage) : '';
      const afterImageBase64 = processedImageUrl ? await urlToBase64(processedImageUrl) : '';

      // Gerar Relatório Técnico
      console.log('→ Gerando Relatório Técnico PDF...');
      const reportContent = JSON.stringify(analiseJSON, null, 2);
      
      const reportPdf = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: analiseJSON?.analise?.decisao_clinica?.quantidade_facetas || 0,
        reportContent,
        simulationId: simulationId || currentSimulationId || '',
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64
      });
      
      console.log('✓ Relatório Técnico PDF gerado:', reportPdf);

      // ═════════════════════════════════════════════════════════════════
      // CORREÇÃO 2: Usar Helper para Construir Dados do Orçamento
      // ═════════════════════════════════════════════════════════════════
      
      console.log('→ Gerando Orçamento PDF...');
      const budgetData = buildBudgetDataFromAnalysis(
        budgetNumber,
        patientName,
        patientPhone,
        beforeImageBase64,
        afterImageBase64,
        simulationType
      );

      const budgetPdf = await generateBudgetPDF(budgetData);
      console.log('✓ Orçamento PDF gerado:', budgetPdf);

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
      }

      setCurrentState('completed');
      toast.success("Simulação concluída com sucesso!");
      
    } catch (err) {
      console.error("Erro ao processar:", err);
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

      await supabase.from('simulations').update({
        status: 'saved'
      }).eq('id', currentSimulationId);

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

      const budgetDataForDB = buildBudgetDataFromAnalysis(
        budgetNumber,
        patientName,
        patientPhone,
        originalImage,
        processedImage,
        simulationType
      );

      await supabase.from('budgets').insert({
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        budget_number: budgetNumber,
        pdf_url: budgetPdfUrl,
        before_image: originalImage,
        after_image: processedImage,
        teeth_count: analiseJSON?.analise?.decisao_clinica?.quantidade_facetas || 0,
        subtotal: budgetDataForDB.subtotal,
        final_price: budgetDataForDB.total,
        price_per_tooth: 0,
        treatment_type: simulationType,
        payment_conditions: {
          desconto: budgetDataForDB.desconto_percentual,
          opcao_vista: budgetDataForDB.total,
          analise: analiseJSON
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
    setAnaliseJSON(null);
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
                <ComparisonView
                  beforeImage={originalImage}
                  afterImage={processedImage}
                  isProcessing={false}
                  processingTime={0}
                />

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
