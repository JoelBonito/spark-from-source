import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import ComparisonView from "@/components/ComparisonView";
import ErrorAlert from "@/components/ErrorAlert";
import { BudgetDisplay } from "@/components/BudgetDisplay";
import { TechnicalReportPreview } from "@/components/TechnicalReportPreview";
import { PatientSelector } from "@/components/PatientSelector";
import { QuickPatientForm } from "@/components/QuickPatientForm";
import { hasConfig, getConfig } from "@/utils/storage";
import { downloadImage } from "@/utils/imageProcessing";
import { getTimestamp } from "@/utils/formatters";
import { saveSimulationAnalysis, calculateBudget as calculateBudgetLocal, CalculatedBudget } from "@/services/analysisService";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { autoProcessSimulation } from "@/services/automationService";
import { useTechnicalReport } from "@/hooks/useTechnicalReport";
import { getPatientById } from "@/services/patientService";
import { usePatientForm } from "@/hooks/usePatientForm";
import { createBudget } from "@/services/budgetService";
import { addDays } from 'date-fns';
import { generateTechnicalReportPDF, generateReportNumber } from "@/services/technicalReportService";

// Função auxiliar para buscar conteúdo do relatório a partir da simulação
async function getReportContentFromAnalysis(simulationId: string): Promise<string> {
  const { data, error } = await supabase
    .from('simulations')
    .select('budget_data')
    .eq('id', simulationId)
    .single();
  
  if (error) throw error;
  
  const budgetData = data.budget_data as any;
  const analysis = budgetData?.analysis;
  
  if (!analysis) {
    return 'Análise Técnica\n\nDados de análise não disponíveis.';
  }
  
  return `Análise Técnica\n\nFacetas necessárias: ${analysis.f}\nDentes identificados: ${analysis.d?.join(', ')}\nManchas: ${analysis.m}\nComplexidade: ${analysis.c}\nConfiança: ${((analysis.conf || 0) * 100).toFixed(1)}%`;
}

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasApiConfig, setHasApiConfig] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [teethCount, setTeethCount] = useState(4);
  const [budget, setBudget] = useState<CalculatedBudget | null>(null);
  const [budgetPdfUrl, setBudgetPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  
  // Technical Report hook
  const { 
    generating: generatingReport, 
    reportContent, 
    reportPdfUrl,
  } = useTechnicalReport();

  const { createPatient } = usePatientForm();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if config exists
      hasConfig().then((exists) => {
        setHasApiConfig(exists);
        if (!exists) {
          navigate("/config");
        }
      });
    });

    // Check if navigated from patients page with selected patient
    const state = location.state as { selectedPatient?: any };
    if (state?.selectedPatient) {
      setSelectedPatientId(state.selectedPatient.id);
      setPatientName(state.selectedPatient.name);
      setPatientPhone(state.selectedPatient.phone || "");
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setProcessingTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Load patient data when selectedPatientId changes
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
    setProcessedImage(null);
    setError(null);
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setBudget(null);
    setBudgetPdfUrl(null);
    setCurrentSimulationId(null);
    // Limpar apenas se nenhum paciente estiver selecionado
    if (!selectedPatientId) {
      setPatientName("");
      setPatientPhone("");
    }
  };

  const handleProcessImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);
    setProcessedImage(null);
    setProcessingTime(0);
    setBudget(null);
    setBudgetPdfUrl(null);
    
    const startTime = Date.now();

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      // 1. CHAMA O NOVO BACKEND UNIFICADO (Gemini #1 Análise + Gemini #2 Imagem)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          imageBase64: originalImage,
          prompt: config.promptTemplate,
          config: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          },
          servicePrices: config.servicePrices, // CRÍTICO: PREÇOS DA CLÍNICA
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.processedImageBase64) {
        throw new Error("Resposta inválida do servidor: imagem não encontrada");
      }

      // --- TRATAMENTO DA RESPOSTA UNIFICADA ---
      const { analysis, budget: calculatedBudget, processedImageBase64 } = result;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      let simulation;
      if (user) {
        simulation = await saveSimulationAnalysis(
          user.id,
          originalImage, // Base64 original
          processedImageBase64, // Base64 processada
          result // JSON completo
        );
        setCurrentSimulationId(simulation.id);
      }
      
      setProcessedImage(simulation?.processed_image_url || processedImageBase64);
      setProcessingTime(Date.now() - startTime);
      
      setTeethCount(analysis.f);
      setBudget(calculatedBudget);
      
      // Auto-create lead and draft budget (CRM)
      if (user && simulation && patientName && patientPhone) {
        try {
          await autoProcessSimulation(
            simulation.id,
            selectedPatientId,
            patientName,
            patientPhone,
            analysis.f,
            calculatedBudget.finalPrice
          );
          console.log('Lead e orçamento draft criados automaticamente');
        } catch (error) {
          console.error('Erro na automação:', error);
        }
      }
      
      toast.success("Análise e Simulação geradas com sucesso!");
    } catch (err) {
      console.error("Erro ao processar:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error("Erro ao processar imagem");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const filename = `trusmile-resultado-${getTimestamp()}.jpg`;
      downloadImage(processedImage, filename);
      toast.success("Download iniciado!");
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
    setError(null);
    setProcessingTime(0);
    setBudget(null);
    setBudgetPdfUrl(null);
    setCurrentSimulationId(null);
    if (!selectedPatientId) {
      setPatientName("");
      setPatientPhone("");
    }
  };

  const handleGeneratePDF = async () => {
    if (!budget || !patientName || !currentSimulationId) {
      toast.error("Por favor, preencha o nome do paciente e processe a simulação");
      return;
    }
    
    setGeneratingPdf(true);
    try {
      const budgetNumber = generateBudgetNumber();
      const pdfUrl = await generateBudgetPDF({
        budgetNumber: budgetNumber,
        patientName: patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: teethCount,
        pricePerTooth: budget.pricePerTooth,
        subtotal: budget.subtotal,
        paymentOptions: budget.paymentOptions
      });
      
      setBudgetPdfUrl(pdfUrl);
      
      // Update simulation and budget status
      await supabase
          .from('simulations')
          .update({ 
            budget_pdf_url: pdfUrl,
            patient_name: patientName,
            patient_phone: patientPhone || null,
            patient_id: selectedPatientId
          })
          .eq('id', currentSimulationId);

      const today = new Date();
      const expirationDate = addDays(today, 30);
      
      await createBudget({
          simulation_id: currentSimulationId,
          patient_id: selectedPatientId || undefined,
          teeth_count: teethCount,
          subtotal: budget.subtotal,
          final_price: budget.finalPrice,
          payment_conditions: budget.paymentOptions,
          valid_until: expirationDate,
          status: 'sent',
          pdf_url: pdfUrl,
          budget_number: budgetNumber,
      });

      window.open(pdfUrl, '_blank');
      toast.success("PDF e orçamento gerados com sucesso!");
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do orçamento');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleTeethCountChange = (count: number) => {
    if (count >= 2 && count <= 8 && budget) {
      setTeethCount(count);
      
      const fixedPrice = budget.pricePerTooth;
      const complexidade = (budget.complexidade || 'média') as 'baixa' | 'média' | 'alta'; 
      const needsClareamento = budget.needsClareamento || false;
      
      const recalculatedBudget = calculateBudgetLocal(count, fixedPrice, needsClareamento, complexidade);
      setBudget(recalculatedBudget as CalculatedBudget);
    }
  };
  
  // Função para gerar o Relatório Técnico (agora usa o JSON salvo)
  const handleGenerateTechnicalReport = async () => {
    if (!currentSimulationId || !patientName) {
      toast.error("Simulação ou nome do paciente não disponíveis");
      return;
    }
    
    try {
      const content = await getReportContentFromAnalysis(currentSimulationId); 
      
      const reportNumber = generateReportNumber();
      
      // Gerar PDF do relatório técnico
      const pdfUrl = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: teethCount,
        reportContent: content,
        simulationId: currentSimulationId
      });
      
      // Salvar URL do PDF na simulação
      if (currentSimulationId) {
        await supabase
          .from('simulations')
          .update({ 
            technical_report_url: pdfUrl,
            technical_notes: reportNumber
          })
          .eq('id', currentSimulationId);
      }
      
      window.open(pdfUrl, '_blank');
      toast.success("Relatório técnico gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório técnico');
    }
  };

  if (!hasApiConfig) {
    return null; // Already redirecting to /config
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🦷 Simulador de Facetas
          </h1>
          <p className="text-muted-foreground">
            Faça upload de uma foto e veja o resultado com facetas dentárias
          </p>
        </div>

        {!originalImage && (
          <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              PASSO 1: Upload da Foto
            </h2>
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={originalImage}
              onClear={handleClearImage}
              disabled={isProcessing}
            />
          </div>
        )}

        {originalImage && !processedImage && !isProcessing && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                PASSO 1: Foto Carregada
              </h2>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={originalImage}
                onClear={handleClearImage}
                disabled={isProcessing}
              />
            </div>

            <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                PASSO 2: Processar
              </h2>
              <Button
                onClick={handleProcessImage}
                disabled={isProcessing || !originalImage}
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Zap className="h-5 w-5 mr-2" />
                Gerar Análise e Simulação
              </Button>
            </div>
          </div>
        )}

        {(isProcessing || processedImage) && originalImage && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Simulação (Antes e Depois)
              </h2>
              <ComparisonView
                beforeImage={originalImage}
                afterImage={processedImage}
                isProcessing={isProcessing}
                processingTime={processingTime}
              />
            </div>

            {processedImage && budget && (
              <>
                <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Dados do Paciente
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Selecionar Paciente</Label>
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
                  </div>
                </div>

                <BudgetDisplay
                  teethCount={teethCount}
                  onTeethCountChange={handleTeethCountChange}
                  budget={budget}
                  editable={true}
                />

                <TechnicalReportPreview
                  reportContent={reportContent || undefined}
                  reportPdfUrl={reportPdfUrl || undefined}
                  generating={generatingReport}
                  onGenerate={handleGenerateTechnicalReport}
                />

                {/* Botões de Ação Principal: Relatório e Orçamento */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={handleGenerateTechnicalReport}
                    disabled={generatingReport || !patientName || !currentSimulationId}
                    size="lg"
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Relatório Técnico
                  </Button>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={generatingPdf || !patientName || !currentSimulationId}
                    size="lg"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    <FileText className="h-5 w-5" />
                    Gerar Orçamento PDF
                  </Button>
                </div>

                {/* Botões de Download */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={handleNewSimulation}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Nova Simulação
                  </Button>
                  <Button
                    onClick={() => downloadImage(processedImage!, `trusmile-resultado-${getTimestamp()}.jpg`)}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Resultado
                  </Button>
                  <Button
                    onClick={handleDownloadAntesDepois}
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Antes e Depois
                  </Button>
                </div>
              </>
            )}
            
            {error && (
              <ErrorAlert
                message={error}
                suggestions={[
                  "Verifique sua API Key nas configurações",
                  "Backend não está rodando ou URL está incorreta",
                  "Imagem em formato inválido ou muito grande",
                  "Tempo limite excedido - tente novamente",
                ]}
                onClose={() => setError(null)}
              />
            )}
          </div>
        )}

        <QuickPatientForm
          isOpen={showQuickPatientForm}
          onClose={() => setShowQuickPatientForm(false)}
          onSave={handleQuickPatientCreate}
        />
      </div>
    </Layout>
  );
}
