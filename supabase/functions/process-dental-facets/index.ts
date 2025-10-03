const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Utilitários para extrair informações de um relatório técnico de facetas.
 * As seções "DENTES A SEREM TRATADOS" e "ESPECIFICAÇÕES TÉCNICAS" variam conforme o caso.
 * Esta função lê o texto completo do relatório e devolve um objeto com a lista de dentes
 * (códigos FDI) e um mapa das especificações técnicas encontradas.
 */
function parseReport(report: string) {
  const result: { dentes_tratados: string[]; especificacoes: Record<string, string> } = {
    dentes_tratados: [],
    especificacoes: {},
  };
  
  if (!report || typeof report !== 'string') {
    return result;
  }

  const text = report.replace(/\r/g, '');
  
  // ========================================
  // EXTRAÇÃO DE DENTES
  // ========================================
  // Extrair a seção de dentes entre "DENTES A SEREM TRATADOS" e "ESPECIFICAÇÕES TÉCNICAS"
  let dentesSection = '';
  const dentesMatch = text.match(/DENTES\s+A\s+SEREM\s+TRATADOS([\s\S]*?)ESPECIFICA[ÇC][ÕO]ES\s+T[ÉE]CNICAS/i);
  
  if (dentesMatch) {
    dentesSection = dentesMatch[1];
  } else {
    // Fallback: tenta pegar tudo após o título até a próxima quebra dupla
    const idx = text.search(/DENTES\s+A\s+SEREM\s+TRATADOS/i);
    if (idx >= 0) {
      const rest = text.substring(idx);
      const parts = rest.split(/\n\n/);
      if (parts.length > 1) {
        dentesSection = parts[1];
      }
    }
  }
  
  if (dentesSection) {
    // Procurar por códigos FDI entre parênteses: (11), (21), (12), etc.
    const teethRegex = /\((\d{2})\)/g;
    const teeth = [] as string[];
    let m;
    while ((m = teethRegex.exec(dentesSection)) !== null) {
      teeth.push(m[1]);
    }
    result.dentes_tratados = teeth;
  }
  
  // ========================================
  // EXTRAÇÃO DE ESPECIFICAÇÕES TÉCNICAS
  // ========================================
  let specsSection = '';
  const specsMatch = text.match(/ESPECIFICA[ÇC][ÕO]ES\s+T[ÉE]CNICAS([\s\S]*?)(PLANEJAMENTO\s+DO\s+TRATAMENTO|CUIDADOS\s+P[ÓO]S|PROGN[ÓO]STICO|CONTRAINDICA[ÇC][ÕO]ES|OBSERVA[ÇC][ÕO]ES|IMPORTANTE|$)/i);
  
  if (specsMatch) {
    specsSection = specsMatch[1];
  } else {
    // Fallback: pega até o final do texto
    const idxSpec = text.search(/ESPECIFICA[ÇC][ÕO]ES\s+T[ÉE]CNICAS/i);
    if (idxSpec >= 0) {
      specsSection = text.substring(idxSpec);
    }
  }
  
  if (specsSection) {
    const lines = specsSection.split(/\n/).map((l) => l.trim()).filter((l) => l);
    
    for (const line of lines) {
      // Remover asteriscos e dividir por ':'
      const cleanLine = line.replace(/^\*+\s*/g, '').replace(/\*+/g, '').trim();
      const colonIndex = cleanLine.indexOf(':');
      
      if (colonIndex === -1) continue;
      
      const label = cleanLine.substring(0, colonIndex).trim();
      const value = cleanLine.substring(colonIndex + 1).trim().replace(/\.$/, '');
      
      // Normalizar label para comparação (remover acentos e caracteres especiais)
      const key = label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/[^a-z\s]/g, '')
        .trim();
      
      // Mapear para os campos esperados
      if (/material/.test(key)) {
        result.especificacoes.material = value;
      } else if (/tecnica/.test(key)) {
        result.especificacoes.tecnica = value;
      } else if (/espessura/.test(key)) {
        result.especificacoes.espessura = value;
      } else if (/preparo/.test(key)) {
        result.especificacoes.preparo = value;
      } else if (/cor/.test(key)) {
        result.especificacoes.cor = value;
      } else if (/cimenta/.test(key)) {
        result.especificacoes.cimentacao = value;
      }
    }
  }
  
  return result;
}

