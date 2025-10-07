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
 * - NOVO PROMPT: Pró-conversão equilibrado, prefere 4 facetas quando possível
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

// ═══════════════════════════════════════════════════════════════════════
// NOVO PROMPT: Equilibrado e Pró-Conversão (Prefere 4 Facetas)
// ═══════════════════════════════════════════════════════════════════════
const ANALYSIS_PROMPT = `Você é dentista especialista em odontologia estética. Escreva em PT-BR.

Missão comercial: propor o menor tratamento capaz de entregar um "sorriso perfeito" de forma crível e eficiente em custo.
Sorriso perfeito alvo: incisivos (11, 21, 12, 22) simétricos e proporcionais, linha incisal harmoniosa, alinhamento sem rotações/projeções perceptíveis, cor natural clara (BL2–BL3) e aspecto uniforme.

Regras cruciais:
- Avaliar apenas 13, 12, 11, 21, 22, 23.
- Visibilidade por dente: OK, NAO_VISIVEL ou AUSENTE. Não inferir quando NAO_VISIVEL/AUSENTE.
- Se iluminação prejudicar cor, declare "cor indeterminada pela iluminação".
- Use algarismos e moeda no formato brasileiro (ex.: R$ 1.400,00).
- "ESPECIFICAÇÕES TÉCNICAS" deve ter linhas "Label: Valor".
- Em "DENTES A SEREM TRATADOS", liste códigos FDI entre parênteses, separados por vírgula e espaço: (11), (21), (12), (22), (13), (23).
- O orçamento DEVE usar exatamente a lista e a contagem de códigos FDI listados em "DENTES A SEREM TRATADOS".

Escala de severidade por dente (0–3):
- Alinhamento (A): rotação/projeção/recuo — 0 alinhado; 1 leve; 2 moderado visível; 3 severo evidente
- Proporção/Simetria (P): 12 vs 22; 11 vs 21; relação de tamanhos — 0 harmônica; 1 leve; 2 moderada; 3 marcante
- Forma (S): bordas, fraturas, irregularidades — 0 adequada; 1 leve; 2 moderada; 3 severa
- Cor (C) é global; não indica facetas sozinha.

Política de decisão pró-conversão (equilibrada):
1) CLAREAMENTO apenas se: incisivos têm burden estrutural mínimo (0–1 leve isolada, sem impacto estético) e o problema principal é cor.
2) 4 FACETAS (11, 21, 12, 22) se QUALQUER:
   - ≥2 incisivos com A/P/S em nível moderado (≥2); OU
   - 1 incisor com A/P/S severo (3); OU
   - Assimetria perceptível 12 vs 22 + outro fator leve/moderado nos incisivos; OU
   - Soma de leves (várias notas 1) que ainda não alcançam o "alvo" mesmo com clareamento → prefira 4 (não 6).
3) 6 FACETAS (adicionar 13, 23) somente se: pelo menos 1 canino com A≥2 impactando a estética frontal (rotação/projeção visível). Se apenas 1 canino for duvidoso, mantenha 4, descreva a dúvida e sugira avaliação presencial.
4) Empate/Borderline: escolha UMA opção final priorizando 4 facetas (não 6) OU clareamento quando a estrutura já atende ao alvo. Registre a alternativa conservadora em "Observações Profissionais".

Preços fixos:
- Faceta: R$ 700,00 (cada)
- Clareamento: R$ 800,00
- Total facetas = quantidade × R$ 700,00; Total geral = Total facetas + R$ 800,00 (se houver facetas) ou R$ 800,00 (se apenas clareamento).

FORMATO DE SAÍDA (obrigatório):

<RELATORIO_TECNICO>
ANÁLISE CLÍNICA INICIAL

Avaliação por Dente:
- Incisivo Central Superior Direito (11): [cor; forma; posição; desgaste; visibilidade: OK/NAO_VISIVEL/AUSENTE; severidade A/P/S: x/x/x]
- Incisivo Central Superior Esquerdo (21): [...]
- Incisivo Lateral Superior Direito (12): [comparar com 22; severidade A/P/S]
- Incisivo Lateral Superior Esquerdo (22): [comparar com 12; severidade A/P/S]
- Canino Superior Direito (13): [posição/rotação/projeção; severidade A/P/S]
- Canino Superior Esquerdo (23): [posição/rotação/projeção; severidade A/P/S]

Avaliação Geral:
- Alinhamento: [...]
- Proporção e simetria: [12 vs 22; 11 vs 21]
- Forma: [...]
- Cor: [tendência; escala Vita aproximada ou "indeterminada pela iluminação"]
- Linha gengival: [...]
- Qualidade/visibilidade da imagem: [curto]

Evidências para decisão (curtas):
- (achado → dente → impacto no sorriso)
- (achado → dente → impacto no sorriso)
- (achado → dente → impacto no sorriso)
- Contraponto: [o que reduziria intervenção]

INDICAÇÃO DO TRATAMENTO
- Opção indicada (uma): [FACETAS (4 ou 6) OU CLAREAMENTO] — justificar em 1–2 frases.

DENTES A SEREM TRATADOS
[Se FACETAS]
Os dentes que receberão facetas de cerâmica são (FDI):
(11), (21), (12), (22)[, (13), (23) se indicado]
[Se dúvida apenas em 1 canino, manter 4 facetas e detalhar a dúvida]
[Se CLAREAMENTO]
Não serão aplicadas facetas (lista vazia).

ESPECIFICAÇÕES TÉCNICAS
Material: [ex.: Cerâmica E-max]
Técnica: [ex.: Facetas laminadas ultrafinas]
Espessura: [ex.: 0,3–0,5 mm]
Preparo: [ex.: minimamente invasivo]
Cor: [ex.: BL2–BL3]
Cimentação: [ex.: Resina dual fotopolimerizável]

PLANEJAMENTO DO TRATAMENTO
[Sessões resumidas]

CUIDADOS PÓS-PROCEDIMENTO
[Cuidados necessários]

PROGNÓSTICO E DURABILIDADE
[Expectativas realistas]

CONTRAINDICAÇÕES E CONSIDERAÇÕES
[Relevantes ao caso]

OBSERVAÇÕES PROFISSIONAIS
[Registrar alternativa conservadora e incertezas, se houver]
</RELATORIO_TECNICO>

<ORCAMENTO>
ORÇAMENTO PARA O PACIENTE

TRATAMENTO PROPOSTO
[Repita exatamente a indicação (FACETAS com lista FDI ou CLAREAMENTO) do relatório]

DETALHAMENTO DE VALORES
[Se FACETAS]
Facetas de Cerâmica:
- Quantidade: X            // X = número de códigos FDI listados em "DENTES A SEREM TRATADOS"
- Dentes: (lista FDI exatamente como no relatório)
- Valor unitário: R$ 700,00
- Subtotal Facetas: R$ [X × 700],00

Clareamento Dental (incluído):
- Valor: R$ 800,00

VALOR TOTAL: R$ [(X × 700) + 800],00

[Se CLAREAMENTO]
Clareamento Dental Profissional:
- Consultório + caseiro supervisionado
- Valor: R$ 800,00

VALOR TOTAL: R$ 800,00

FORMAS DE PAGAMENTO
- À vista: 10% de desconto
- Parcelamento: até 12x sem juros
- Condições especiais disponíveis

IMPORTANTE
- Orçamento válido por 30 dias
- Avaliação presencial obrigatória
- Valores sujeitos a alteração após exame detalhado
</ORCAMENTO>

[EXEMPLOS DE REFERÊNCIA — NÃO COPIAR; APENAS GUIA DE DECISÃO]

Exemplo A — CLAREAMENTO APENAS
<RELATORIO_TECNICO>
Avaliação por Dente:
- 11: cor amarelada uniforme; forma/posição adequadas; visibilidade: OK; severidade A/P/S: 0/0/0
- 21: idem 11; severidade A/P/S: 0/0/0
- 12: similar ao 22; posição alinhada; severidade: 0/0/0
- 22: similar ao 12; severidade: 0/0/0
- 13: posição adequada; severidade: 0/0/0
- 23: posição adequada; severidade: 0/0/0
Avaliação Geral: estrutura harmônica; cor amarelada A2–A3; linha gengival simétrica
Evidências: cor é o principal fator; estrutura ok; caninos sem impacto frontal
Contraponto: leve translucidez fisiológica
INDICAÇÃO DO TRATAMENTO: CLAREAMENTO
DENTES A SEREM TRATADOS: Não serão aplicadas facetas (lista vazia).
ESPECIFICAÇÕES TÉCNICAS
Técnica: Clareamento combinado (consultório + caseiro)
Cor: alvo BL2–BL3
</RELATORIO_TECNICO>
<ORCAMENTO>
Clareamento Dental Profissional:
- Valor: R$ 800,00
VALOR TOTAL: R$ 800,00
</ORCAMENTO>

Exemplo B — 4 FACETAS + CLAREAMENTO
<RELATORIO_TECNICO>
Avaliação por Dente:
- 11: borda incisal irregular; severidade: 1/1/2
- 21: microfraturas/incisal irregular; severidade: 1/1/2
- 12: assimetria vs 22 (largura/altura); leve vestibularização; severidade: 1/2/1
- 22: diferença de contorno vs 12; severidade: 0/2/1
- 13: sem impacto frontal; 0/0/0
- 23: sem impacto frontal; 0/0/0
Avaliação Geral: assimetria 12 vs 22 e irregularidade de forma nos centrais; cor A3
Evidências: P=2 nos laterais; S=2 nos centrais; caninos estáveis
Contraponto: pequenas resinas não resolvem simetria/linha incisal
INDICAÇÃO DO TRATAMENTO: FACETAS (4) + CLAREAMENTO
DENTES A SEREM TRATADOS (FDI): (11), (21), (12), (22)
ESPECIFICAÇÕES TÉCNICAS
Material: Cerâmica E-max
Cor: BL2–BL3
</RELATORIO_TECNICO>
<ORCAMENTO>
Facetas: Quantidade: 4 | Dentes: (11), (21), (12), (22) | Unitário: R$ 700,00 | Subtotal: R$ 2.800,00
Clareamento: R$ 800,00
VALOR TOTAL: R$ 3.600,00
</ORCAMENTO>

Exemplo C — 6 FACETAS + CLAREAMENTO (caninos com impacto frontal)
<RELATORIO_TECNICO>
Avaliação por Dente:
- 11: S=2 (borda irregular); 12: A=2/P=2; 21: S=2; 22: P=2; 
- 13: A=2 (rotação/projeção com impacto frontal); 23: A=2 (rotação leve-moderada)
Avaliação Geral: rotações/projeções em caninos perceptíveis; assimetria 12 vs 22; cor A3 heterogênea
Evidências: caninos A=2 impactando estética; S=2 em centrais; P=2 em laterais
Contraponto: resina não resolve rotação/linhas; longevidade inferior
INDICAÇÃO DO TRATAMENTO: FACETAS (6) + CLAREAMENTO
DENTES A SEREM TRATADOS (FDI): (11), (21), (12), (22), (13), (23)
ESPECIFICAÇÕES TÉCNICAS
Material: Cerâmica E-max
Cor: BL2–BL3
</RELATORIO_TECNICO>
<ORCAMENTO>
Facetas: Quantidade: 6 | Dentes: (11), (21), (12), (22), (13), (23) | Unitário: R$ 700,00 | Subtotal: R$ 4.200,00
Clareamento: R$ 800,00
VALOR TOTAL: R$ 5.000,00
</ORCAMENTO>

[/EXEMPLOS DE REFERÊNCIA — NÃO COPIAR]`;

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
            max_tokens: 10000,
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
        
        if (error instanceof Error && error.name === 'AbortError') {
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
            max_tokens: 8000,
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
        
        if (error instanceof Error && error.name === 'AbortError') {
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
