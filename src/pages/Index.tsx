// APENAS as partes que precisam mudar:

// 1. ATUALIZAR A INTERFACE AnalysisResult (linha ~33)
interface AnalysisResult {
  relatorio_tecnico: string;  // ✅ NOVO: texto do relatório
  orcamento: string;           // ✅ NOVO: texto do orçamento
  success: boolean;
  metadata?: {
    total_chars: number;
    finish_reason: string;
    truncated: boolean;
  };
}

// 2. ATUALIZAR handleProcessAnalysis (a partir da linha ~196)
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // ✅ NOVO: Verificar se recebeu os documentos
    if (!result.relatorio_tecnico || !result.orcamento) {
      throw new Error("Resposta incompleta da análise");
    }

    setAnalysisData(result);
    
    // Salvar simulação inicial no banco
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

      // ✅ NOVO: Salvar os documentos no banco
      const { data: simulation } = await supabase
        .from('simulations')
        .insert({
          user_id: user.id,
          patient_id: selectedPatientId,
          patient_name: patientName,
          patient_phone: patientPhone || null,
          original_image_url: originalUrl,
          technical_notes: result.relatorio_tecnico,  // ✅ Salvar relatório técnico
          budget_data: {
            orcamento: result.orcamento,              // ✅ Salvar orçamento
            metadata: result.metadata,
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

// 3. ATUALIZAR handleGenerateSimulation (linha ~287)
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
        reportText: analysisData.relatorio_tecnico,  // ✅ NOVO: enviar relatório técnico
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
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
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

// 4. ATUALIZAR AS FUNÇÕES DE PDF (linhas ~344 e ~379)
const handleGenerateTechnicalReport = async () => {
  if (!currentSimulationId || !patientName || !analysisData) {
    toast.error("Dados insuficientes para gerar relatório");
    return;
  }
  
  try {
    // ✅ NOVO: Usar o relatório técnico direto
    const reportNumber = generateReportNumber();
    const pdfUrl = await generateTechnicalReportPDF({
      reportNumber,
      patientName,
      patientPhone: patientPhone || undefined,
      date: new Date(),
      teethCount: 0, // ✅ Extrair do texto se necessário
      reportContent: analysisData.relatorio_tecnico,  // ✅ USAR TEXTO DIRETO
      simulationId: currentSimulationId
    });
    
    await supabase
      .from('simulations')
      .update({ 
        technical_report_url: pdfUrl,
        technical_notes: analysisData.relatorio_tecnico
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
    // ✅ NOVO: Extrair valores do texto do orçamento
    // Por enquanto, valores padrão - você pode melhorar o parsing depois
    const budgetNumber = generateBudgetNumber();
    
    const pdfUrl = await generateBudgetPDF({
      budgetNumber,
      patientName,
      patientPhone: patientPhone || undefined,
      date: new Date(),
      teethCount: 4, // ✅ Extrair do relatório se precisar
      pricePerTooth: 700,
      subtotal: 3600,
      paymentOptions: [
        { name: 'À vista', installments: 1, discount: 10, value: 3240, installmentValue: 3240 },
        { name: '3x sem juros', installments: 3, discount: 5, value: 3420, installmentValue: 1140 },
        { name: '6x sem juros', installments: 6, discount: 0, value: 3600, installmentValue: 600 },
        { name: '12x sem juros', installments: 12, discount: 0, value: 3600, installmentValue: 300 }
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

// 5. ATUALIZAR A PARTE DE EXIBIÇÃO DOS RESULTADOS (linha ~540)
// Remover as referências a analysisData.analysis.f, analysisData.analysis.c, etc
// Por enquanto, pode mostrar apenas os documentos de texto ou fazer parsing bási
