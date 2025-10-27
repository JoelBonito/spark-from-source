// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ═════════════════════════════════════════════════════════════════════════
 * EDGE FUNCTION: PROCESSAMENTO DE ANÁLISE DENTAL (FACETAS + CLAREAMENTO)
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * VERSÃO INDEPENDENTE - USA GOOGLE GEMINI DIRETAMENTE
 * 
 * Não depende do gateway Lovable AI
 * Usa a API oficial do Google Gemini
 * ═════════════════════════════════════════════════════════════════════════
 */

// Logger estruturado
function createLogger(runId: string) {
  const prefix = `[${runId.substring(0, 8)}]`;
  
  return {
    info: (msg: string, ...args: any[]) => console.log(`${prefix} ℹ️  ${msg}`, ...args),
    success: (msg: string, ...args: any[]) => console.log(`${prefix} ✓ ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`${prefix} ⚠️  ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`${prefix} ❌ ${msg}`, ...args),
  };
}

const MODEL_NAME_ANALYSIS = 'gemini-2.0-flash-exp';
const MODEL_NAME_GENERATION = 'gemini-2.5-flash-image';

// Importar prompts modulares
import { getAnalysisPrompt } from './prompts.ts';

// ═════════════════════════════════════════════════════════════════════════
// PROMPTS DE GERAÇÃO (mantidos inline para geração de imagem)
// ═════════════════════════════════════════════════════════════════════════

const PROMPT_FACETAS = `
Você é um simulador de facetas de resina composta - design de sorriso perfeito.

OBJETIVO: Transformar os dentes visíveis em um sorriso harmonioso, branco e simétrico com facetas de resina composta BL2.

TRANSFORMAÇÃO DO SORRISO:

COR E BRILHO:

- Cor uniforme: BL2 (branco brilhante natural)
- Brilho: aumentar significativamente (resina polida profissionalmente é muito mais brilhante que esmalte)
- Sem tons acinzentados ou azulados (tom quente-natural)
- Superfície lisa e reflexiva (característica de resina composta bem polida)

FORMATO E PROPORÇÕES (DIFERENÇA CHAVE vs CLAREAMENTO):

- Incisivos centrais: simétricos perfeitos (mesma altura, largura e angulação)
- Incisivos laterais: proporcionados (60-70% da largura dos centrais)
- Caninos: volume definido, ponta discreta (elegante, não agressiva)
- Bordas incisais: suavizadas e refinadas (não afiadas ou gastas)
- Formas: ângulos de transição suaves (linha oclusal harmoniosa)

ALINHAMENTO VISUAL (APARÊNCIA, NÃO MOVIMENTO):

- Corrigir rotações leves (até ~15°)
- Fechar pequenos diastemas (gaps) mantendo proporções naturais
- Alinhar linha oclusal horizontal e suave
- Resultado: sorriso continuado e organizado (não "dentes soltos")

LINHA DO SORRISO E HARMONIA FACIAL:

- Construir linha do sorriso contínua acompanhando curvatura do lábio inferior
- Manter simetria: dente homólogo esquerdo = direito
- Preservar corredores bucais (espaço preto aos lados - não fazer "parede")
- Linha média dental: alinhada

TRANSLUCIDEZ E TEXTURA:

- Bordas incisais: levemente translúcidas com brilho azul-branco sutil (característica de resina polida)
- Microtextura sutil: não super-polido (parecer artificial)
- Reflexos especulares naturais conforme iluminação

DIFERENÇAS CLINICAMENTE REAIS (vs CLAREAMENTO):
✓ Facetas modificam FORMA + COR + BRILHO (clareamento modifica só COR)
✓ Uniformidade total em cores e proporções (clareamento mantém variações naturais)
✓ Simetria perfeita (clareamento respeita assimetrias naturais)
✓ Refinamento de bordas desgastadas (clareamento preserva desgaste)
✓ Fechamento de gaps pequenos (clareamento não fecha)
✓ Design customizado do sorriso (clareamento preserva design natural)

NÃO-DENTÁRIO - PRESERVAR INALTERADO:
✗ Pele, textura, poros, tom, imperfeições
✗ Olhos, sobrancelhas, cílios
✗ Cabelo (cor, estilo, textura)
✗ Expressão facial e posição muscular
✗ Lábios (forma e cor - apenas dentes visíveis mudam)
✗ Ângulo de câmera, iluminação, sombras, fundo
✗ Gengiva (posição e contorno - salvo assimetria >2mm óbvia)

REALISMO CLÍNICO:
✓ Resultado parece facetas reais bem executadas (não exagerado)
✓ Dentes visualmente perfeitos mas ainda reconhecíveis como aquela pessoa
✓ Apropriado para apresentação clínica e expectativa de paciente
✓ Comunica: "este é o sorriso que facetas de resina criariam"
✗ Não parece veneers de porcelana ou coroas (resina composta tem brilho diferente)
✗ Não parecer artificial, "chiclet" ou super-polido (mantém naturalidade em superfície)

SAÍDA: Retorne APENAS a imagem simulada final (JPEG base64) - sem texto, metadados ou anotações.
`;

