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
import { extractTeethCountFromGeminiResponse, calculateBudget, saveSimulationAnalysis } from "@/services/analysisService";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { useTechnicalReport } from "@/hooks/useTechnicalReport";
import { getPatientById } from "@/services/patientService";
import { usePatientForm } from "@/hooks/usePatientForm";

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
  const [budget, setBudget] = useState<any>(null);
  const [budgetPdfUrl, setBudgetPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  
  // Technical Report hook
  const { 
    generating: generatingReport, 
    reportContent, 
    reportPdfUrl,
    generateReport 
  } = useTechnicalReport();

  const { createPatient } = usePatientForm();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if config exists and load API key
      hasConfig().then((exists) => {
        setHasApiConfig(exists);
        if (!exists) {
          navigate("/config");
        } else {
          // Load API key for technical reports
          getConfig().then((config) => {
            if (config?.apiKey) {
              setGeminiApiKey(config.apiKey);
            }
          });
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.imageBase64) {
        throw new Error("Resposta inválida do servidor: imagem não encontrada");
      }

      setProcessedImage(result.imageBase64);
      setProcessingTime(Date.now() - startTime);
      
      // Extrair número de facetas da resposta
      const detectedTeethCount = await extractTeethCountFromGeminiResponse(result.fullResponse || "");
      setTeethCount(detectedTeethCount);
      
      // Calcular orçamento
      const calculatedBudget = calculateBudget(detectedTeethCount);
      setBudget(calculatedBudget);
      
      // Salvar análise no banco
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const simulation = await saveSimulationAnalysis(
          user.id,
          originalImage,
          result.imageBase64,
          detectedTeethCount,
          calculatedBudget
        );
        setCurrentSimulationId(simulation.id);
      }
      
      toast.success("Simulação gerada com sucesso!");
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
      const filename = `facetas-resultado-${getTimestamp()}.jpg`;
      downloadImage(processedImage, filename);
      toast.success("Download iniciado!");
    }
  };

  const handleNewSimulation = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setProcessingTime(0);
    setBudget(null);
    setBudgetPdfUrl(null);
    setPatientName("");
    setPatientPhone("");
    setCurrentSimulationId(null);
  };

  const handleGeneratePDF = async () => {
    if (!budget || !patientName) {
      toast.error("Por favor, preencha o nome do paciente");
      return;
    }
    
    setGeneratingPdf(true);
    try {
      const pdfUrl = await generateBudgetPDF({
        budgetNumber: generateBudgetNumber(),
        patientName: patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: teethCount,
        pricePerTooth: 600,
        subtotal: budget.subtotal,
        paymentOptions: budget.paymentOptions
      });
      
      setBudgetPdfUrl(pdfUrl);
      
      // Update simulation with PDF URL and patient_id
      if (currentSimulationId) {
        await supabase
          .from('simulations')
          .update({ 
            budget_pdf_url: pdfUrl,
            patient_name: patientName,
            patient_phone: patientPhone || null,
            patient_id: selectedPatientId
          })
          .eq('id', currentSimulationId);
      }
      
      window.open(pdfUrl, '_blank');
      toast.success("PDF gerado com sucesso!");
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do orçamento');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleTeethCountChange = (count: number) => {
    if (count >= 2 && count <= 8) {
      setTeethCount(count);
      setBudget(calculateBudget(count));
    }
  };

  const handleGenerateTechnicalReport = async () => {
    if (!originalImage || !patientName) {
      toast.error("Por favor, preencha o nome do paciente");
      return;
    }
    
    if (!geminiApiKey) {
      toast.error("API Key do Gemini não configurada");
      return;
    }
    
    try {
      await generateReport(
        originalImage,
        patientName,
        patientPhone || undefined,
        teethCount,
        geminiApiKey,
        currentSimulationId || undefined
      );
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
                Gerar Simulação
              </Button>
            </div>
          </div>
        )}

        {(isProcessing || processedImage) && originalImage && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Comparação de Resultados
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
                    onClick={handleDownload}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Resultado
                  </Button>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={generatingPdf || !patientName}
                    size="lg"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    {generatingPdf ? (
                      <>Gerando PDF...</>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        Gerar Orçamento PDF
                      </>
                    )}
                  </Button>
                  {budgetPdfUrl && (
                    <Button
                      onClick={() => window.open(budgetPdfUrl, '_blank')}
                      size="lg"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="h-5 w-5" />
                      Abrir PDF
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {processedImage && !budget && (
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
                  onClick={handleDownload}
                  size="lg"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Download className="h-5 w-5" />
                  Baixar Resultado
                </Button>
              </div>
            )}
          </div>
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

      <QuickPatientForm
        isOpen={showQuickPatientForm}
        onClose={() => setShowQuickPatientForm(false)}
        onSave={handleQuickPatientCreate}
      />
    </Layout>
  );
}
