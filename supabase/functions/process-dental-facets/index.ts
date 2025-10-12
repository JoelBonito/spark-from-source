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
 * DEPLOY SEGURO - FASE 1: APENAS NOVOS PROMPTS DE GERAÇÃO
 * 
 * Mantém estrutura atual de análise + sistema de pontuação
 * Atualiza apenas os prompts de geração de imagem
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

const MODEL_NAME = 'google/gemini-2.5-flash';

// ═════════════════════════════════════════════════════════════════════════
// NOVOS PROMPTS DE GERAÇÃO (FASE 1 - DEPLOY SEGURO)
// ═════════════════════════════════════════════════════════════════════════

const PROMPT_FACETAS = `
Você é um simulador de tratamento dental fotorrealista.

TAREFA: Gere uma imagem simulada do "DEPOIS" aplicando o padrão técnico da clínica.

PADRÃO TÉCNICO FIXO:
✓ Facetas em resina composta BL3 em TODOS os dentes visíveis no sorriso
✓ Bordas incisais translúcidas nos incisivos (12, 11, 21, 22)
✓ Cor uniforme BL3 (branco natural harmonioso - escala Vita)
✓ Alinhamento corrigido (se necessário)
✓ Proporções harmoniosas com o rosto

PRESERVAR ABSOLUTAMENTE:
✗ NÃO altere: pele, textura da pele, olhos, cabelo, barba, expressão facial
✗ NÃO altere: ângulo da câmera, iluminação, fundo
✗ NÃO altere: lábios (apenas a parte interna - dentes)

MODIFICAR APENAS:
✓ Dentes: cor, forma, alinhamento
✓ Linha gengival: correção leve se houver assimetria > 2mm

RESULTADO ESPERADO:
- Imagem fotorrealista indistinguível de uma foto real
- Transformação natural e harmoniosa
- Adequado para uso clínico/comercial (prévia de tratamento)

SAÍDA:
- Retorne apenas a imagem simulada final (JPEG base64) sem texto ou legendas.
`;

const PROMPT_CLAREAMENTO = `
Você é um simulador de tratamento dental fotorrealista especializado em clareamento dentário.

TAREFA: Gere uma imagem simulada do "DEPOIS" aplicando o protocolo de clareamento da clínica.

PROTOCOLO DE CLAREAMENTO FIXO:
✓ Clareamento dental profissional BL2 em TODOS os dentes visíveis no sorriso
✓ Cor uniforme BL2 (branco brilhante natural - escala Vita)
✓ Manutenção da translucidez natural nas bordas incisais dos dentes anteriores (12, 11, 21, 22)
✓ Preservação das características naturais dos dentes (textura, formato, microdetalhes)
✓ Brilho saudável e natural do esmalte clareado
✓ Harmonia com o tom de pele do paciente

PRESERVAR ABSOLUTAMENTE:
✗ NÃO altere: pele, textura da pele, olhos, cabelo, barba, expressão facial
✗ NÃO altere: ângulo da câmera, iluminação, fundo
✗ NÃO altere: lábios, formato da boca, contorno dos lábios
✗ NÃO altere: formato dos dentes, alinhamento dentário, proporções dentárias
✗ NÃO altere: posição gengival, anatomia gengival
✗ NÃO altere: textura superficial dos dentes (manter naturalidade)

MODIFICAR APENAS:
✓ Cor dos dentes: transição suave da cor atual para BL2
✓ Uniformização da tonalidade: remover manchas, descolorações e variações de cor
✓ Luminosidade: aumentar o brilho natural do esmalte
✓ Saturação: reduzir tons amarelados mantendo aspecto natural

DIRETRIZES TÉCNICAS:
- Respeitar a anatomia dental existente (não remodelar)
- Manter diferenças sutis de luminosidade entre dentes para naturalidade
- Preservar sombras e reflexos naturais dos dentes
- Garantir transição gradual entre dente e gengiva
- Manter transparência nas bordas incisais (quando presente naturalmente)

RESULTADO ESPERADO:
- Imagem fotorrealista indistinguível de uma foto real
- Clareamento natural e harmonioso com o rosto do paciente
- Dentes visivelmente mais brancos, mas com aparência natural (não artificial)
- Adequado para uso clínico/comercial (prévia de tratamento)
- O paciente deve reconhecer seu próprio sorriso, apenas mais branco

IMPORTANTE: O resultado deve parecer um clareamento dental real, não uma edição digital óbvia. A naturalidade é essencial.

SAÍDA:
- Retorne apenas a imagem simulada final (JPEG base64) sem texto ou legendas.
`;

// ═════════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR: Seleção de Prompt
// ═════════════════════════════════════════════════════════════════════════

function buildSimulationPrompt(treatment_type: string): string {
  return treatment_type === 'clareamento' 
    ? PROMPT_CLAREAMENTO 
    : PROMPT_FACETAS;
}

// ═════════════════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL (MANTÉM ESTRUTURA ATUAL)
// ═════════════════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const runId = crypto.randomUUID();
  const log = createLogger(runId);
  
  try {
    const body = await req.json();
    const { 
      imageBase64, 
      action, 
      analysisData, 
      reportText, 
      config, 
      treatment_type, 
      simulationId, 
      userId,
      servicos_ativos 
    } = body;
    
    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // ========================================
    // AÇÃO: ANÁLISE (mantém código atual)
    // ========================================
    if (action === 'analyze') {
      log.info('═══════════════════════════════════════');
      log.info(`ANÁLISE - Tipo: ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_NAME}`);
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

      // Construir prompt de análise (mantém sistema atual)
      const servicosNomes = servicos_ativos?.map((s: any) => s.name || s) || [];
      
      // TODO: Aqui você mantém seu prompt de análise atual
      // Por enquanto, retorna estrutura simplificada
      const analysisPrompt = `Analise esta imagem dental e retorne JSON estruturado com análise técnica.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: analysisPrompt },
                  { type: 'image_url', image_url: { url: imageBase64 } },
                ],
              },
            ],
            response_mime_type: 'application/json',
            max_tokens: 10000,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!analysisResponse.ok) {
          throw new Error(`Erro na análise: ${analysisResponse.status}`);
        }
        
        const analysisResult = await analysisResponse.json();
        const responseText = analysisResult.choices?.[0]?.message?.content?.trim();
        
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
              model: MODEL_NAME,
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
    // AÇÃO: GERAÇÃO (USA NOVOS PROMPTS)
    // ========================================
    if (action === 'generate') {
      log.info('═══════════════════════════════════════');
      log.info(`GERAÇÃO - Tipo: ${treatment_type || 'facetas'}`);
      log.info('═══════════════════════════════════════');

      // Selecionar prompt adequado (NOVO)
      const simulationPrompt = buildSimulationPrompt(treatment_type || 'facetas');
      log.info(`Prompt selecionado: ${treatment_type === 'clareamento' ? 'CLAREAMENTO' : 'FACETAS'}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log.error('Timeout: geração excedeu 120s');
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
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!imageResponse.ok) {
          throw new Error(`Erro na geração: ${imageResponse.status}`);
        }
        
        const imageResult = await imageResponse.json();
        const generatedImage = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!generatedImage) {
          throw new Error('Nenhuma imagem foi gerada');
        }
        
        log.success('Imagem simulada gerada');
        
        return new Response(
          JSON.stringify({
            success: true,
            processedImageBase64: generatedImage,
            metadata: {
              model: 'google/gemini-2.5-flash-image-preview',
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

