import { supabase } from "@/integrations/supabase/client";

export interface SimulationAnalysis {
  teethCount: number;
  teethIdentified: string[];
  confidence: number;
}

export async function extractTeethCountFromGeminiResponse(geminiResponse: string): Promise<number> {
  // Procurar padrão DENTES_MODIFICADOS: X
  const pattern = /DENTES_MODIFICADOS:\s*(\d+)/i;
  const match = geminiResponse.match(pattern);
  
  if (match && match[1]) {
    const count = parseInt(match[1], 10);
    if (count >= 2 && count <= 8) {
      return count;
    }
  }
  
  // Fallback: assumir 4 facetas (padrão mais comum)
  console.warn('Não foi possível detectar número de dentes, usando padrão: 4');
  return 4;
}

export function calculateBudget(teethCount: number, pricePerTooth: number = 600) {
  const subtotal = teethCount * pricePerTooth;
  
  return {
    teethCount,
    pricePerTooth,
    subtotal,
    paymentOptions: [
      {
        name: 'À vista',
        installments: 1,
        discount: 10,
        value: subtotal * 0.9,
        installmentValue: subtotal * 0.9,
        description: '10% de desconto'
      },
      {
        name: '3x sem juros',
        installments: 3,
        discount: 5,
        value: subtotal * 0.95,
        installmentValue: (subtotal * 0.95) / 3,
        description: '5% de desconto'
      },
      {
        name: '6x sem juros',
        installments: 6,
        discount: 0,
        value: subtotal,
        installmentValue: subtotal / 6,
        description: 'Sem desconto'
      },
      {
        name: '12x sem juros',
        installments: 12,
        discount: 0,
        value: subtotal,
        installmentValue: subtotal / 12,
        description: 'Sem desconto'
      }
    ]
  };
}

export async function saveSimulationAnalysis(
  userId: string,
  originalImage: string,
  processedImage: string,
  teethCount: number,
  budget: any
) {
  const { data, error } = await supabase
    .from('simulations')
    .insert({
      user_id: userId,
      original_image_url: originalImage,
      processed_image_url: processedImage,
      teeth_count: teethCount,
      teeth_analyzed: ['11', '21', '12', '22'].slice(0, teethCount),
      price_per_tooth: 600,
      total_price: budget.subtotal,
      final_price: budget.subtotal,
      budget_data: budget
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao salvar análise:', error);
    throw error;
  }
  
  return data;
}