/**
 * Constrói o prompt para a simulação com base nos dentes a serem tratados e nas especificações técnicas.
 * Se nenhum dente for listado, retorna instruções apenas de clareamento.
 */
function buildSimulationPrompt(
  extracted: { dentes_tratados: string[]; especificacoes: Record<string, string> }
): string {
  const { dentes_tratados, especificacoes } = extracted;
  
  // Caso sem facetas: apenas clareamento
  if (!dentes_tratados || dentes_tratados.length === 0) {
    return `Crie uma simulação fotorrealista de clareamento dental.\n\n` +
      `CONTEXTO:\n` +
      `- Nenhuma faceta indicada; realizar apenas clareamento dos dentes visíveis.\n\n` +
      `INSTRUÇÕES:\n` +
      `1. Clareie uniformemente todos os dentes visíveis, mantendo forma e proporções originais.\n` +
      `2. O resultado deve ser natural e realista.\n\n` +
      `PRESERVAR COMPLETAMENTE:\n` +
      `- Textura e tom da pele facial\n` +
      `- Estrutura do cabelo\n` +
      `- Cor e formato dos olhos\n` +
      `- Expressão facial\n` +
      `- Iluminação e sombras\n` +
      `- Fundo e ambiente\n` +
      `- Características únicas do paciente\n\n` +
      `Gere a imagem agora.`;
  }
  
  const dentesStr = dentes_tratados.join(', ');
  const specLines: string[] = [];
  
  if (especificacoes.material) specLines.push(`* Material: ${especificacoes.material}`);
  if (especificacoes.tecnica) specLines.push(`* Técnica: ${especificacoes.tecnica}`);
  if (especificacoes.espessura) specLines.push(`* Espessura: ${especificacoes.espessura}`);
  if (especificacoes.preparo) specLines.push(`* Preparo: ${especificacoes.preparo}`);
  if (especificacoes.cor) specLines.push(`* Cor sugerida: ${especificacoes.cor}`);
  if (especificacoes.cimentacao) specLines.push(`* Cimentação: ${especificacoes.cimentacao}`);
  
  const specsText = specLines.join('\n');
  
  return `Crie uma simulação fotorrealista de facetas dentárias.\n\n` +
    `CONTEXTO DA ANÁLISE:\n` +
    `- Dentes: ${dentesStr}\n\n` +
    `INSTRUÇÕES:\n` +
    `1. Aplique facetas APENAS nos dentes: ${dentesStr}\n` +
    `2. Utilize as especificações técnicas fornecidas abaixo.\n` +
    `3. Mantenha as bordas incisais translúcidas e preserve formato e proporção naturais.\n` +
    `4. O resultado deve ser fotorrealista.\n\n` +
    `ESPECIFICAÇÕES TÉCNICAS:\n` +
    `${specsText}\n\n` +
    `PRESERVAR COMPLETAMENTE:\n` +
    `- Textura e tom da pele facial\n` +
    `- Estrutura do cabelo\n` +
    `- Cor e formato dos olhos\n` +
    `- Expressão facial\n` +
    `- Iluminação e sombras\n` +
    `- Fundo e ambiente\n` +
    `- Características únicas do paciente\n\n` +
    `Gere a imagem agora.`;
}

