import { corsHeaders } from '../_shared/cors.ts';

/**
 * ═════════════════════════════════════════════════════════════════════════
 * EDGE FUNCTION: SIMULAÇÃO DENTAL (FACETAS + CLAREAMENTO)
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * FLUXO SIMPLIFICADO:
 * 
 * FASE 1 (action='generate'):
 *    - Recebe foto original do paciente
 *    - Gera imagem simulada do "DEPOIS"
 *    - Retorna: { processedImageBase64 }
 * 
 * FASE 2 (action='analyze'):
 *    - Recebe foto ANTES + foto DEPOIS
 *    - Gera relatório técnico comparativo
 *    - Gera orçamento profissional
 *    - Retorna: { relatorio_tecnico, orcamento }
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

const MODEL_IMAGE_GEN = 'google/gemini-2.5-flash-image-preview';
const MODEL_TEXT_GEN = 'google/gemini-2.5-flash';

// ═════════════════════════════════════════════════════════════════════════
// PROMPTS - FASE 1: GERAÇÃO DE IMAGEM
// ═════════════════════════════════════════════════════════════════════════

const PROMPT_GENERATE_FACETAS = `
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

const PROMPT_GENERATE_CLAREAMENTO = `
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
// PROMPTS - FASE 2: RELATÓRIO TÉCNICO E ORÇAMENTO
// ═════════════════════════════════════════════════════════════════════════

const PROMPT_RELATORIO_TECNICO = `
**TAREFA:** Analise as imagens ANTES e DEPOIS e gere um relatório técnico profissional detalhando a condição atual do paciente e o protocolo necessário para alcançar o resultado simulado.

ESTRUTURA DO RELATÓRIO:

1. ANÁLISE DA CONDIÇÃO ATUAL (Foto ANTES)

**Avaliação Dental:**
- **Coloração atual:** Especifique a cor dos dentes na escala Vita (ex: A3, B2, C1)
- **Uniformidade da cor:** Identifique variações de tonalidade entre dentes
- **Manchas e descolorações:** Localize e descreva manchas visíveis (localização específica por dente)
- **Translucidez:** Avalie a transparência das bordas incisais
- **Textura do esmalte:** Observe brilho, opacidade, desgastes

**Avaliação Estrutural:**
- **Alinhamento dentário:** Descreva rotações, apinhamentos ou diastemas (especifique dentes afetados)
- **Formato dos dentes:** Identifique assimetrias, desgastes, fraturas ou bordas irregulares
- **Proporções:** Analise a relação largura/altura dos dentes anteriores
- **Linha do sorriso:** Avalie a exposição gengival e simetria

**Avaliação Gengival:**
- **Contorno gengival:** Verifique simetria e irregularidades (medidas em mm quando possível)
- **Saúde gengival:** Observe sinais visíveis de inflamação ou retração
- **Zênite gengival:** Avalie o posicionamento do ponto mais alto da gengiva

**Diagnóstico Resumido:**
- Liste os principais problemas estéticos identificados
- Classifique o nível de complexidade do caso (baixo/médio/alto)

---

2. ANÁLISE DO RESULTADO SIMULADO (Foto DEPOIS)

**Resultado Alcançado:**
- **Cor final:** Especifique a cor alvo (ex: BL2, BL3)
- **Uniformização:** Descreva a homogeneidade alcançada
- **Brilho e vitalidade:** Caracterize o aspecto final do esmalte
- **Alterações estruturais:** Liste modificações em formato, alinhamento ou proporções (se houver)
- **Harmonia facial:** Avalie a integração do resultado com o rosto do paciente

---

3. PROTOCOLO DE TRATAMENTO DETALHADO

**TRATAMENTO: [Clareamento Dental / Facetas em Resina Composta]**

**A) PLANEJAMENTO PRÉ-OPERATÓRIO:**
1. **Exame clínico completo:**
   - Radiografias periapicais dos dentes anteriores
   - Avaliação de cáries, trincas e restaurações existentes
   - Teste de vitalidade pulpar
   - Fotografias clínicas (protocolo frontal, lateral, oclusal)
2. **Moldagem e estudo:**
   - Moldagem para modelos de estudo
   - Enceramento diagnóstico (apenas para facetas)
   - Mock-up em boca para aprovação do paciente (apenas para facetas)
3. **Profilaxia:**
   - Limpeza profissional completa
   - Remoção de tártaro e placa bacteriana
   - Polimento dental

---

**B) PROTOCOLO CLÍNICO ESPECÍFICO:**

**[SE CLAREAMENTO DENTÁRIO:]**

**Sessão 1 - Preparação:**
- Registro fotográfico inicial
- Seleção da cor inicial (escala Vita)
- Aplicação de protetor gengival fotopolimerizável
- Isolamento absoluto (opcional) ou relativo com afastador labial

**Sessões 2-4 - Clareamento em Consultório:**
- **Agente clareador:** Peróxido de hidrogênio 35-40% ou peróxido de carbamida 37%
- **Protocolo de aplicação:**
  - Aplicar gel clareador em camada uniforme (1-2mm)
  - 3 aplicações de 15 minutos cada por sessão
  - Ativação com luz LED ou laser (conforme protocolo do fabricante)
  - Intervalo de 7 dias entre sessões
- **Dessensibilizante:** Aplicar após cada sessão (fluoreto de sódio 5% ou nitrato de potássio)

**Sessão Final - Avaliação:**
- Comparação de cor com escala Vita
- Registro fotográfico final
- Instruções de manutenção ao paciente

**Clareamento Caseiro Complementar (Opcional):**
- Confecção de moldeiras individuais
- Gel clareador: Peróxido de carbamida 10-22%
- Uso noturno por 14-21 dias
- Acompanhamento semanal

---

**[SE FACETAS EM RESINA COMPOSTA:]**

**Sessão 1 - Preparação e Mock-up:**
- Seleção da cor da resina (ex: BL3 corpo + translúcido incisal)
- Confecção de mock-up com resina bisacrílica
- Aprovação estética pelo paciente
- Fotografias do mock-up aprovado

**Sessão 2-3 - Confecção das Facetas:**

**Dentes a serem tratados:**
- Liste os dentes específicos (ex: 13, 12, 11, 21, 22, 23)

**Preparo dental:**
- Profilaxia com pasta sem flúor
- Preparo minimamente invasivo (0,3-0,5mm de desgaste)
- Biselamento das bordas incisais
- Delimitação cervical precisa

**Procedimento adesivo:**
- Isolamento absoluto com dique de borracha
- Condicionamento ácido fosfórico 37% (30s esmalte, 15s dentina)
- Lavagem abundante (30s)
- Secagem com papel absorvente (dentina úmida)
- Aplicação de sistema adesivo em 2 camadas
- Fotopolimerização: 20-40s (mínimo 1000 mW/cm²)

**Estratificação da resina:**
- **Camada 1:** Resina dentina (corpo) - cor BL3
- **Camada 2:** Resina esmalte (corpo) - cor BL3
- **Camada 3:** Resina translúcida (incisal) - apenas nos incisivos centrais e laterais
- Fotopolimerização de cada camada: 20-40s
- Técnica incremental (camadas de máximo 2mm)

**Acabamento e polimento:**
- Remoção de excessos com brocas multilaminadas
- Ajuste oclusal e dos contatos proximais
- Polimento com discos abrasivos (granulação decrescente)
- Polimento final com pasta diamantada e taças de borracha
- Brilho final com discos de feltro

---

**C) CUIDADOS PÓS-TRATAMENTO:**

**Recomendações ao paciente:**

**[Para Clareamento:]**
- Evitar alimentos pigmentados por 48h (café, vinho, beterraba, açaí, molhos escuros)
- Não fumar durante o tratamento
- Escovação suave com creme dental dessensibilizante
- Evitar alimentos/bebidas ácidas por 24h após cada sessão
- Sensibilidade temporária é normal (1-3 dias)

**[Para Facetas:]**
- Evitar morder objetos duros (canetas, unhas, gelo)
- Não utilizar os dentes anteriores para cortar alimentos duros
- Higienização cuidadosa com escova macia e fio dental
- Evitar alimentos muito pigmentados nas primeiras 48h
- Uso de placa miorrelaxante se houver bruxismo

**Retornos programados:**
- 7 dias: avaliação inicial
- 30 dias: controle e ajustes
- 6 meses: polimento de manutenção (facetas)
- 12 meses: avaliação anual

---

4. MATERIAIS E EQUIPAMENTOS NECESSÁRIOS

**[Liste os materiais específicos conforme o tratamento:]**

**Para Clareamento:**
- Gel clareador (marca e concentração)
- Protetor gengival fotopolimerizável
- Dessensibilizante
- Equipamento de fotoativação (LED/Laser)
- Afastador labial
- Escala Vita

**Para Facetas:**
- Sistema de resina composta (marca, cores BL3, translúcido)
- Ácido fosfórico 37%
- Sistema adesivo (marca)
- Brocas diamantadas para acabamento
- Sistema de polimento completo
- Fotopolimerizador LED (especificar potência)
- Dique de borracha e acessórios

---

5. PROGNÓSTICO E EXPECTATIVAS

**Durabilidade esperada:**
- **Clareamento:** 1-3 anos (com manutenção adequada)
- **Facetas:** 5-7 anos (podendo chegar a 10 anos com cuidados ideais)

**Fatores que influenciam o resultado:**
- Higiene oral do paciente
- Hábitos alimentares
- Bruxismo (necessidade de placa de proteção)
- Tabagismo
- Retornos de manutenção

**Possíveis intercorrências:**
- **Clareamento:** Sensibilidade transitória, necessidade de sessões adicionais
- **Facetas:** Pequenas fraturas de borda (reparáveis), necessidade de polimento periódico

---

6. CONSIDERAÇÕES FINAIS

**Observações importantes:**
- [Mencione particularidades do caso]
- [Alerte para necessidades de tratamentos complementares, se houver]
- [Indique se há necessidade de especialistas: ortodontista, periodontista]

**Alternativas de tratamento:**
- [Sugira outras opções quando aplicável]
- [Compare prós e contras]

---

FORMATO DE APRESENTAÇÃO:
- **Tom:** Profissional, técnico, objetivo
- **Linguagem:** Terminologia odontológica precisa
- **Medidas:** Sempre que possível, quantifique (mm, escala Vita, número de dentes)
- **Especificidade:** Identifique dentes pela numeração FDI (11, 12, 21, 22, etc)
- **Praticidade:** Protocolo deve ser reproduzível passo a passo
- **Ética:** Baseado em evidências científicas e boas práticas clínicas

---

**RESULTADO ESPERADO:** Um relatório técnico completo que funcione como um guia prático para o dentista executar o tratamento com precisão e alcançar o resultado simulado na imagem DEPOIS.
`;

const PROMPT_ORCAMENTO = `
Você é um assistente administrativo de uma clínica odontológica especializada em estética dental, responsável por gerar orçamentos profissionais e detalhados.

**TAREFA:** Com base no relatório técnico fornecido, gere um orçamento profissional adequado ao tipo de tratamento (Clareamento Dental ou Facetas Dentárias).

---

INSTRUÇÕES POR TIPO DE TRATAMENTO:

**TIPO 1: CLAREAMENTO DENTAL**

**SERVIÇO PRINCIPAL:**
- **Clareamento Dental em Consultório**
  - Descrição: Clareamento profissional até a cor BL2
  - Valor: **A PARTIR DE R$ [Consultar valor na tabela de serviços]**
  - Inclui: [X] sessões em consultório, aplicação de gel clareador profissional, dessensibilizante

**PROCEDIMENTOS OPCIONAIS:**
Analise o relatório técnico e liste APENAS os procedimentos identificados como necessários ou recomendados. Apresente SEM valores, apenas com a descrição:

- [ ] Limpeza/Profilaxia Dentária (remoção de tártaro e placa bacteriana)
- [ ] Gengivoplastia (correção do contorno gengival)
- [ ] Restaurações em resina composta (tratamento de cáries ou desgastes)
- [ ] Tratamento de sensibilidade dentária
- [ ] Clareamento caseiro complementar (moldeiras + gel)
- [ ] Microabrasão do esmalte (manchas superficiais)
- [ ] [Outros procedimentos identificados no relatório]

**OBSERVAÇÃO IMPORTANTE:**
"Este é um orçamento indicativo baseado em análise fotográfica simulada. Um orçamento definitivo e personalizado será elaborado após agendamento de avaliação clínica presencial, onde será realizado exame detalhado da condição bucal e definido o plano de tratamento ideal."

---

**TIPO 2: FACETAS DENTÁRIAS**

**SERVIÇO PRINCIPAL:**
- **Facetas em Resina Composta + Clareamento Dental**
  - 4 facetas dentárias nos dentes anteriores superiores (11, 12, 21, 22)
  - Clareamento dental profissional nos dentes restantes
  - Cor final: BL3 (facetas) e BL2/BL3 (clareamento)
  - Valor: **A PARTIR DE R$ [Consultar valor na tabela de serviços]**
  - Inclui: Planejamento estético, mock-up, confecção das facetas, clareamento em consultório, acabamento e polimento

**PROCEDIMENTOS OPCIONAIS:**
Analise o relatório técnico e liste APENAS os procedimentos identificados como necessários ou recomendados. Apresente SEM valores, apenas com a descrição:

- [ ] DSD - Digital Smile Design (planejamento digital do sorriso)
- [ ] Gengivoplastia (harmonização do contorno gengival)
- [ ] Facetas adicionais (caso necessário tratar mais de 4 dentes)
- [ ] Limpeza/Profilaxia Dentária (remoção de tártaro e placa)
- [ ] Restaurações prévias (tratamento de cáries)
- [ ] Tratamento ortodôntico (alinhamento dental)
- [ ] Placa miorrelaxante (proteção contra bruxismo)
- [ ] Gengivectomia (correção de sorriso gengival)
- [ ] [Outros procedimentos identificados no relatório]

**OBSERVAÇÃO IMPORTANTE:**
"Este é um orçamento indicativo baseado em análise fotográfica simulada. Um orçamento definitivo e personalizado será elaborado após agendamento de avaliação clínica presencial, onde será realizado exame detalhado da condição bucal, moldagens e definido o plano de tratamento ideal."

---

ESTRUTURA DO ORÇAMENTO:

\`\`\`
═══════════════════════════════════════════════════════
            ORÇAMENTO - TRATAMENTO ESTÉTICO DENTAL
═══════════════════════════════════════════════════════

Data: [DATA ATUAL]
Paciente: [NOME DO PACIENTE ou "A definir"]
Validade: 30 dias

───────────────────────────────────────────────────────
TRATAMENTO PROPOSTO: [CLAREAMENTO DENTAL / FACETAS DENTÁRIAS]
───────────────────────────────────────────────────────

[DESCRIÇÃO DO SERVIÇO PRINCIPAL COM VALOR "A PARTIR DE"]

───────────────────────────────────────────────────────
PROCEDIMENTOS OPCIONAIS (valores sob consulta):
───────────────────────────────────────────────────────

[LISTA DOS OPCIONAIS SEM VALORES - APENAS SE IDENTIFICADOS NO RELATÓRIO]

───────────────────────────────────────────────────────
OBSERVAÇÕES IMPORTANTES:
───────────────────────────────────────────────────────

✓ Este é um orçamento indicativo baseado em análise fotográfica simulada
✓ Orçamento definitivo será elaborado após avaliação clínica presencial
✓ Os valores dos procedimentos opcionais serão informados durante a consulta
✓ O número de sessões pode variar conforme a resposta individual ao tratamento
✓ Todos os procedimentos seguem os mais altos padrões de qualidade e biossegurança

───────────────────────────────────────────────────────
FORMAS DE PAGAMENTO:
───────────────────────────────────────────────────────

- À vista com desconto
- Parcelamento em até [X]x no cartão de crédito
- Outras condições sob consulta

───────────────────────────────────────────────────────
PRÓXIMOS PASSOS:
───────────────────────────────────────────────────────

1. Agendar avaliação clínica presencial
2. Exame clínico completo e fotografias profissionais
3. Elaboração do plano de tratamento definitivo
4. Aprovação do orçamento final
5. Início do tratamento

───────────────────────────────────────────────────────

Para agendamento ou dúvidas:
📞 Telefone: [TELEFONE DA CLÍNICA]
📧 E-mail: [EMAIL DA CLÍNICA]
📍 Endereço: [ENDEREÇO DA CLÍNICA]

═══════════════════════════════════════════════════════
\`\`\`

---

DIRETRIZES IMPORTANTES:

**1. ANÁLISE DO RELATÓRIO TÉCNICO:**
- Leia atentamente o relatório técnico fornecido
- Identifique APENAS os procedimentos mencionados como necessários ou recomendados
- NÃO invente ou adicione procedimentos não mencionados no relatório
- Se o relatório não mencionar necessidades adicionais, liste apenas o tratamento principal

**2. APRESENTAÇÃO DOS OPCIONAIS:**
- Liste os opcionais de forma clara e objetiva
- NÃO inclua valores nos opcionais
- Use checkbox para facilitar visualização
- Agrupe opcionais similares quando apropriado

**3. LINGUAGEM E TOM:**
- Profissional e acolhedor
- Claro e transparente
- Evite jargões técnicos excessivos
- Transmita confiança e credibilidade

**4. TRANSPARÊNCIA:**
- Sempre use "A PARTIR DE" no valor principal
- Deixe claro que é orçamento indicativo
- Reforce a necessidade de avaliação presencial
- Seja honesto sobre variações possíveis

**5. VALORES (IMPORTANTES):**
- **Clareamento Dental:** Considere valor médio de mercado para sua região
- **4 Facetas + Clareamento:** Considere valor médio para 4 facetas em resina composta + clareamento completo
- Valores devem ser realistas e competitivos
- Sempre apresente como "A PARTIR DE"

**6. PERSONALIZAÇÃO:**
- Se possível, use o nome do paciente
- Adapte a linguagem ao perfil do paciente
- Mantenha tom profissional mas acessível

---

EXEMPLO DE ANÁLISE DO RELATÓRIO:

**Se o relatório mencionar:**
- "Presença de tártaro visível" → Incluir: Limpeza/Profilaxia Dentária
- "Assimetria gengival de 3mm" → Incluir: Gengivoplastia
- "Restaurações antigas escurecidas" → Incluir: Substituição de restaurações
- "Necessário planejamento digital preciso" → Incluir: DSD
- "Bruxismo identificado" → Incluir: Placa miorrelaxante

**Se o relatório NÃO mencionar problemas adicionais:**
- Liste apenas o tratamento principal
- Não force opcionais desnecessários

---

RESULTADO ESPERADO:

Um orçamento profissional, claro e honesto que:
- Apresente o valor inicial de forma transparente
- Liste opcionais apenas quando pertinente ao caso
- Transmita credibilidade e profissionalismo
- Incentive o agendamento da avaliação presencial
- Proteja a clínica com disclaimers apropriados
- Seja visualmente organizado e fácil de compreender

---

**IMPORTANTE:** O orçamento deve equilibrar transparência comercial com responsabilidade técnica, sempre deixando claro que a simulação fotográfica é indicativa e o tratamento definitivo depende de avaliação clínica presencial.
`;

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
    const body = await req.json();
    const { 
      imageBase64, 
      beforeImageBase64,
      afterImageBase64,
      action, 
      treatment_type, 
      simulationId, 
      userId,
      relatorio_tecnico
    } = body;
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // ═════════════════════════════════════════════════════════════════
    // FASE 1: GERAÇÃO DA IMAGEM SIMULADA
    // ═════════════════════════════════════════════════════════════════
    if (action === 'generate') {
      log.info('═══════════════════════════════════════');
      log.info(`FASE 1: GERAÇÃO DE IMAGEM - ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_IMAGE_GEN}`);
      log.info('═══════════════════════════════════════');
      
      if (!imageBase64) {
        throw new Error('Imagem não fornecida');
      }

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
          if (age < 300000) { // 5 minutos
            log.warn(`Requisição duplicada detectada (${Math.round(age/1000)}s atrás)`);
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
            status: 'generating', 
            run_id: runId,
            idempotency_key: body.idempotencyKey
          })
          .eq('id', simulationId);
        
        log.info(`Idempotency key registrado: ${body.idempotencyKey}`);
      }

      // Selecionar prompt baseado no tipo de tratamento
      const promptToUse = treatment_type === 'clareamento' 
        ? PROMPT_GENERATE_CLAREAMENTO 
        : PROMPT_GENERATE_FACETAS;
      
      log.info(`Prompt selecionado: ${treatment_type === 'clareamento' ? 'CLAREAMENTO' : 'FACETAS'}`);

      // Timeout de 120 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log.error('⏱️ Timeout: geração excedeu 120s');
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
            model: MODEL_IMAGE_GEN,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptToUse },
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
          const text = await imageResponse.text();
          log.error('Erro na geração:', imageResponse.status, text);
          throw new Error(`Erro na geração: ${imageResponse.status}`);
        }
        
        const imageResult = await imageResponse.json();
        const generatedImage = imageResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!generatedImage) {
          log.error('Nenhuma imagem gerada');
          throw new Error('Nenhuma imagem foi gerada pelo modelo');
        }
        
        log.success('Imagem simulada gerada com sucesso');
        
        return new Response(
          JSON.stringify({
            success: true,
            processedImageBase64: generatedImage,
            treatment_type: treatment_type || 'facetas',
            metadata: {
              model: MODEL_IMAGE_GEN,
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

    // ═════════════════════════════════════════════════════════════════
    // FASE 2: GERAÇÃO DE RELATÓRIO TÉCNICO + ORÇAMENTO
    // ═════════════════════════════════════════════════════════════════
    if (action === 'analyze') {
      log.info('═══════════════════════════════════════');
      log.info('FASE 2: GERAÇÃO DE RELATÓRIO + ORÇAMENTO');
      log.info(`Modelo: ${MODEL_TEXT_GEN}`);
      log.info('═══════════════════════════════════════');
      
      if (!beforeImageBase64 || !afterImageBase64) {
        throw new Error('Imagens ANTES e DEPOIS não fornecidas');
      }

      const treatmentType = treatment_type || 'facetas';
      log.info(`Tipo de tratamento: ${treatmentType}`);

      // Timeout de 90 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        log.error('⏱️ Timeout: análise excedeu 90s');
        controller.abort();
      }, 90000);

      try {
        // 1. Gerar Relatório Técnico
        log.info('→ Gerando relatório técnico...');
        
        const relatorioResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_TEXT_GEN,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PROMPT_RELATORIO_TECNICO },
                  { type: 'text', text: `Tipo de tratamento: ${treatmentType.toUpperCase()}` },
                  { type: 'text', text: 'Imagem ANTES:' },
                  { type: 'image_url', image_url: { url: beforeImageBase64 } },
                  { type: 'text', text: 'Imagem DEPOIS:' },
                  { type: 'image_url', image_url: { url: afterImageBase64 } },
                ],
              },
            ],
            max_tokens: 10000,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        
        if (!relatorioResponse.ok) {
          const text = await relatorioResponse.text();
          log.error('Erro no relatório:', relatorioResponse.status, text);
          throw new Error(`Erro no relatório: ${relatorioResponse.status}`);
        }
        
        const relatorioResult = await relatorioResponse.json();
        const relatorioTexto = relatorioResult.choices?.[0]?.message?.content?.trim();
        
        if (!relatorioTexto) {
          throw new Error('Relatório não gerado');
        }
        
        log.success('Relatório técnico gerado');

        // 2. Gerar Orçamento
        log.info('→ Gerando orçamento...');
        
        const orcamentoResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_TEXT_GEN,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: PROMPT_ORCAMENTO },
                  { type: 'text', text: `Tipo de tratamento: ${treatmentType.toUpperCase()}` },
                  { type: 'text', text: `\n\nRELATÓRIO TÉCNICO:\n\n${relatorioTexto}` },
                ],
              },
            ],
            max_tokens: 5000,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!orcamentoResponse.ok) {
          const text = await orcamentoResponse.text();
          log.error('Erro no orçamento:', orcamentoResponse.status, text);
          throw new Error(`Erro no orçamento: ${orcamentoResponse.status}`);
        }
        
        const orcamentoResult = await orcamentoResponse.json();
        const orcamentoTexto = orcamentoResult.choices?.[0]?.message?.content?.trim();
        
        if (!orcamentoTexto) {
          throw new Error('Orçamento não gerado');
        }
        
        log.success('Orçamento gerado');
        log.success('Análise completa finalizada');

        return new Response(
          JSON.stringify({
            success: true,
            relatorio_tecnico: relatorioTexto,
            orcamento: orcamentoTexto,
            treatment_type: treatmentType,
            metadata: {
              model: MODEL_TEXT_GEN,
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
