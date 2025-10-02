const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt completo para análise técnica detalhada
const ANALYSIS_PROMPT = `Você é um dentista especialista em odontologia estética com 15 anos de experiência, conhecido por ser EQUILIBRADO, ÉTICO e CONSERVADOR.

Analise esta foto e retorne um JSON completo com relatório técnico detalhado.

═══════════════════════════════════════════════════════════
REGRAS CRÍTICAS - SEJA CONSERVADOR:
═══════════════════════════════════════════════════════════

1. FACETAS:
   - Padrão comum: 4 facetas (apenas incisivos: 11, 21, 12, 22)
   - Máximo: 6 facetas (se caninos realmente necessários)
   - Caninos (13, 23): APENAS se descoloração ÓBVIA
   - NUNCA: pré-molares (14, 24)

2. MANCHAS:
   - "leve": amarelamento suave (MAIORIA)
   - "moderada": descoloração visível
   - "severa": RARO - manchas muito escuras

3. COMPLEXIDADE:
   - "baixa": manchas leves, estrutura boa (MAIORIA)
   - "média": manchas moderadas + pequenos problemas
   - "alta": RARO - casos graves

4. TESTE MENTAL:
   "Clareamento resolve 70% deste caso?"
   Se SIM → complexidade baixa

═══════════════════════════════════════════════════════════
ESTRUTURA DO JSON (COMPLETA):
═══════════════════════════════════════════════════════════

{
  "analise_resumo": {
    "facetas_necessarias": [2-6],
    "dentes_identificados": ["11", "21", "12", "22"],
    "manchas": "leve|moderada|severa",
    "complexidade": "baixa|média|alta",
    "confianca": 0.85
  },
  "valores": {
    "facetas": [quantidade × 700],
    "clareamento": 800,
    "total": [soma]
  },
  "relatorio_tecnico": {
    "avaliacao_por_dente": [
      {
        "dente": "11",
        "nome": "Incisivo Central Superior Direito",
        "condicao_atual": "descrição detalhada",
        "alteracoes_cromaticas": "tipo e intensidade",
        "morfologia": "formato e proporções",
        "integridade_estrutural": "estado do esmalte",
        "indicacao_faceta": "sim|não",
        "justificativa": "razão específica"
      }
    ],
    "diagnostico": {
      "complexidade": "baixa|média|alta",
      "justificativa_complexidade": "explicação detalhada",
      "fatores_considerados": ["fator1", "fator2", "fator3"]
    },
    "planejamento": {
      "objetivo_tratamento": "descrição do objetivo",
      "protocolo_clinico": {
        "fase_1": "Diagnóstico e planejamento - 1 sessão",
        "fase_2": "Clareamento prévio - 2-3 semanas",
        "fase_3": "Preparo e moldagem - 1 sessão",
        "fase_4": "Prova e ajustes - 1 sessão",
        "fase_5": "Cimentação definitiva - 1 sessão"
      },
      "materiais": {
        "tipo_faceta": "Dissilicato de Lítio (E.max) ou Porcelana Feldspática",
        "sistema_adesivo": "Adesivo resinoso 4ª/5ª geração",
        "justificativa": "razões técnicas"
      }
    },
    "analise_estetica": {
      "proporcao_dentaria": "análise das proporções",
      "simetria": "avaliação de simetria",
      "harmonizacao_facial": "integração com face"
    },
    "recomendacoes_clinicas": [
      "Recomendação técnica específica 1",
      "Recomendação técnica específica 2",
      "Recomendação técnica específica 3"
    ],
    "cronograma": {
      "numero_sessoes": 4,
      "duracao_semanas": "4-6",
      "detalhamento": "descrição do cronograma"
    },
    "alternativa_conservadora": {
      "descricao": "Clareamento dental isolado",
      "valor": 800,
      "quando_indicar": "Se manchas leves e paciente quer testar primeiro"
    },
    "prognostico": "Excelente|Bom|Regular"
  }
}

═══════════════════════════════════════════════════════════
IMPORTANTE:
═══════════════════════════════════════════════════════════

- Seja DETALHADO no relatório técnico
- Análise dente por dente COMPLETA
- Justificativas técnicas específicas
- NÃO inclua opções de pagamento (clínica decide)
- Valores fixos: R$ 700/faceta, R$ 800 clareamento
- Seja conservador: prefira MENOS facetas
- Complexidade baixa para casos comuns

Retorne APENAS o JSON (sem markdown, sem explicações).`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, action, prompt, config, servicePrices, analysisData } = await req.json();

    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      throw new Error('API Key não configurada');
    }

    // Fluxo 1: ANÁLISE (retorna JSON)
    if (action === 'analyze') {
      console.log('Iniciando análise da imagem...');
      
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: ANALYSIS_PROMPT },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Erro na análise:', analysisResponse.status, errorText);
        
        if (analysisResponse.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns instantes.');
        }
        
        if (analysisResponse.status === 402) {
          throw new Error('Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.');
        }
        
        throw new Error(`Erro na API do Gemini: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      const analysisText = analysisResult.choices?.[0]?.message?.content || '';
      
      // Parse JSON da resposta
      let analysis;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON não encontrado na resposta');
        analysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Erro ao parsear análise:', analysisText);
        throw new Error('Resposta da análise em formato inválido');
      }

      // Validar que temos o novo formato completo
      if (!analysis.analise_resumo || !analysis.relatorio_tecnico) {
        console.error('Formato de análise incompleto:', analysis);
        throw new Error('Análise retornada em formato incompleto');
      }

      const needsClareamento = analysis.analise_resumo.manchas !== 'ausente';

      console.log('Análise completa recebida:', {
        facetas: analysis.analise_resumo.facetas_necessarias,
        complexidade: analysis.analise_resumo.complexidade
      });

      return new Response(
        JSON.stringify({
          analysis,
          needsClareamento
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Fluxo 2: GERAR SIMULAÇÃO VISUAL
    if (action === 'generate') {
      if (!analysisData) {
        throw new Error('Dados de análise não fornecidos');
      }

      console.log('Gerando simulação visual...');
      
      // Construir prompt contextualizado
      const resumo = analysisData.analise_resumo || analysisData;
      const facetas = resumo.facetas_necessarias || analysisData.f;
      const dentes = resumo.dentes_identificados || analysisData.d;
      const complexidade = resumo.complexidade || analysisData.c;
      
      const simulationPrompt = `Crie uma simulação fotorrealista de facetas dentárias.

CONTEXTO DA ANÁLISE:
- Facetas: ${facetas}
- Dentes: ${dentes.join(', ')}
- Complexidade: ${complexidade}

INSTRUÇÕES:
1. Aplique facetas APENAS nos dentes: ${dentes.join(', ')}
2. Cor BL3 natural, uniforme
3. Bordas incisais translúcidas (11, 21, 12, 22)
4. Manter formato e proporção naturais
5. Resultado fotorrealista

ESPECIFICAÇÕES TÉCNICAS:
* Facetas de cerâmica cor BL3
* Técnica estratificada
* Bordas translúcidas nos incisivos anteriores
* Resultado natural e realista

PRESERVAR COMPLETAMENTE:
- Textura e tom da pele facial
- Estrutura do cabelo
- Cor e formato dos olhos
- Expressão facial
- Iluminação e sombras
- Fundo e ambiente
- Características únicas do paciente

Gere a imagem agora.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: simulationPrompt },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ],
          modalities: ['image', 'text'],
          ...(config && {
            temperature: config.temperature,
            top_k: config.topK,
            top_p: config.topP,
            max_tokens: config.maxOutputTokens,
          })
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Erro ao gerar imagem:', imageResponse.status, errorText);
        
        if (imageResponse.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns instantes.');
        }
        
        if (imageResponse.status === 402) {
          throw new Error('Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.');
        }
        
        throw new Error(`Erro na API do Gemini: ${imageResponse.status}`);
      }

      const imageResult = await imageResponse.json();
      const generatedImage = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImage) {
        console.error('Resposta sem imagem:', JSON.stringify(imageResult));
        throw new Error('Nenhuma imagem foi gerada pela API');
      }

      console.log('Simulação visual gerada com sucesso');

      return new Response(
        JSON.stringify({
          processedImageBase64: generatedImage
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Ação não especificada ou inválida');

  } catch (error) {
    console.error('Erro no processamento:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar imagem';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
