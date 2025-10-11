import { supabase } from "@/integrations/supabase/client";
import { getTimestamp } from "@/utils/formatters";

// --- NOVAS INTERFACES DE DADOS COMPACTOS DA IA ---
export interface CompactAnalysisData {
  f: number; // Facetas Necessárias
  d: string[]; // Dentes Identificados (FDI)
  m: 'ausente' | 'leve' | 'moderada' | 'severa'; // Manchas
  c: 'baixa' | 'média' | 'alta'; // Complexidade
  conf: number; // Confiança (0.0-1.0)
  alt?: string; // Alternativa Conservadora
  j_can?: string; // Justificativa da inclusão/exclusão de caninos
}

export interface CalculatedBudget {
  teethCount: number;
  pricePerTooth: number;
  subtotal: number;
  totalWithClareamento: number;
  finalPrice: number;
  paymentOptions: any;
  needsClareamento: boolean;
  valorClareamento: number;
  complexidade: string;
}

export interface Simulation {
  id: string;
  user_id: string;
  original_image_url: string | null;
  processed_image_url: string | null;
  teeth_count: number | null;
  analysis_data: any; // JSON da análise
}


// --- FUNÇÕES DE CÁLCULO (LOCAL - PARA EDIÇÃO MANUAL NO FRONTEND) ---

export function calculateBudget(
  teethCount: number, 
  pricePerTooth: number, 
  needsClareamento: boolean,
  complexidade: 'baixa' | 'média' | 'alta'
) {
  const PRECO_CLAREAMENTO = 800; // Valor fixo de fallback para clareamento
  const subtotalFacetas = teethCount * pricePerTooth;
  const valorClareamento = needsClareamento ? PRECO_CLAREAMENTO : 0;
  const subtotal = subtotalFacetas + valorClareamento;
  const finalPrice = subtotal;

  const paymentOptions = [
    { name: 'À vista', installments: 1, discount: 10, value: finalPrice * 0.9, installmentValue: finalPrice * 0.9, description: '10% de desconto' },
    { name: '3x sem juros', installments: 3, discount: 5, value: finalPrice * 0.95, installmentValue: (finalPrice * 0.95) / 3, description: '5% de desconto' },
    { name: '6x sem juros', installments: 6, discount: 0, value: finalPrice, installmentValue: finalPrice / 6, description: 'Sem desconto' },
    { name: '12x sem juros', installments: 12, discount: 0, value: finalPrice, installmentValue: finalPrice / 12, description: 'Sem desconto' }
  ];

  return {
    teethCount,
    pricePerTooth,
    subtotal: subtotalFacetas,
    totalWithClareamento: subtotal,
    finalPrice,
    paymentOptions,
    needsClareamento,
    valorClareamento,
    complexidade // Mantém complexidade para uso futuro
  };
}


// Função auxiliar para upload de Base64 para Storage
async function uploadBase64ToSupabase(base64Data: string, bucketName: string, fileName: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const fetchResponse = await fetch(base64Data);
  const blob = await fetchResponse.blob();

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(`${user.id}/${fileName}`, blob, {
      contentType: blob.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    console.error(`Erro ao fazer upload para ${bucketName}:`, error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`${user.id}/${fileName}`);
    
  return publicUrl;
}


export async function saveSimulationAnalysis(
  userId: string,
  originalImageBase64: string,
  processedImageBase64: string,
  analysisResult: { 
    analysis: any, 
    budget: any, 
    simulationPrompt: string 
  },
): Promise<any> {
  
  const { analysis, budget, simulationPrompt } = analysisResult;
  
  // 1. UPLOAD DAS IMAGENS
  const timestamp = getTimestamp();
  const originalFileName = `original-${timestamp}.jpeg`;
  const processedFileName = `processed-${timestamp}.jpeg`;
  
  const [originalImageUrl, processedImageUrl] = await Promise.all([
    uploadBase64ToSupabase(originalImageBase64, 'budgets', originalFileName),
    uploadBase64ToSupabase(processedImageBase64, 'budgets', processedFileName)
  ]);
  
  // 2. SALVAR NO BANCO (Simulação) - usando budget_data para armazenar tudo
  const { data, error } = await supabase
    .from('simulations')
    .insert({
      user_id: userId,
      original_image_url: originalImageUrl,
      processed_image_url: processedImageUrl,
      
      teeth_count: analysis.f,
      price_per_tooth: budget.pricePerTooth,
      total_price: budget.totalWithClareamento,
      final_price: budget.finalPrice,
      
      budget_data: {
        ...budget,
        analysis: analysis, // Salvar análise dentro do budget_data
      },
      
      technical_notes: `Prompt: ${simulationPrompt.substring(0, 500)}...`, 
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao salvar análise:', error);
    throw error;
  }
  
  return data;
}

// Funções antigas (mantidas apenas os headers para evitar erro de importação)
export function extractTeethCountFromGeminiResponse(): never {
  throw new Error("Função obsoleta. O backend retorna a contagem diretamente no JSON.");
}
