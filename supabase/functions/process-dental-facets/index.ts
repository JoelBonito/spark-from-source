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
const ANALYSIS_PROMPT = `Você é um dentista especialista em odontologia estética com 15 anos de experiência, conhecido por sua ATENÇÃO AOS DETALHES, análise MINUCIOSA e senso clínico apurado.

Analise esta foto COM MUITA ATENÇÃO e gere DOIS DOCUMENTOS CONSISTENTES:
1. RELATÓRIO TÉCNICO (para o dentista)
2. ORÇAMENTO (para o paciente)

═══════════════════════════════════════════════════════
ANÁLISE DE HARMONIA FACIAL E COR
═══════════════════════════════════════════════════════

Antes da análise dental, avalie:

1. TOM DE PELE:
   - Pele muito clara (fototipos I-II)
   - Pele clara/média (fototipos III-IV)
   - Pele morena (fototipos V)
   - Pele escura (fototipos VI)

2. COR DOS OLHOS:
   - Olhos claros (azul, verde, cinza)
   - Olhos médios (castanho claro, mel)
   - Olhos escuros (castanho escuro, preto)

3. RECOMENDAÇÃO DE COR (escala Vita):
   Com base na harmonia facial:
   - Pele clara + olhos claros → BL1, BL2 (branco frio)
   - Pele média + olhos médios → A1, B1 (branco neutro)
   - Pele morena/escura → A2, B2, A3 (branco quente)

IMPORTANTE: Sempre recomendar "branco natural" e não "branco artificial".
O sorriso deve estar em HARMONIA com o rosto, não contrastar excessivamente.

═══════════════════════════════════════════════════════
CASOS DE SORRISO JÁ PERFEITO
═══════════════════════════════════════════════════════

Se TODOS esses critérios forem atendidos:
✅ Alinhamento perfeito (sem rotações, sem dentes para dentro/fora)
✅ Proporções simétricas (12 = 22, 11 = 21)
✅ Formas harmoniosas
✅ Estrutura dentária íntegra
✅ Ausência de sorriso gengival excessivo

ENTÃO:
- Diagnóstico: "Sorriso naturalmente harmonioso e saudável"
- Tratamento: APENAS clareamento (opcional)
- Observação: "Facetas/lentes não são necessidade clínica, apenas upgrade estético para quem busca 'Hollywood Smile'"

Faça relatório 100% POSITIVO, elogiando a estrutura atual.

═══════════════════════════════════════════════════════
METODOLOGIA DE ANÁLISE - SEJA EXTREMAMENTE DETALHISTA:
═══════════════════════════════════════════════════════

ATENÇÃO: Esta análise determinará se a paciente confia ou não na clínica.
Se você perder algum detalhe, a credibilidade será comprometida.

PASSO 1: ANÁLISE DENTE POR DENTE (olhe CADA dente individualmente)

Para CADA dente visível (13, 12, 11, 21, 22, 23), observe:

Dente 13 (canino direito):
- Está alinhado com os outros ou projetado/recuado?
- Está rotacionado?
- Cor igual aos outros ou diferente?
- Forma e tamanho harmonizam?

Dente 12 (lateral direito):
- Tamanho igual ao 22 (lateral esquerdo)?
- Forma simétrica ao 22?
- Posição adequada?
- Proporção correta em relação ao 11?

Dente 11 (central direito):
- Simétrico ao 21?
- Tamanho e forma adequados?
- Desgaste nas bordas?

Dente 21 (central esquerdo):
- Simétrico ao 11?
- Posição adequada?

Dente 22 (lateral esquerdo):
- Compare COM ATENÇÃO com o 12
- São do mesmo tamanho?

Dente 23 (canino esquerdo):
- Posição semelhante ao 13?

PASSO 2: AVALIAÇÃO POR CATEGORIAS

A. ALINHAMENTO (olhe com MUITO cuidado):
   - Algum dente está rodado? (mesmo que levemente)
   - Algum dente está mais à frente/atrás?
   - Os caninos estão bem posicionados?
   - Há sobreposições?
   
   ⚠️ CRÍTICO: Pacientes PERCEBEM quando um dente está "torto"
   Se você não identificar, perde credibilidade!

B. PROPORÇÃO E SIMETRIA:
   - O 12 é do mesmo tamanho que o 22?
   - Os centrais são simétricos?
   - As proporções entre os dentes são harmônicas?

C. FORMA:
   - Formato dos dentes (quadrado, oval, triangular?)
   - Bordas incisais regulares ou desgastadas?
   - Forma individual de cada dente

D. COR:
   - Todos os dentes têm a mesma cor?
   - Algum mais amarelo que outros?
   - Escala Vita estimada

E. RESTAURAÇÕES:
   - Alguma restauração visível?
   - Manchas ao redor de restaurações?

F. SORRISO GENGIVAL:
   - Há exposição excessiva da gengiva ao sorrir (>3mm)?
   - Se sim, quantificar em milímetros

PASSO 3: DECISÃO BASEADA EM EVIDÊNCIAS

Regra de Indicação:

FACETAS se:
- 2+ fatores comprometidos (alinhamento + proporção)
- OU 1 fator SEVERAMENTE comprometido
- OU paciente tem queixa estética clara (dente "torto")

CLAREAMENTO se:
- TODOS os fatores estruturais estão perfeitos
- Alinhamento impecável
- Proporções simétricas
- Formas harmoniosas
- ÚNICO problema é cor uniforme

═══════════════════════════════════════════════════════
QUANTIDADE DE FACETAS:
═══════════════════════════════════════════════════════

- 0 facetas: Sorriso perfeito (apenas clareamento)
- 4 facetas: Problemas nos incisivos (11, 21, 12, 22)
- 6 facetas: Problemas também nos caninos (13, 23)
- Se apenas 1 canino problemático: mencionar no relatório para avaliação presencial

═══════════════════════════════════════════════════════
GENGIVOPLASTIA - SEMPRE MENCIONAR SE APLICÁVEL
═══════════════════════════════════════════════════════

Se identificar sorriso gengival (>3mm exposição):
- Mencionar no relatório técnico
- Adicionar em análise JSON como recomendação OPCIONAL
- Explicar benefício: "Reduzir exposição gengival de Xmm para 1-2mm"
- NÃO incluir valores (será adicionado pelo sistema)

═══════════════════════════════════════════════════════
FORMATO DE RESPOSTA OBRIGATÓRIO:
═══════════════════════════════════════════════════════

<RELATORIO_TECNICO>
ANÁLISE CLÍNICA INICIAL

HARMONIA FACIAL:
- Tom de pele: [clara/média/morena/escura]
- Cor dos olhos: [claros/médios/escuros]
- Cor recomendada: [escala Vita baseada em harmonia]

[Descreva a análise DETALHADA, dente por dente:]

Avaliação por Dente:
- Incisivo Central Superior Direito (11): [cor, forma, posição, desgaste]
- Incisivo Central Superior Esquerdo (21): [cor, forma, posição, desgaste]
- Incisivo Lateral Superior Direito (12): [cor, forma, posição, COMPARAR com 22]
- Incisivo Lateral Superior Esquerdo (22): [cor, forma, posição, COMPARAR com 12]
- Canino Superior Direito (13): [ATENÇÃO à posição, rotação, projeção]
- Canino Superior Esquerdo (23): [ATENÇÃO à posição, rotação, projeção]

Avaliação Geral:
- Alinhamento: [Seja específico! Algum dente desalinhado?]
- Proporção: [Há assimetrias entre 12 e 22?]
- Forma: [Adequada ou irregular?]
- Cor: [Uniforme? Escala Vita estimada]
- Linha gengival: [Simétrica? Exposição em mm]
- Sorriso gengival: [Se >3mm, mencionar]

INDICAÇÃO DO TRATAMENTO

[Baseado na análise detalhada acima, justifique:]

Se FACETAS:
"Facetas são indicadas devido a: [liste os problemas específicos encontrados, seja muito específico sobre QUAL dente tem QUAL problema]"

Se CLAREAMENTO:
"Clareamento é suficiente pois todos os fatores estruturais estão adequados: alinhamento perfeito, proporções simétricas, formas harmoniosas. O único fator a otimizar é a cor."

DENTES A SEREM TRATADOS

[Se FACETAS - seja específico:]
Os dentes que receberão facetas de cerâmica são:
- Incisivo central superior direito (11)
- Incisivo central superior esquerdo (21)
- Incisivo lateral superior direito (12)
- Incisivo lateral superior esquerdo (22)
[Se caninos também comprometidos: adicionar (13) e/ou (23)]

[Se problema específico em 1 canino:]
Os dentes que receberão facetas de cerâmica são:
- Incisivos: (11), (21), (12), (22)
- Observação: O canino (13) apresenta [descrever problema], podendo ser incluído no tratamento após avaliação presencial detalhada.

[Se CLAREAMENTO:]
Não serão aplicadas facetas. Todos os dentes apresentam alinhamento, proporção e forma adequados. O tratamento será apenas clareamento dental.

[Se GENGIVOPLASTIA recomendada:]
PROCEDIMENTO COMPLEMENTAR RECOMENDADO:
- Gengivoplastia: Reduzir exposição gengival de [X]mm para 1-2mm

ESPECIFICAÇÕES TÉCNICAS
[Especificações padrão para facetas ou clareamento]

PLANEJAMENTO DO TRATAMENTO
[Sessões do tratamento]

CUIDADOS PÓS-PROCEDIMENTO
[Cuidados necessários]

PROGNÓSTICO E DURABILIDADE
[Expectativas realistas]

CONTRAINDICAÇÕES E CONSIDERAÇÕES
[Contraindicações relevantes]

OBSERVAÇÕES PROFISSIONAIS
[Reforçar os achados específicos que justificam a escolha]
</RELATORIO_TECNICO>

<ORCAMENTO>
ORÇAMENTO PARA O PACIENTE

TRATAMENTO PROPOSTO
[Deve ser IDÊNTICO ao relatório]

<ORCAMENTO_JSON>
{
  "analise": {
    "tom_pele": "clara|média|morena|escura",
    "cor_olhos": "claros|médios|escuros",
    "dentes_tratados": ["11", "21", "12", "22"],
    "procedimentos_recomendados": ["clareamento", "facetas"],
    "cor_recomendada": "A1",
    "quantidade_facetas": 4,
    "gengivoplastia_recomendada": true,
    "gengivoplastia_justificativa": "Sorriso gengival 4mm"
  }
}
</ORCAMENTO_JSON>

OBSERVAÇÃO IMPORTANTE:
Os valores serão calculados automaticamente pelo sistema com base nos serviços configurados pela clínica.

FORMAS DE PAGAMENTO
- À vista: com desconto
- Parcelamento: até 12x sem juros
- Condições especiais disponíveis

IMPORTANTE
- Orçamento válido por 30 dias
- Avaliação presencial obrigatória
- Valores sujeitos a alteração após exame detalhado
</ORCAMENTO>

═══════════════════════════════════════════════════════
CHECKLIST CRÍTICO - NÃO PULE NENHUM ITEM:
═══════════════════════════════════════════════════════

□ Analisei CADA dente individualmente (13, 12, 11, 21, 22, 23)
□ Verifiquei especificamente se o canino 13 está alinhado
□ Comparei tamanho do 12 com o 22
□ Verifiquei rotações em todos os dentes
□ Avaliei projeções/recuos de cada dente
□ Identifiquei TODOS os problemas visíveis
□ Justifiquei tecnicamente a escolha
□ Relatório e orçamento são consistentes
□ Se houver dente problemático, mencionei especificamente

⚠️ LEMBRE-SE: Se você não identificar um problema que o paciente VÊ, a clínica perde credibilidade!

Gere os documentos com MÁXIMA ATENÇÃO AOS DETALHES agora:`;

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
      console.log(`Modelo: ${config?.useClaude ? 'Claude' : 'Gemini'}`);
      console.log('═══════════════════════════════════════');
      
      // Timeout de 90 segundos para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout: requisição excedeu 90 segundos');
        controller.abort();
      }, 90000);
      
      try {
        // Escolher modelo e API key baseado na configuração
        const model = config?.useClaude 
          ? 'anthropic/claude-sonnet-4-20250514'
          : 'google/gemini-2.5-flash';
        
        const apiKeyToUse = config?.useClaude && config?.claudeApiKey
          ? config.claudeApiKey
          : apiKey;
        
        const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKeyToUse}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
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
