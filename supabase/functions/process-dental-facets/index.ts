const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ═════════════════════════════════════════════════════════════════════════
 * EDGE FUNCTION: PROCESSAMENTO DE ANÁLISE DENTAL E SIMULAÇÃO DE FACETAS
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * FLUXO COMPLETO:
 * 
 * 1. ANÁLISE (action='analyze'):
 *    - Envia imagem para Gemini
 *    - Gemini gera 2 DOCUMENTOS EM TEXTO:
 *      a) Relatório Técnico (para dentista) - com seções estruturadas
 *      b) Orçamento (para paciente) - com valores e formas de pagamento
 *    - Retorna: { relatorio_tecnico: "...", orcamento: "..." }
 * 
 * 2. GERAÇÃO (action='generate'):
 *    - Recebe: relatório técnico (texto)
 *    - Extrai automaticamente:
 *      • Seção "DENTES A SEREM TRATADOS" → códigos FDI: (11), (21), etc.
 *      • Seção "ESPECIFICAÇÕES TÉCNICAS" → material, cor, técnica, etc.
 *    - Converte para JSON: { dentes_tratados: [...], especificacoes: {...} }
 *    - Constrói prompt customizado baseado nos dados extraídos
 *    - Gemini gera imagem simulada fotorrealista
 *    - Retorna: { processedImageBase64: "...", simulationData: {...} }
 * 
 * IMPORTANTE:
 * - O ORÇAMENTO não é usado para geração de imagem
 * - Cada caso é diferente (pode ter 0, 4, 6 facetas ou apenas clareamento)
 * - Extração é DINÂMICA, não usa valores fixos
 * ═════════════════════════════════════════════════════════════════════════
 */

/**
 * Extrai informações das seções "DENTES A SEREM TRATADOS" e "ESPECIFICAÇÕES TÉCNICAS"
 * do relatório técnico gerado pelo Gemini.
 * 
 * IMPORTANTE: Esta função NÃO recebe JSON do Gemini, ela EXTRAI de um texto livre!
 */
function parseReport(report: string) {
  const result: { dentes_tratados: string[]; especificacoes: Record<string, string> } = {
    dentes_tratados: [],
    especificacoes: {},
  };
  
  if (!report || typeof report !== 'string') {
    console.warn('Relatório vazio ou inválido');
    return result;
  }

  const text = report.replace(/\r/g, '');
  console.log('📄 Iniciando parsing do relatório...');
  
  // ========================================
  // EXTRAÇÃO DE DENTES
  // ========================================
  console.log('🔍 Procurando seção "DENTES A SEREM TRATADOS"...');
  
  let dentesSection = '';
  const dentesMatch = text.match(/DENTES\s+A\s+SEREM\s+TRATADOS([\s\S]*?)(?=ESPECIFICA[ÇC][ÕO]ES\s+T[ÉE]CNICAS|PLANEJAMENTO|$)/i);
  
  if (dentesMatch) {
    dentesSection = dentesMatch[1];
    console.log('✓ Seção de dentes encontrada');
  } else {
    console.warn('✗ Seção "DENTES A SEREM TRATADOS" não encontrada');
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
    console.log(`✓ Dentes extraídos: [${teeth.join(', ')}]`);
    
    if (teeth.length === 0) {
      console.log('ℹ️  Nenhum dente com código FDI encontrado - Caso de clareamento apenas');
    }
  }
  
  // ========================================
  // EXTRAÇÃO DE ESPECIFICAÇÕES TÉCNICAS
  // ========================================
  console.log('🔍 Procurando seção "ESPECIFICAÇÕES TÉCNICAS"...');
  
  let specsSection = '';
  const specsMatch = text.match(/ESPECIFICA[ÇC][ÕO]ES\s+T[ÉE]CNICAS([\s\S]*?)(?=PLANEJAMENTO\s+DO\s+TRATAMENTO|CUIDADOS\s+P[ÓO]S|PROGN[ÓO]STICO|CONTRAINDICA[ÇC][ÕO]ES|OBSERVA[ÇC][ÕO]ES|IMPORTANTE|$)/i);
  
  if (specsMatch) {
    specsSection = specsMatch[1];
    console.log('✓ Seção de especificações encontrada');
  } else {
    console.warn('✗ Seção "ESPECIFICAÇÕES TÉCNICAS" não encontrada');
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
        console.log(`  - Material: ${value}`);
      } else if (/tecnica/.test(key)) {
        result.especificacoes.tecnica = value;
        console.log(`  - Técnica: ${value}`);
      } else if (/espessura/.test(key)) {
        result.especificacoes.espessura = value;
        console.log(`  - Espessura: ${value}`);
      } else if (/preparo/.test(key)) {
        result.especificacoes.preparo = value;
        console.log(`  - Preparo: ${value}`);
      } else if (/cor/.test(key)) {
        result.especificacoes.cor = value;
        console.log(`  - Cor: ${value}`);
      } else if (/cimenta/.test(key)) {
        result.especificacoes.cimentacao = value;
        console.log(`  - Cimentação: ${value}`);
      }
    }
    
    console.log(`✓ Total de especificações extraídas: ${Object.keys(result.especificacoes).length}`);
  }
  
  console.log('📊 Parsing concluído');
  return result;
}

