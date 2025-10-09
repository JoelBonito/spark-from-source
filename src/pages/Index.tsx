import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Save, Zap, FileText, Loader2 } from "lucide-react";
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
import { getTimestamp } from "@/utils/formatters";
import { generateBudgetPDF, generateBudgetNumber } from "@/services/pdfService";
import { getPatientById } from "@/services/patientService";
import { usePatientForm } from "@/hooks/usePatientForm";
import { generateTechnicalReportPDF, generateReportNumber } from "@/services/technicalReportService";

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

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPatient } = usePatientForm();

  // Estados principais
  const [currentState, setCurrentState] = useState<SimulatorState>('input');
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
  const [analiseJSON, setAnaliseJSON] = useState<any>(null);
  const [orcamentoDinamico, setOrcamentoDinamico] = useState<any>(null);
  
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
      const config = await getConfig();
      if (!config || !config.servicePrices) {
        console.warn('⚠️ Nenhuma configuração de serviços encontrada');
        return [];
      }
      
      // Filtrar apenas serviços ativos (considera true se campo não existir)
      const ativos = config.servicePrices.filter(s => s.active !== false);
      console.log(`✅ ${ativos.length} serviços ativos encontrados`);
      return ativos;
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return [];
    }
  };

  const buildDynamicBudget = async (analiseJSON: any) => {
    console.log('🔍 Iniciando montagem de orçamento dinâmico...');
    
    // FASE 2: Usar caminhos corretos do novo JSON
    const recomendacao = analiseJSON?.recomendacao_tratamento || {};
    const complementares = analiseJSON?.procedimentos_complementares || {};
    console.log('📊 Dados da recomendação:', recomendacao);
    
    const servicosAtivos = await fetchActiveServices();
    
    if (servicosAtivos.length === 0) {
      toast.warning('Nenhum serviço ativo configurado. Configure na aba Configurações.');
      return {
        itens: [],
        opcionais: [],
        subtotal: 0,
        desconto_percentual: 10,
        desconto_valor: 0,
        total: 0
      };
    }
    
    const orcamentoItens: any[] = [];
    
    // 1. Clareamento (se recomendado)
    if (recomendacao.servico_clareamento_escolhido && recomendacao.servico_clareamento_escolhido !== 'N/A') {
      const clareamento = servicosAtivos.find(s => 
        s.name === recomendacao.servico_clareamento_escolhido
      );
      if (clareamento) {
        orcamentoItens.push({
          servico: clareamento.name,
          quantidade: 1,
          valor_unitario: clareamento.price,
          valor_total: clareamento.price
        });
      } else {
        console.warn(`⚠️ Clareamento '${recomendacao.servico_clareamento_escolhido}' recomendado mas não ativo.`);
      }
    }
    
    // 2. Facetas/Lentes (se recomendado)
    if (recomendacao.quantidade_facetas > 0) {
      let servicoFacetaRecomendado = recomendacao.servico_faceta_escolhido;
      let faceta = servicosAtivos.find(s => s.name === servicoFacetaRecomendado);
      
      // 🐛 CORREÇÃO: Se o serviço recomendado pela IA estiver inativo
      if (!faceta && servicoFacetaRecomendado && servicoFacetaRecomendado !== 'N/A') {
        // Buscar substituto ativo por categoria
        faceta = servicosAtivos.find(s => 
          s.category?.toLowerCase().includes('faceta') || 
          s.category?.toLowerCase().includes('lente') ||
          s.name.toLowerCase().includes('faceta') ||
          s.name.toLowerCase().includes('lente')
        );
        
        if (faceta) {
          console.warn(`⚠️ Substituição automática: '${servicoFacetaRecomendado}' (inativo) → '${faceta.name}' (ativo)`);
          servicoFacetaRecomendado = faceta.name;
        } else {
          console.error('❌ Nenhuma faceta ativa encontrada para substituição');
        }
      }
      
      if (faceta) {
        orcamentoItens.push({
          servico: faceta.name,
          quantidade: recomendacao.quantidade_facetas,
          dentes: recomendacao.dentes_fdi_tratados,
          valor_unitario: faceta.price,
          valor_total: faceta.price * recomendacao.quantidade_facetas
        });
      }
    }
    
    // 3. Serviços complementares ativos
    const servicosComplementares = ['planejamento', 'dsd', 'moldagem'];
    servicosAtivos
      .filter(s => servicosComplementares.some(c => 
        s.name.toLowerCase().includes(c)
      ))
      .forEach(s => {
        orcamentoItens.push({
          servico: s.name,
          quantidade: 1,
          valor_unitario: s.price,
          valor_total: s.price
        });
      });
    
    // 4. Gengivoplastia (OPCIONAL)
    const opcionais: any[] = [];
    if (complementares.gengivoplastia_recomendada) {
      const gengivoplastia = servicosAtivos.find(s => 
        s.name.toLowerCase().includes('gengivo')
      );
      if (gengivoplastia) {
        opcionais.push({
          servico: gengivoplastia.name,
          valor: gengivoplastia.price,
          justificativa: complementares.gengivoplastia_justificativa || 'Recomendado para correção da linha gengival'
        });
      }
    }
    
    // 5. Calcular totais
    const subtotal = orcamentoItens.reduce((sum, i) => sum + i.valor_total, 0);
    const desconto_percentual = 10;
    const desconto_valor = subtotal * (desconto_percentual / 100);
    const total = subtotal - desconto_valor;
    
    console.log(`💰 Orçamento montado: ${orcamentoItens.length} itens, R$ ${total.toFixed(2)}`);
    
    return {
      itens: orcamentoItens,
      opcionais,
      subtotal,
      desconto_percentual,
      desconto_valor,
      total
    };
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

  // FLUXO UNIFICADO: Análise + Geração em uma única função
  const handleProcessAndGenerate = async () => {
    if (!originalImage || !patientName) {
      toast.error("Preencha o nome do paciente e faça o upload da foto");
      return;
    }

    setCurrentState('processing');
    setProcessingTime(0);

    // Variável local para evitar race condition com setState
    let dynamicBudgetData: any = null;

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // ========================================
      // PASSO 1: ANÁLISE (3-5 segundos)
      // ========================================
      setProcessingStep('Analisando foto e gerando documentos...');
      
      // Buscar serviços ativos para enviar ao edge function
      const servicosAtivos = await fetchActiveServices();
      console.log('🛠️ Enviando serviços ativos:', servicosAtivos.map(s => s.name));
      
      const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          action: 'analyze',
          imageBase64: originalImage,
          servicos_ativos: servicosAtivos.map(s => ({
            name: s.name,
            category: s.category,
            price: s.price
          }))
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na análise: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      
      if (!analysisResult.success || !analysisResult.analise_data) {
        throw new Error("JSON de análise não encontrado na resposta");
      }

      if (analysisResult.metadata?.truncated) {
        toast.warning("Atenção: Resposta foi truncada.");
      }

      // ✅ JSON já vem pronto da edge function
      const analiseJSON = analysisResult.analise_data;
      setAnaliseJSON(analiseJSON);
      
      console.log('📊 Análise JSON recebida:', analiseJSON);
      console.log('  - Tom de pele:', analiseJSON.analise_clinica?.tom_pele);
      console.log('  - Cor dos olhos:', analiseJSON.analise_clinica?.cor_olhos);
      console.log('  - Tipo tratamento:', analiseJSON.recomendacao_tratamento?.tipo);
      console.log('  - Quantidade de facetas:', analiseJSON.recomendacao_tratamento?.quantidade_facetas);
      console.log('  - Cor recomendada:', analiseJSON.recomendacao_tratamento?.cor_recomendada);

      // ✅ Gerar texto do relatório a partir do JSON
      const { generateTextReportFromJSON } = await import('@/services/textReportGenerator');
      const relatorioTexto = generateTextReportFromJSON(analiseJSON);
      
      // ✅ Criar objeto compatível com fluxo atual
      const analysisDataCompat: AnalysisResult = {
        success: true,
        relatorio_tecnico: relatorioTexto,
        orcamento: '',  // Não mais necessário em texto
        analise_data: analiseJSON,
        metadata: analysisResult.metadata
      };
      
      setAnalysisData(analysisDataCompat);

      // ✅ Montar orçamento dinâmico
      const dynamicBudget = await buildDynamicBudget(analiseJSON);
      console.log('💰 Orçamento dinâmico:', dynamicBudget);
      setOrcamentoDinamico(dynamicBudget);
      dynamicBudgetData = dynamicBudget;

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
            technical_notes: analysisResult.relatorio_tecnico,
            budget_data: {
              orcamento: analysisResult.orcamento,
              metadata: analysisResult.metadata,
            },
            status: 'analyzed',
          })
          .select()
          .single();

        simulationId = simulation.id;
        setCurrentSimulationId(simulationId);
      }

      // ========================================
      // PASSO 2: GERAÇÃO DE IMAGEM (5-8 segundos)
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
          reportText: analysisDataCompat.relatorio_tecnico,
          analiseJSON: analiseJSON, // Dados estruturados da análise para prompt enriquecido
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
      
      // Upload imagem processada
      if (user && simulationId) {
        const timestamp = getTimestamp();
        const fetchResponse = await fetch(imageResult.processedImageBase64);
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
          .eq('id', simulationId);

        setProcessedImage(processedUrl);
      }

      // ========================================
      // PASSO 3: GERAR PDFs AUTOMATICAMENTE
      // ========================================
      setProcessingStep('Gerando documentos com imagens...');

      const reportNumber = generateReportNumber();
      const budgetNumber = generateBudgetNumber();

      // 🐛 CORREÇÃO FASE 2: Converter URLs para Base64 para garantir que imagens apareçam nos PDFs
      console.log('🔄 Convertendo imagens para Base64...');
      const beforeImageBase64 = originalImage ? await urlToBase64(originalImage) : '';
      const afterImageBase64 = processedImage ? await urlToBase64(processedImage) : '';
      console.log('✅ Imagens convertidas para Base64');

      // Gerar Relatório Técnico
      const reportPdf = await generateTechnicalReportPDF({
        reportNumber,
        patientName,
        patientPhone: patientPhone || undefined,
        date: new Date(),
        teethCount: 0,
        reportContent: analysisResult.relatorio_tecnico,
        simulationId: simulationId || currentSimulationId || '',
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64
      });

      // Gerar Orçamento com dados dinâmicos usando variável local
      let budgetPdf: string | null = null;
      
      if (dynamicBudgetData && dynamicBudgetData.itens?.length > 0) {
        budgetPdf = await generateBudgetPDF({
          budgetNumber,
          patientName,
          patientPhone: patientPhone || undefined,
          date: new Date(),
          itens: dynamicBudgetData.itens,
          opcionais: dynamicBudgetData.opcionais || [],
          subtotal: dynamicBudgetData.subtotal,
          desconto_percentual: dynamicBudgetData.desconto_percentual,
          desconto_valor: dynamicBudgetData.desconto_valor,
          total: dynamicBudgetData.total,
          beforeImage: beforeImageBase64,
          afterImage: afterImageBase64
        });
        console.log('✅ PDF de orçamento gerado com sucesso');
      } else {
        console.warn('⚠️ Orçamento sem itens, PDF não será gerado');
        toast.warning('Orçamento não pôde ser gerado. Verifique os serviços configurados.');
      }

      // Atualizar simulação com os PDFs
      if (simulationId) {
        await supabase
          .from('simulations')
          .update({
            technical_report_url: reportPdf,
            budget_pdf_url: budgetPdf || null
          })
          .eq('id', simulationId);
      }

      setReportPdfUrl(reportPdf);
      if (budgetPdf) {
        setBudgetPdfUrl(budgetPdf);
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

      // Extrair números dos PDFs já gerados
      const { data: simulation } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', currentSimulationId)
        .single();

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
        after_image: processedImage
      });

      // Salvar na tabela budgets com dados estruturados
      const budgetData = orcamentoDinamico || {
        subtotal: 0,
        total: 0,
        itens: [],
        desconto_percentual: 10
      };
      
      await supabase.from('budgets').insert({
        patient_id: selectedPatientId,
        user_id: user.id,
        patient_name: patientName,
        budget_number: budgetNumber,
        pdf_url: budgetPdfUrl,
        before_image: originalImage,
        after_image: processedImage,
        teeth_count: analiseJSON?.analise?.quantidade_facetas || 0,
        subtotal: budgetData.subtotal,
        final_price: budgetData.total,
        price_per_tooth: budgetData.itens?.find((i: any) => i.dentes)?.valor_unitario || 0,
        payment_conditions: {
          desconto: budgetData.desconto_percentual,
          opcao_vista: budgetData.total,
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
        source: 'simulator'
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
    setOrcamentoDinamico(null);
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
              <CardDescription>Preencha os dados e faça o upload da foto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
