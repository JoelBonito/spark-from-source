import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw, Zap, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import ComparisonView from "@/components/ComparisonView";
import { PatientSelector } from "@/components/PatientSelector";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { hasConfig, getConfig } from "@/utils/storage";
import { downloadImage } from "@/utils/imageProcessing";
import { getTimestamp } from "@/utils/formatters";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { getPatientById } from "@/services/patientService";
import { usePatientForm } from "@/hooks/usePatientForm";
import { generateTechnicalReportPDF, generateReportNumber } from "@/services/technicalReportService";

// Tipos
type SimulatorState = 'select_patient' | 'upload_photo' | 'analyzing' | 'analysis_ready' | 'generating_image' | 'completed';

interface AnalysisData {
  f: number;
  d: string[];
  m: 'ausente' | 'leve' | 'moderada' | 'severa';
  c: 'baixa' | 'média' | 'alta';
  conf: number;
}

interface AnalysisResult {
  analysis: AnalysisData;
  valores: {
    facetas: number;
    clareamento: number;
    total: number;
  };
  needsClareamento: boolean;
}

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPatient } = usePatientForm();

  // Estados principais
  const [currentState, setCurrentState] = useState<SimulatorState>('select_patient');
  const [hasApiConfig, setHasApiConfig] = useState(false);
  
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
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
    if (currentState === 'analyzing' || currentState === 'generating_image') {
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
    setCurrentState('upload_photo');
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setCurrentState('select_patient');
    if (!selectedPatientId) {
      setPatientName("");
      setPatientPhone("");
    }
  };

  // FLUXO 1: Processar Análise
  const handleProcessAnalysis = async () => {
    if (!originalImage) return;

    setCurrentState('analyzing');
    setProcessingTime(0);

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'analyze',
          imageBase64: originalImage,
          servicePrices: config.servicePrices,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisData(result);
      
      // Salvar simulação inicial no banco (sem imagem processada ainda)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const timestamp = getTimestamp();
        
        // Upload imagem original
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
            teeth_count: result.analysis.f,
            price_per_tooth: result.valores.facetas / result.analysis.f,
            total_price: result.valores.total,
            final_price: result.valores.total,
            budget_data: {
              analysis: result.analysis,
              valores: result.valores,
            },
            status: 'analyzed',
          })
          .select()
          .single();

        setCurrentSimulationId(simulation.id);
      }

      setCurrentState('analysis_ready');
      toast.success("Análise concluída!");
    } catch (err) {
      console.error("Erro ao processar análise:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(errorMessage);
      setCurrentState('upload_photo');
    }
  };

  // FLUXO 2: Gerar Simulação Visual
  const handleGenerateSimulation = async () => {
    if (!originalImage || !analysisData) return;

    setCurrentState('generating_image');
    setProcessingTime(0);

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'generate',
          imageBase64: originalImage,
          analysisData: analysisData.analysis,
          config: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Upload imagem processada
      const { data: { user } } = await supabase.auth.getUser();
      if (user && currentSimulationId) {
        const timestamp = getTimestamp();
        const fetchResponse = await fetch(result.processedImageBase64);
        const blob = await fetchResponse.blob();
        const processedFileName = `${user.id}/processed-${timestamp}.jpeg`;
        
        await supabase.storage
          .from('processed-images')
          .upload(processedFileName, blob, {
            contentType: blob.type,
            upsert: true,
            cacheControl: '3600',
          });
        
        const { data: { publicUrl: processedUrl } } = supabase.storage
          .from('processed-images')
          .getPublicUrl(processedFileName);

        await supabase
          .from('simulations')
          .update({
            processed_image_url: processedUrl,
            status: 'completed',
          })
          .eq('id', currentSimulationId);

        setProcessedImage(processedUrl);
      }

      setCurrentState('completed');
      toast.success("Simulação visual gerada!");
    } catch (err) {
      console.error("Erro ao gerar simulação:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(errorMessage);
      setCurrentState('analysis_ready');
    }
  };

  const handleGenerateTechnicalReport = async () => {
    if (!currentSimulationId || !patientName || !analysisData) {
      toast.error("Dados insuficientes para gerar relatório");
      return;
    }
    
    try {
      const content = `Análise Técnica

Facetas necessárias: ${analysisData.analysis.f}
Dentes identificados: ${analysisData.analysis.d.join(', ')}
Manchas: ${analysisData.analysis.m}
Complexidade: ${analysisData.analysis.c}
Confiança: ${(analysisData.analysis.conf * 100).toFixed(1)}%

Valores:
- Facetas: R$ ${analysisData.valores.facetas.toLocaleString('pt-BR')}
- Clareamento: R$ ${analysisData.valores.clareamento.toLocaleString('pt-BR')}
- Total: R$ ${analysisData.valores.total.toLocaleString('pt-BR')}`;
      
      const reportNumber = generateReportNumber();
      const pdfUrl = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: analysisData.analysis.f,
        reportContent: content,
        simulationId: currentSimulationId
      });
      
      await supabase
        .from('simulations')
        .update({ 
          technical_report_url: pdfUrl,
          technical_notes: reportNumber
        })
        .eq('id', currentSimulationId);
      
      setReportPdfUrl(pdfUrl);
      setShowReportPdfModal(true);
      toast.success("Relatório técnico gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório técnico');
    }
  };

  const handleGenerateBudget = async () => {
    if (!analysisData || !patientName || !currentSimulationId) {
      toast.error("Dados insuficientes para gerar orçamento");
      return;
    }
    
    setGeneratingPdf(true);
    try {
      const budgetNumber = generateBudgetNumber();
      const pdfUrl = await generateBudgetPDF({
        budgetNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: analysisData.analysis.f,
        pricePerTooth: analysisData.valores.facetas / analysisData.analysis.f,
        subtotal: analysisData.valores.total,
        paymentOptions: [
          { name: 'À vista', installments: 1, discount: 10, value: analysisData.valores.total * 0.9, installmentValue: analysisData.valores.total * 0.9 },
          { name: '3x sem juros', installments: 3, discount: 5, value: analysisData.valores.total * 0.95, installmentValue: (analysisData.valores.total * 0.95) / 3 },
          { name: '6x sem juros', installments: 6, discount: 0, value: analysisData.valores.total, installmentValue: analysisData.valores.total / 6 },
          { name: '12x sem juros', installments: 12, discount: 0, value: analysisData.valores.total, installmentValue: analysisData.valores.total / 12 }
        ]
      });
      
      await supabase
        .from('simulations')
        .update({ budget_pdf_url: pdfUrl })
        .eq('id', currentSimulationId);

      setBudgetPdfUrl(pdfUrl);
      setShowBudgetPdfModal(true);
      toast.success("Orçamento gerado com sucesso!");
      
    } catch (error) {
      console.error('Erro ao gerar orçamento:', error);
      toast.error('Erro ao gerar orçamento');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadAntesDepois = () => {
    if (!originalImage || !processedImage) {
      toast.error("Imagens não disponíveis.");
      return;
    }
    toast.info("Iniciando download da imagem ANTES...");
    downloadImage(originalImage, `trusmile-antes-${getTimestamp()}.jpg`);
    
    setTimeout(() => { 
      toast.info("Iniciando download da imagem DEPOIS...");
      downloadImage(processedImage, `trusmile-depois-${getTimestamp()}.jpg`);
      toast.success("Download das imagens concluído!");
    }, 1000);
  };

  const handleNewSimulation = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAnalysisData(null);
    setCurrentSimulationId(null);
    setProcessingTime(0);
    setCurrentState('select_patient');
    if (!selectedPatientId) {
      setPatientName("");
      setPatientPhone("");
    }
  };

  if (!hasApiConfig) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🦷 TruSmile - Análise de Sorriso
          </h1>
          <p className="text-muted-foreground">
            Análise diagnóstica → Relatórios → Simulação visual
          </p>
        </div>

        {/* ETAPA 1: Seleção de Paciente */}
        {currentState === 'select_patient' && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 1: Selecionar Paciente</CardTitle>
              <CardDescription>Escolha ou crie um novo paciente para iniciar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <PatientSelector
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  onCreateNew={() => setShowQuickPatientForm(true)}
                />
              </div>
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
              <Button 
                onClick={() => setCurrentState('upload_photo')}
                disabled={!patientName}
                className="w-full mt-4"
                size="lg"
              >
                Continuar para Upload
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ETAPA 2: Upload da Foto */}
        {currentState === 'upload_photo' && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 2: Upload da Foto</CardTitle>
              <CardDescription>Paciente: {patientName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={originalImage}
                onClear={handleClearImage}
                disabled={false}
              />
              {originalImage && (
                <Button
                  onClick={handleProcessAnalysis}
                  size="lg"
                  className="w-full"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Processar Análise
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* LOADING: Analisando */}
        {currentState === 'analyzing' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Analisando foto...</p>
              <p className="text-sm text-muted-foreground">Aguarde 3-5 segundos</p>
              {processingTime > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(processingTime / 1000).toFixed(1)}s
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ETAPA 3: Resultado da Análise */}
        {currentState === 'analysis_ready' && analysisData && (
          <Card>
            <CardHeader>
              <CardTitle>Etapa 3: Análise Concluída</CardTitle>
              <CardDescription>Diagnóstico e valores calculados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Facetas Necessárias</p>
                  <p className="text-2xl font-bold">{analysisData.analysis.f}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Complexidade</p>
                  <p className="text-xl font-semibold capitalize">{analysisData.analysis.c}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Manchas</p>
                  <p className="text-lg capitalize">{analysisData.analysis.m}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Investimento</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {analysisData.valores.total.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Dentes Identificados (FDI)</p>
                <p className="text-sm font-mono">{analysisData.analysis.d.join(', ')}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateTechnicalReport}
                  disabled={!patientName}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  📄 Relatório Técnico
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGenerateBudget}
                  disabled={generatingPdf || !patientName}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  💰 Orçamento
                </Button>
              </div>

              <Button 
                onClick={handleGenerateSimulation}
                size="lg"
                className="w-full mt-4"
              >
                Gerar Simulação Visual
              </Button>
            </CardContent>
          </Card>
        )}

        {/* LOADING: Gerando Imagem */}
        {currentState === 'generating_image' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Gerando simulação visual...</p>
              <p className="text-sm text-muted-foreground">Aguarde 5-8 segundos</p>
              {processingTime > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(processingTime / 1000).toFixed(1)}s
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ETAPA 4: Resultado Completo */}
        {currentState === 'completed' && analysisData && processedImage && originalImage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Simulação</CardTitle>
                <CardDescription>Paciente: {patientName}</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonView
                  beforeImage={originalImage}
                  afterImage={processedImage}
                  isProcessing={false}
                  processingTime={0}
                />

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    Tratamento: {analysisData.analysis.f} facetas • 
                    Investimento: R$ {analysisData.valores.total.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleGenerateTechnicalReport}
                    className="flex-1"
                  >
                    📄 Relatório Técnico
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleGenerateBudget}
                    disabled={generatingPdf}
                    className="flex-1"
                  >
                    💰 Orçamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                variant="outline"
                onClick={handleNewSimulation}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nova Simulação
              </Button>
              <Button 
                variant="outline"
                onClick={() => downloadImage(processedImage, `trusmile-resultado-${getTimestamp()}.jpg`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Resultado
              </Button>
              <Button
                onClick={handleDownloadAntesDepois}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Antes/Depois
              </Button>
            </div>
          </div>
        )}

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