const PROMPT_CLAREAMENTO = `
Você é um simulador fotorrealista de clareamento dental.
TRANSFORMAÇÃO DE COR DO CLAREAMENTO
COLORIMETRIA (COMO O CLAREAMENTO FUNCIONA):

- AUMENTAR VALUE (luminosidade) significativamente (+3-4 níveis)
- DIMINUIR CHROMA (reduzir saturação amarela 40-60%)
- Mudança de HUE MÍNIMA (permanecer na mesma família de cores)
- Alvo: BL3 na escala Vita Bleach
CRÍTICO: GRADIENTE CERVICAL-INCISAL (essencial para naturalidade):
✓ Terço cervical (próximo às gengivas): levemente mais quente, mais saturado
✓ Terço médio: cor alvo BL2/BL3
✓ Terço incisal: mais claro, mais frio, mais translúcido
✓ NÃO criar cor uniforme da gengiva até a borda
VARIAÇÃO NATURAL ENTRE OS DENTES:
✓ Incisivos centrais: tipicamente mais brilhantes
✓ Caninos: 0,5-1 tom mais saturado (mais amarelado) - CRÍTICO
✓ Permitir micro-variações sutis (diferença de 0,5-1 tom)
✓ EVITAR uniformidade robótica
CRÍTICO: PRESERVAÇÃO DA ANATOMIA (ZERO MODIFICAÇÃO)
CLAREAMENTO MUDA APENAS A COR - NADA MAIS:
PRESERVAR ABSOLUTAMENTE:
✗ Formas, tamanhos, proporções dos dentes (100% idênticos)
✗ Alinhamento e posicionamento dos dentes (sem endireitamento)
✗ Padrões de desgaste natural, lascas, irregularidades
✗ Diastemas (espaços) e espaçamento natural
✗ Posição da linha gengival
✗ Características individuais dos dentes
PRESERVAR IMPERFEIÇÕES:
✓ Assimetrias leves
✓ Lascas menores ou bordas desgastadas
✓ Pequenas irregularidades de espaçamento
✓ Rotações naturais
TRANSLUCIDEZ E TEXTURA
✓ Preservar translucidez da borda incisal (especialmente dentes anteriores)
✓ Manter textura natural do esmalte (periquimatas, micro-cristas)
✓ Manter irregularidades de superfície
✓ NÃO fazer os dentes parecerem calcários ou chapados
RESTAURAÇÕES DENTÁRIAS:
⚠️ Coroas, facetas, restaurações: NÃO mudar a cor
⚠️ Apenas a estrutura dental natural responde ao clareamento
PRESERVAR COMPLETAMENTE INALTERADO
✗ Pele, olhos, cabelo, expressão facial
✗ Lábios (forma, cor, textura)
✗ Ângulo da câmera, iluminação, fundo
PRECISÃO CLÍNICA
O RESULTADO DEVE:
✓ Parecer um clareamento profissional real (não edição digital)
✓ Dentes visivelmente mais brancos mas ainda naturais
✓ Paciente reconhece seu próprio sorriso, apenas mais brilhante
✓ Adequado para documentação clínica
EVITAR:
✗ Fazer os dentes MUITO brancos (irrealista)
✗ Uniformidade perfeita (parece falso)
✗ Endireitar ou remodelar dentes
✗ Suavização excessiva da textura
SAÍDA: Retornar APENAS a imagem final (JPEG base64) SEM texto ou anotações.
`;

// ═════════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR: Seleção de Prompt
// ═════════════════════════════════════════════════════════════════════════