/**
 * Constrói o prompt para simulação de imagem baseado nos dados extraídos
 */
function buildSimulationPrompt(
  extracted: { dentes_tratados: string[]; especificacoes: Record<string, string> }
): string {
  const { dentes_tratados, especificacoes } = extracted;
  
  console.log('🎨 Construindo prompt de simulação...');
  
  // Caso sem facetas: apenas clareamento
  if (!dentes_tratados || dentes_tratados.length === 0) {
    console.log('→ Tipo: Clareamento apenas (sem facetas)');
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
  
  console.log(`→ Tipo: Facetas nos dentes [${dentes_tratados.join(', ')}]`);
  
  const dentesStr = dentes_tratados.join(', ');
  const specLines: string[] = [];
  
  if (especificacoes.material) specLines.push(`* Material: ${especificacoes.material}`);
  if (especificacoes.tecnica) specLines.push(`* Técnica: ${especificacoes.tecnica}`);
  if (especificacoes.espessura) specLines.push(`* Espessura: ${especificacoes.espessura}`);
  if (especificacoes.preparo) specLines.push(`* Preparo: ${especificacoes.preparo}`);
  if (especificacoes.cor) specLines.push(`* Cor sugerida: ${especificacoes.cor}`);
  if (especificacoes.cimentacao) specLines.push(`* Cimentação: ${especificacoes.cimentacao}`);
  
  const specsText = specLines.length > 0 ? specLines.join('\n') : '(Especificações padrão)';
  
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

// Prompt para gerar AMBOS os documentos (Relatório Técnico + Orçamento)
const ANALYSIS_PROMPT = `Você é um dentista especialista em odontologia estética com 15 anos de experiência, conhecido por ser EQUILIBRADO, ÉTICO e CONSERVADOR.

Analise esta foto e gere DOIS DOCUMENTOS:
1. RELATÓRIO TÉCNICO (para o dentista)
2. ORÇAMENTO (para o paciente)

═══════════════════════════════════════════════════════
REGRAS CRÍTICAS - SEJA CONSERVADOR:
═══════════════════════════════════════════════════════

1. FACETAS:
   - Padrão comum: 4 facetas (apenas incisivos: 11, 21, 12, 22)
   - Máximo: 6 facetas (se caninos realmente necessários)
   - Caninos (13, 23): APENAS se descoloração ÓBVIA
   - NUNCA: pré-molares (14, 24)

2. CASOS SEM FACETAS:
   - Se o caso pode ser resolvido APENAS com clareamento
   - NÃO liste dentes na seção "DENTES A SEREM TRATADOS"
   - Indique apenas "Clareamento dental" no tratamento

3. VALORES FIXOS:
   - Faceta individual: R$ 700,00
   - Clareamento: R$ 800,00
   - Calcule o total automaticamente

═══════════════════════════════════════════════════════
FORMATO DE RESPOSTA OBRIGATÓRIO:
═══════════════════════════════════════════════════════

<RELATORIO_TECNICO>
ANÁLISE CLÍNICA INICIAL
[Descreva a análise completa da imagem - cor, formato, alinhamento, proporções, desgaste, linha gengival, necessidades estéticas e funcionais]

INDICAÇÃO DO TRATAMENTO
[Explique qual tratamento é indicado e por quê. Se for apenas clareamento, justifique. Se forem facetas, explique os benefícios]

DENTES A SEREM TRATADOS
[Se FACETAS forem necessárias, liste os dentes com códigos FDI entre parênteses:]
Os dentes que receberão facetas de cerâmica são:
- Incisivo central superior direito (11)
- Incisivo central superior esquerdo (21)
- Incisivo lateral superior direito (12)
- Incisivo lateral superior esquerdo (22)

[Se APENAS CLAREAMENTO:]
Não serão aplicadas facetas. O tratamento será apenas clareamento dental.

ESPECIFICAÇÕES TÉCNICAS
[Se FACETAS:]
* **Material:** [tipo de cerâmica]
* **Técnica:** [técnica de confecção]
* **Espessura:** [espessura em mm]
* **Preparo:** [tipo de preparo]
* **Cor sugerida:** [escala de cor]
* **Cimentação:** [sistema de cimentação]

[Se APENAS CLAREAMENTO:]
* **Técnica:** Clareamento dental profissional
* **Sistema:** [tipo de clareamento]
* **Cor objetivo:** [escala de cor desejada]

PLANEJAMENTO DO TRATAMENTO
[Descreva as sessões do tratamento - consultas, exames, procedimentos]

CUIDADOS PÓS-PROCEDIMENTO
[Liste os cuidados necessários após o tratamento]

PROGNÓSTICO E DURABILIDADE
[Descreva expectativa de durabilidade e taxa de sucesso]

CONTRAINDICAÇÕES E CONSIDERAÇÕES
[Liste contraindicações e considerações importantes]

OBSERVAÇÕES PROFISSIONAIS
[Observações finais do especialista]
</RELATORIO_TECNICO>

<ORCAMENTO>
ORÇAMENTO PARA O PACIENTE

TRATAMENTO PROPOSTO
[Descreva de forma simples e clara o tratamento proposto]

DETALHAMENTO DE VALORES

[Se FACETAS:]
Facetas de Cerâmica:
- Quantidade: [X] unidades
- Valor unitário: R$ 700,00
- Subtotal: R$ [X * 700],00

Clareamento Dental:
- Valor: R$ 800,00

VALOR TOTAL: R$ [total],00

[Se APENAS CLAREAMENTO:]
Clareamento Dental Profissional:
- Valor: R$ 800,00

VALOR TOTAL: R$ 800,00

FORMAS DE PAGAMENTO
[A clínica definirá as opções de parcelamento disponíveis]

IMPORTANTE
- Orçamento válido por 30 dias
- Valores sujeitos a alteração após avaliação clínica presencial
- Consulta de avaliação obrigatória
</ORCAMENTO>

═══════════════════════════════════════════════════════
IMPORTANTE:
═══════════════════════════════════════════════════════

- Seja DETALHADO no relatório técnico
- Seja CLARO e OBJETIVO no orçamento
- Use as tags <RELATORIO_TECNICO> e <ORCAMENTO> para separar os documentos
- Mantenha os títulos das seções EM MAIÚSCULAS
- Coloque códigos FDI SEMPRE entre parênteses: (11), (21), etc.
- Use asteriscos nas especificações: * **Campo:** valor
- Se apenas clareamento, NÃO liste dentes com códigos FDI
- Seja conservador: prefira MENOS facetas

Gere os dois documentos agora:`;

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
    // ANÁLISE: Gera relatório técnico + orçamento
    // ========================================
    if (action === 'analyze') {
      console.log('═══════════════════════════════════════');
      console.log('AÇÃO: ANÁLISE (gerar documentos)');
      console.log('═══════════════════════════════════════');
      
      // Timeout de 90 segundos para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout: requisição excedeu 90 segundos');
        controller.abort();
      }, 90000);
      
      try {
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
            max_tokens: 10000,  // AUMENTADO de 4000 para 10000
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!analysisResponse.ok) {
          const text = await analysisResponse.text();
          console.error('✗ Erro na análise:', analysisResponse.status, text);
          throw new Error(`Erro na análise: ${analysisResponse.status}`);
        }
        
        const analysisResult = await analysisResponse.json();
        const fullResponse = analysisResult.choices?.[0]?.message?.content || '';
        
        if (!fullResponse) {
          throw new Error('Gemini não retornou conteúdo');
        }
        
        console.log('✓ Resposta recebida do Gemini');
        console.log(`📝 Tamanho total: ${fullResponse.length} caracteres`);
        
        // Verificar se a resposta foi truncada
        const finishReason = analysisResult.choices?.[0]?.finish_reason;
        if (finishReason === 'length') {
          console.warn('⚠️ AVISO: Resposta truncada devido a max_tokens');
          console.warn('⚠️ Considere aumentar max_tokens ou simplificar o prompt');
        }
        
        // Extrair os dois documentos usando as tags
        const relatorioMatch = fullResponse.match(/<RELATORIO_TECNICO>([\s\S]*?)<\/RELATORIO_TECNICO>/i);
        const orcamentoMatch = fullResponse.match(/<ORCAMENTO>([\s\S]*?)<\/ORCAMENTO>/i);
        
        const relatorioTecnico = relatorioMatch ? relatorioMatch[1].trim() : fullResponse;
        const orcamento = orcamentoMatch ? orcamentoMatch[1].trim() : '';
        
        if (!relatorioTecnico) {
          throw new Error('Relatório técnico não encontrado na resposta');
        }
        
        // Validar se os documentos estão completos
        if (relatorioTecnico.length < 500) {
          console.warn('⚠️ AVISO: Relatório técnico muito curto, pode estar incompleto');
        }
        
        console.log('✓ Relatório Técnico extraído');
        console.log(`  Tamanho: ${relatorioTecnico.length} caracteres`);
        
        if (orcamento) {
          console.log('✓ Orçamento extraído');
          console.log(`  Tamanho: ${orcamento.length} caracteres`);
        } else {
          console.warn('⚠️ Orçamento não encontrado - usando resposta completa');
        }
        
        // Retornar ambos os documentos
        return new Response(
          JSON.stringify({ 
            relatorio_tecnico: relatorioTecnico,
            orcamento: orcamento || fullResponse,
            success: true,
            metadata: {
              total_chars: fullResponse.length,
              finish_reason: finishReason,
              truncated: finishReason === 'length'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        );
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Requisição cancelada por timeout (90s). Tente novamente ou simplifique a análise.');
        }
        
        throw error;
      }
    }

    // ========================================
    // GERAÇÃO: Extrai dados do relatório e gera simulação
    // ========================================
    if (action === 'generate') {
      console.log('═══════════════════════════════════════');
      console.log('AÇÃO: GERAÇÃO (criar imagem simulada)');
      console.log('═══════════════════════════════════════');
      
      // Obter o relatório técnico (texto)
      // Aceita múltiplos formatos para retrocompatibilidade
      const report = reportText || 
                     analysisData?.relatorio_tecnico || 
                     analysisData?.report || 
                     '';
      
      if (!report) {
        throw new Error('Relatório técnico não fornecido para geração');
      }
      
      console.log(`📄 Relatório recebido: ${report.length} caracteres`);
      
      // EXTRAIR dados das seções relevantes
      // (Orçamento é IGNORADO - não é usado para geração de imagem)
      const extracted = parseReport(report);
      
      // Construir prompt de simulação
      const simulationPrompt = buildSimulationPrompt(extracted);
      
      console.log('🚀 Enviando para geração de imagem...');
      
      // Timeout de 120 segundos para geração de imagem (mais demorada)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout: geração de imagem excedeu 120 segundos');
        controller.abort();
      }, 120000);
      
      try {
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
            max_tokens: 8000,  // Tokens suficientes para geração de imagem
            ...(config && {
              temperature: config.temperature,
              top_k: config.topK,
              top_p: config.topP,
              max_tokens: config.maxOutputTokens,
            }),
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!imageResponse.ok) {
          const text = await imageResponse.text();
          console.error('✗ Erro ao gerar imagem:', imageResponse.status, text);
          throw new Error(`Erro na geração de imagem: ${imageResponse.status}`);
        }
        
        const imageResult = await imageResponse.json();
        const generatedImage = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!generatedImage) {
          console.error('❌ Resposta do modelo não contém imagem');
          console.error('Estrutura recebida:', JSON.stringify(imageResult, null, 2));
          throw new Error('Nenhuma imagem foi gerada pelo modelo');
        }
        
        console.log('✓ Imagem simulada gerada com sucesso');
        console.log(`ℹ️  Dentes tratados: [${extracted.dentes_tratados.join(', ') || 'nenhum - clareamento apenas'}]`);
        
        return new Response(
          JSON.stringify({
            processedImageBase64: generatedImage,
            simulationData: extracted,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        );
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Geração de imagem cancelada por timeout (120s). Tente novamente.');
        }
        
        throw error;
      }
    }

    throw new Error('Ação não especificada ou inválida');
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('═══════════════════════════════════════');
    console.error('❌ ERRO NO PROCESSAMENTO');
    console.error('═══════════════════════════════════════');
    console.error('Mensagem:', message);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('═══════════════════════════════════════');
    
    return new Response(
      JSON.stringify({ 
        error: message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