// Prompt fixo para análise detalhada
const ANALYSIS_PROMPT = `Você é um dentista especialista em odontologia estética com 15 anos de experiência, conhecido por ser EQUILIBRADO, ÉTICO e CONSERVADOR.\n\n` +
  `Analise esta foto e retorne um JSON completo com relatório técnico detalhado.\n\n` +
  `═══════════════════════════════════════════════════════\n` +
  `REGRAS CRÍTICAS - SEJA CONSERVADOR:\n` +
  `═══════════════════════════════════════════════════════\n\n` +
  `1. FACETAS:\n` +
  `   - Padrão comum: 4 facetas (apenas incisivos: 11, 21, 12, 22)\n` +
  `   - Máximo: 6 facetas (se caninos realmente necessários)\n` +
  `   - Caninos (13, 23): APENAS se descoloração ÓBVIA\n` +
  `   - NUNCA: pré-molares (14, 24)\n\n` +
  `2. MANCHAS:\n` +
  `   - "leve": amarelamento suave (MAIORIA)\n` +
  `   - "moderada": descoloração visível\n` +
  `   - "severa": RARO - manchas muito escuras\n\n` +
  `3. COMPLEXIDADE:\n` +
  `   - "baixa": manchas leves, estrutura boa (MAIORIA)\n` +
  `   - "média": manchas moderadas + pequenos problemas\n` +
  `   - "alta": RARO - casos graves\n\n` +
  `4. TESTE MENTAL:\n` +
  `   "Clareamento resolve 70% deste caso?"\n` +
  `   Se SIM → complexidade baixa\n\n` +
  `═══════════════════════════════════════════════════════\n` +
  `ESTRUTURA DO JSON (COMPLETA):\n` +
  `═══════════════════════════════════════════════════════\n\n` +
  `{\n` +
  `  "analise_resumo": {\n` +
  `    "facetas_necessarias": 4,\n` +
  `    "dentes_identificados": ["11", "21", "12", "22"],\n` +
  `    "manchas": "leve",\n` +
  `    "complexidade": "baixa",\n` +
  `    "confianca": 0.85\n` +
  `  },\n` +
  `  "valores": {\n` +
  `    "facetas": 2800,\n` +
  `    "clareamento": 800,\n` +
  `    "total": 3600\n` +
  `  },\n` +
  `  "relatorio_tecnico": {\n` +
  `    ...\n` +
  `  }\n` +
  `}\n\n` +
  `═══════════════════════════════════════════════════════\n` +
  `IMPORTANTE:\n` +
  `═══════════════════════════════════════════════════════\n\n` +
  `- Seja DETALHADO no relatório técnico\n` +
  `- Análise dente por dente COMPLETA\n` +
  `- Justificativas técnicas específicas\n` +
  `- NÃO inclua opções de pagamento (clínica decide)\n` +
  `- Valores fixos: R$ 700/faceta, R$ 800 clareamento\n` +
  `- Seja conservador: prefira MENOS facetas\n` +
  `- Complexidade baixa para casos comuns\n\n` +
  `Retorne APENAS o JSON (sem markdown, sem explicações).`;

// Servidor principal da Edge Function
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { imageBase64, action, analysisData, reportText, config } = body;
    
    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY não configurada');
      throw new Error('API Key não configurada');
    }

    // ========================================
    // ANÁLISE DA IMAGEM
    // ========================================
    if (action === 'analyze') {
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: ANALYSIS_PROMPT },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          max_tokens: 4000,
        }),
      });
      
      if (!analysisResponse.ok) {
        const text = await analysisResponse.text();
        console.error('Erro na análise:', analysisResponse.status, text);
        throw new Error(`Erro na análise: ${analysisResponse.status}`);
      }
      
      const analysisResult = await analysisResponse.json();
      const raw = analysisResult.choices?.[0]?.message?.content || '';
      
      // Limpar markdown e extrair JSON do texto
      let cleaned = raw.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '').trim();
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta do modelo não contém JSON válido');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error('Falha ao parsear JSON:', err);
        throw new Error('Falha ao parsear resposta JSON');
      }
      
      return new Response(
        JSON.stringify({ analysis: parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    // ========================================
    // GERAÇÃO DE SIMULAÇÃO VISUAL
    // ========================================
    if (action === 'generate') {
      // reportText deve conter o relatório técnico completo
      const report = reportText || analysisData?.relatorio_completo || '';
      const extracted = parseReport(report);
      
      console.log('Dentes extraídos:', extracted.dentes_tratados);
      console.log('Especificações extraídas:', extracted.especificacoes);
      
      const simulationPrompt = buildSimulationPrompt(extracted);
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: simulationPrompt },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          modalities: ['image', 'text'],
          ...(config && {
            temperature: config.temperature,
            top_k: config.topK,
            top_p: config.topP,
            max_tokens: config.maxOutputTokens,
          }),
        }),
      });
      
      if (!imageResponse.ok) {
        const text = await imageResponse.text();
        console.error('Erro ao gerar imagem:', imageResponse.status, text);
        throw new Error(`Erro na geração de imagem: ${imageResponse.status}`);
      }
      
      const imageResult = await imageResponse.json();
      const generatedImage = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!generatedImage) {
        throw new Error('Nenhuma imagem foi gerada');
      }
      
      return new Response(
        JSON.stringify({
          processedImageBase64: generatedImage,
          simulationData: extracted,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    throw new Error('Ação não especificada ou inválida');
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('Erro no processamento:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