function buildSimulationPrompt(treatment_type?: string): string {
  const type = treatment_type?.toLowerCase() || 'facetas';
  return type === 'clareamento' 
    ? PROMPT_CLAREAMENTO 
    : PROMPT_FACETAS;
}

// ═════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Converter imagem base64 para formato Gemini
// ═════════════════════════════════════════════════════════════════════════

function prepareImageForGemini(imageBase64: string) {
  // Remove o prefixo data:image/...;base64, se existir
  const base64Data = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;
  
  return {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data
    }
  };
}

// ═════════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const runId = crypto.randomUUID();
  const log = createLogger(runId);
  
  try {
    // Validar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log.error('Sem header de autorização');
      return new Response(
        JSON.stringify({ error: 'Não autorizado - Token ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase para validar o token
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.58.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      log.error('Token inválido ou expirado:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Não autorizado - Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Usuário autenticado: ${user.email} (${user.id.substring(0, 8)}...)`);
    
    const body = await req.json();
    const { 
      imageBase64, 
      action, 
      analysisData, 
      reportText, 
      config, 
      treatment_type, 
      simulationId, 
      servicos_ativos 
    } = body;
    
    // Usar o userId do token autenticado (mais seguro)
    const userId = user.id;
    
    // Log dos parâmetros recebidos
    log.info(`Parâmetros recebidos: action=${action}, treatment_type=${treatment_type || 'undefined'}`);
    
    // Validar treatment_type
    if (treatment_type && !['facetas', 'clareamento'].includes(treatment_type)) {
      log.warn(`treatment_type inválido: '${treatment_type}', usando 'facetas' como padrão`);
    }
    
    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada. Configure em: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/functions');
    }

    // ========================================
    // AÇÃO: ANÁLISE
    // ========================================
    if (action === 'analyze') {
      log.info('═══════════════════════════════════════');
      log.info(`ANÁLISE - Tipo: ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_NAME_ANALYSIS}`);
      log.info('═══════════════════════════════════════');
      
      // Verificar permissão para clareamento
      if (treatment_type === 'clareamento') {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.58.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: userConfig, error: configError } = await supabase
          .from('user_configs')
          .select('whitening_simulator_enabled')
          .eq('user_id', userId)
          .single();
        
        if (configError || !userConfig?.whitening_simulator_enabled) {
          log.error('Tentativa de usar clareamento sem permissão');
          return new Response(
            JSON.stringify({ 
              error: 'Módulo de Clareamento não ativado para esta conta',
              code: 'MODULE_DISABLED',
              success: false 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        log.success('Permissão de clareamento verificada');
      }

      // Verificar idempotência
      if (simulationId && body.idempotencyKey) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.58.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: existing } = await supabase
          .from('simulations')
          .select('id, status, created_at')
          .eq('user_id', userId)
          .eq('idempotency_key', body.idempotencyKey)
          .neq('status', 'error')
          .maybeSingle();
        
        if (existing) {
          const age = Date.now() - new Date(existing.created_at).getTime();
          if (age < 300000) {
            log.warn(`Requisição duplicada (${Math.round(age/1000)}s atrás)`);
            return new Response(
              JSON.stringify({ 
                error: 'Processamento já em andamento',
                simulationId: existing.id,
                status: existing.status,
                code: 'DUPLICATE_REQUEST'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            );
          }
        }
        
        await supabase
          .from('simulations')
          .update({ 
            status: 'analyzing', 
            run_id: runId,
            idempotency_key: body.idempotencyKey
          })
          .eq('id', simulationId);
      }

      // Usar prompt modular de análise
      const processedImageBase64 = body.processedImageBase64;
      const analysisPrompt = getAnalysisPrompt(treatment_type || 'facetas');
      
      log.info(`Usando prompt de análise para: ${treatment_type || 'facetas'}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        // Chamar API do Google Gemini com ambas as imagens
        const parts = [
          { text: analysisPrompt },
          prepareImageForGemini(imageBase64)
        ];
        
        // Adicionar imagem processada se fornecida
        if (processedImageBase64) {
          parts.push(prepareImageForGemini(processedImageBase64));
        }
        
        const analysisResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME_ANALYSIS}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: parts
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 10000,
                responseMimeType: 'application/json'
              }
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!analysisResponse.ok) {
          const errorText = await analysisResponse.text();
          throw new Error(`Erro na análise: ${analysisResponse.status} - ${errorText}`);
        }
        
        const analysisResult = await analysisResponse.json();
        const responseText = analysisResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!responseText) {
          throw new Error('Gemini não retornou conteúdo');
        }

        let analise_data;
        try {
          let cleanJsonText = responseText.trim();
          if (cleanJsonText.startsWith('```')) {
            cleanJsonText = cleanJsonText.replace(/```(json)?\s*/i, '').trim();
            cleanJsonText = cleanJsonText.replace(/```$/, '').trim();
          }
          analise_data = JSON.parse(cleanJsonText);
        } catch (parseError) {
          throw new Error('Resposta da IA não está em formato JSON válido');
        }

        log.success('Análise concluída');
        
        return new Response(
          JSON.stringify({ 
            success: true,
            analise_data,
            metadata: {
              model: MODEL_NAME_ANALYSIS,
              timestamp: new Date().toISOString(),
              run_id: runId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
        
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Análise cancelada por timeout (90s)');
        }
        throw error;
      }
    }

    // ========================================
    // AÇÃO: GERAÇÃO DE RELATÓRIO TÉCNICO
    // ========================================
    if (action === 'report') {
      log.info('═══════════════════════════════════════');
      log.info(`RELATÓRIO TÉCNICO - Tipo: ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_NAME_ANALYSIS}`);
      log.info('═══════════════════════════════════════');

      // Importar o prompt de relatório
      const { FACETAS_REPORT_PROMPT, CLAREAMENTO_REPORT_PROMPT } = await import('./reportPrompts.ts');

      const reportPrompt = treatment_type === 'clareamento'
        ? CLAREAMENTO_REPORT_PROMPT
        : FACETAS_REPORT_PROMPT;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const reportResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME_ANALYSIS}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: reportPrompt },
                  prepareImageForGemini(imageBase64)
                ]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4000
              }
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!reportResponse.ok) {
          const errorText = await reportResponse.text();
          throw new Error(`Erro ao gerar relatório: ${reportResponse.status} - ${errorText}`);
        }

        const reportResult = await reportResponse.json();
        const reportContent = reportResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!reportContent) {
          throw new Error('Gemini não retornou conteúdo do relatório');
        }

        log.success('Relatório técnico gerado');

        return new Response(
          JSON.stringify({
            success: true,
            reportContent,
            metadata: {
              model: MODEL_NAME_ANALYSIS,
              timestamp: new Date().toISOString(),
              run_id: runId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Geração de relatório cancelada por timeout (90s)');
        }
        throw error;
      }
    }

    // ========================================
    // AÇÃO: GERAÇÃO DE IMAGEM
    // ========================================
    if (action === 'generate') {
      log.info('═══════════════════════════════════════');
      log.info(`GERAÇÃO - Tipo: ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_NAME_GENERATION}`);
      log.info('═══════════════════════════════════════');

      // Selecionar prompt adequado
      const simulationPrompt = buildSimulationPrompt(treatment_type || 'facetas');
      log.info(`Prompt selecionado: ${treatment_type === 'clareamento' ? 'CLAREAMENTO' : 'FACETAS'}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log.error('Timeout: geração excedeu 120s');
        controller.abort();
      }, 120000);

      try {
        // Chamar API do Google Gemini para geração de imagem
        const imageResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME_GENERATION}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: simulationPrompt },
                  prepareImageForGemini(imageBase64)
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 8000,
                responseModalities: ['Image']
              }
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Erro na geração: ${imageResponse.status} - ${errorText}`);
        }
        
        const imageResult = await imageResponse.json();
        
        // Extrair imagem gerada
        const generatedImageData = imageResult.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!generatedImageData) {
          throw new Error('Nenhuma imagem foi gerada');
        }
        
        // Converter para formato base64 completo
        const generatedImage = `data:image/jpeg;base64,${generatedImageData}`;
        
        log.success('Imagem simulada gerada');
        
        return new Response(
          JSON.stringify({
            success: true,
            processedImageBase64: generatedImage,
            metadata: {
              model: MODEL_NAME_GENERATION,
              timestamp: new Date().toISOString(),
              run_id: runId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
        
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Geração cancelada por timeout (120s)');
        }
        throw error;
      }
    }

    throw new Error('Ação não especificada ou inválida');
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    log.error('ERRO NO PROCESSAMENTO');
    log.error('Mensagem:', message);
    
    return new Response(
      JSON.stringify({ 
        error: message,
        success: false,
        run_id: runId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

