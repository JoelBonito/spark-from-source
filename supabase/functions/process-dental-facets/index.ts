const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt conservador para análise
const ANALYSIS_PROMPT = `Você é um dentista equilibrado analisando esta foto.

Retorne APENAS este JSON (sem markdown):

{
  "f": [número de 2 a 6],
  "d": ["11","21"],
  "m": "leve|moderada|severa",
  "c": "baixa|média|alta",
  "conf": [0.7 a 1.0]
}

REGRAS CRÍTICAS - SEJA CONSERVADOR:

1. FACETAS (f):
   - Padrão comum: 4 facetas
   - Apenas incisivos: ["11","21","12","22"]
   - Caninos (13,23): APENAS se descoloração ÓBVIA
   - NUNCA mais de 6 facetas
   - Se dúvida: prefira menos

2. MANCHAS (m):
   - "leve": amarelamento suave (MAIORIA)
   - "moderada": descoloração visível
   - "severa": APENAS manchas muito escuras

3. COMPLEXIDADE (c):
   - "baixa": manchas leves (MAIORIA)
   - "média": manchas moderadas + pequenos problemas
   - "alta": RARAMENTE - casos realmente graves

4. TESTE MENTAL:
   "Clareamento resolve 70% deste caso?"
   Se SIM → complexidade baixa, manchas leves

SEJA HONESTO E CONSERVADOR. Não exagere problemas.

Retorne JSON agora.`;

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

      // Calcular valores baseado nos preços dos serviços
      const baseService = servicePrices?.find((s: any) => s.base) || { price: 700 };
      const clarService = servicePrices?.find((s: any) => s.name.toLowerCase().includes('clareamento')) || { price: 800 };
      
      const facetasValue = analysis.f * baseService.price;
      const needsClareamento = analysis.m !== 'ausente';
      const clareamentoValue = needsClareamento ? clarService.price : 0;
      const totalValue = facetasValue + clareamentoValue;

      console.log('Análise concluída:', analysis);

      return new Response(
        JSON.stringify({
          analysis,
          valores: {
            facetas: facetasValue,
            clareamento: clareamentoValue,
            total: totalValue
          },
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
      const simulationPrompt = `Crie uma simulação fotorrealista de facetas dentárias.

CONTEXTO DA ANÁLISE:
- Facetas: ${analysisData.f}
- Dentes: ${analysisData.d.join(', ')}
- Complexidade: ${analysisData.c}

INSTRUÇÕES:
1. Aplique facetas APENAS nos dentes: ${analysisData.d.join(', ')}
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
