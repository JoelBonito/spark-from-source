import { WHITENING_PROMPT } from './whiteningPrompt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ═════════════════════════════════════════════════════════════════════════
 * EDGE FUNCTION: PROCESSAMENTO DE ANÁLISE DENTAL (FACETAS + CLAREAMENTO)
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * FASE 4: PROMPTS SEPARADOS POR TIPO DE TRATAMENTO
 * FASE 5: VALIDAÇÃO JSON CONTRA SCHEMA
 * 
 * FLUXO:
 * 
 * 1. ANÁLISE (action='analyze'):
 *    - Recebe treatment_type ('facetas' | 'clareamento')
 *    - Seleciona prompt apropriado
 *    - Gemini gera JSON estruturado conforme schema
 *    - Valida JSON contra interface AnaliseJSON
 *    - Retorna: { analise_data: {...}, metadata: {...} }
 * 
 * 2. GERAÇÃO (action='generate'):
 *    - Constrói prompt de simulação visual
 *    - Gemini gera imagem realista
 *    - Retorna: { processedImageBase64: "..." }
 * 
 * IMPORTANTE:
 * - Cada tipo de tratamento tem seu prompt otimizado
 * - JSON validado garante consistência de dados
 * ═════════════════════════════════════════════════════════════════════════
 */

// PATCH 5: Logger estruturado com run_id
function createLogger(runId: string) {
  const prefix = `[${runId.substring(0,8)}]`;
  
  return {
    info: (msg: string, ...args: any[]) => console.log(`${prefix} ℹ️  ${msg}`, ...args),
    success: (msg: string, ...args: any[]) => console.log(`${prefix} ✓ ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`${prefix} ⚠️  ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`${prefix} ❌ ${msg}`, ...args),
    debug: (msg: string, data: any) => console.log(`${prefix} 🔍 ${msg}`, JSON.stringify(data, null, 2))
  };
}

// PATCH 4: Calcular hash SHA256 do prompt
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PROMPT_VERSION = '2.0'; // Incrementar quando mudar lógica de scoring
const MODEL_NAME = 'google/gemini-2.5-flash';

/**
 * PATCH 3: Parser robusto e consciente de tipo de tratamento
 * Extrai informações das seções "DENTES A SEREM TRATADOS" e "ESPECIFICAÇÕES TÉCNICAS"
 * do relatório técnico gerado pelo Gemini.
 */
function parseReport(report: string, treatment: 'facetas' | 'clareamento') {
  const result: { dentes_tratados: string[]; especificacoes: Record<string, string> } = {
    dentes_tratados: [],
    especificacoes: {},
  };
  
  if (!report || typeof report !== 'string') {
    console.warn('Relatório vazio ou inválido');
    return result;
  }

  const text = report.replace(/\r/g, '');
  console.log(`📄 Parsing relatório (tipo: ${treatment}, tamanho: ${text.length} chars)`);
  
  // ========================================
  // EXTRAÇÃO DE DENTES (apenas para facetas)
  // ========================================
  if (treatment === 'facetas') {
    console.log('🔍 Procurando seção "DENTES A SEREM TRATADOS"...');
    
    // Busca flexível com sinônimos
    const dentesRegex = /(?:DENTES?\s+(?:A\s+SEREM?\s+)?TRATADOS?|ELEMENTOS?\s+DENTAIS?|TEETH\s+TO\s+TREAT)([\s\S]*?)(?:ESPECIFICA[ÇC][ÕO]ES|PLANEJAMENTO|$)/i;
    const dentesMatch = text.match(dentesRegex);
    
    if (dentesMatch) {
      const dentesSection = dentesMatch[1];
      console.log('✓ Seção de dentes encontrada');
      
      // Códigos FDI: (11), (21), etc.
      const teethRegex = /\((\d{2})\)/g;
      const teeth = [] as string[];
      let m;
      while ((m = teethRegex.exec(dentesSection)) !== null) {
        teeth.push(m[1]);
      }
      
      result.dentes_tratados = teeth;
      console.log(`✓ Dentes FDI extraídos: [${teeth.join(', ')}]`);
      
      if (teeth.length === 0) {
        console.warn('⚠️ Nenhum código FDI encontrado na seção');
      }
    } else {
      console.log('ℹ️  Seção de dentes não encontrada (pode ser normal para clareamento)');
    }
  } else {
    console.log('ℹ️  Tipo clareamento: pulando extração de dentes FDI');
  }
  
  // ========================================
  // EXTRAÇÃO DE ESPECIFICAÇÕES (ambos os tipos)
  // ========================================
  console.log('🔍 Procurando especificações técnicas...');
  
  const specsRegex = /(?:ESPECIFICA[ÇC][ÕO]ES?\s+T[ÉE]CNICAS?|TECHNICAL\s+SPECS?|DETALHES\s+T[ÉE]CNICOS?)([\s\S]*?)(?:PLANEJAMENTO|CUIDADOS|PROGN[ÓO]STICO|$)/i;
  const specsMatch = text.match(specsRegex);
  
  if (specsMatch) {
    const specsSection = specsMatch[1];
    console.log('✓ Especificações encontradas');
    
    // Extrair pares chave:valor
    const lines = specsSection.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const kvMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = kvMatch[2].trim();
        result.especificacoes[key] = value;
      }
    }
    console.log(`✓ ${Object.keys(result.especificacoes).length} especificações extraídas`);
  } else {
    console.log(`ℹ️  Especificações não encontradas (normal para ${treatment})`);
  }
  
  console.log('📊 Parsing concluído');
  return result;
}

/**
 * Retorna descrição personalizada da cor baseada no código Vita e tom de pele
 */
function getColorDescription(colorCode: string, skinTone: string): string {
  const code = colorCode.toUpperCase().trim();
  const tone = skinTone.toLowerCase();
  
  const descriptions: Record<string, Record<string, string>> = {
    'BL1': {
      'clara': 'Very bright cool white, ideal for fair complexion - creates striking contrast',
      'média': 'Very bright cool white - bold choice for confident smile',
      'morena': 'Very bright cool white - creates dramatic Hollywood effect',
      'escura': 'Very bright cool white - stunning contrast with darker complexion'
    },
    'BL2': {
      'clara': 'Bright cool white, natural-looking for fair skin',
      'média': 'Bright cool white, universally flattering',
      'morena': 'Bright cool white - elegant and modern',
      'escura': 'Bright cool white - beautiful contrast'
    },
    'A1': {
      'clara': 'Natural white with neutral undertone - timeless elegance for fair skin',
      'média': 'Natural white, neutral undertone - universally flattering choice',
      'morena': 'Natural white - fresh and confident look',
      'escura': 'Natural white - harmonious and professional'
    },
    'A2': {
      'clara': 'Warm natural white - soft and elegant',
      'média': 'Warm natural white - naturally beautiful',
      'morena': 'Warm natural white - perfect harmony with medium-dark skin',
      'escura': 'Warm natural white - ideal balance for darker complexion'
    },
    'A3': {
      'clara': 'Warm ivory white - natural warmth',
      'média': 'Warm ivory white - naturally warm and inviting',
      'morena': 'Warm ivory white - beautifully harmonious',
      'escura': 'Warm ivory white - perfect harmony with darker skin tone'
    },
    'A3.5': {
      'clara': 'Warm beige-white - subtle warmth',
      'média': 'Warm beige-white - natural and understated',
      'morena': 'Warm beige-white - natural harmony',
      'escura': 'Warm beige-white - harmonious with darker complexion'
    },
    'B1': {
      'clara': 'Cool neutral white - fresh and clean for fair skin',
      'média': 'Cool neutral white - universally attractive',
      'morena': 'Cool neutral white - modern elegance',
      'escura': 'Cool neutral white - refined contrast'
    },
    'B2': {
      'clara': 'Soft neutral white - gentle elegance',
      'média': 'Soft neutral white - naturally balanced',
      'morena': 'Soft neutral white - subtle sophistication',
      'escura': 'Soft neutral white - elegant harmony'
    }
  };
  
  const toneKey = tone.includes('clara') ? 'clara' : 
                  tone.includes('média') || tone.includes('media') ? 'média' :
                  tone.includes('morena') ? 'morena' : 'escura';
  
  return descriptions[code]?.[toneKey] || 
         descriptions['A1']?.[toneKey] || 
         'Natural white shade that complements your complexion beautifully';
}

/**
 * ✅ NOVO: Prompt de simulação conservador BL2-BL4
 * Constrói o prompt para geração de imagem respeitando serviços ativos e faixa cromática
 */
function buildSimulationPrompt(
  analiseJSON: any,
  servicos_ativos: string[],
  beforeImageRef: string
): string {
  return `
Você é um assistente de design de sorriso. Gere uma imagem simulada realista do "depois" com base na foto "antes" (${beforeImageRef}) e nos dados de "analiseJSON".

REGRAS DE RENDERIZAÇÃO:
- **Preserve** identidade, ângulo de câmera, expressão, pele, olhos e iluminação.
- **Modifique apenas os dentes**: forma, microalinhamento e cor segundo o plano.
- **Cor final na escala Vita**: **SEMPRE BL2 (obrigatório)**.
  - NÃO use BL1, BL3, BL4 ou qualquer outra cor.
- **Serviços ativos**: aplique **apenas** procedimentos presentes em ${JSON.stringify(servicos_ativos)}.
- Se "quantidade_facetas" for 2 ou 4, **inclua clareamento** dos demais dentes para uniformizar com a cor das facetas (etapa prévia).
- **Proporção da imagem** deve ser preservada (sem distorções ou crop agressivo).
- Resultado deve ser **natural e plausível** (sem brilho artificial excessivo, sem "Hollywood smile").

PLANOS TÍPICOS:
- 0 facetas → somente clareamento (uniformizar cor para **BL2**).
- 2 facetas (11 e 21) → harmonizar forma/cor desses dentes; clarear os demais para igualar (**BL2**).
- 4 facetas (11, 12, 21, 22) → harmonizar forma/cor nesses; clarear demais dentes (**BL2**).
- 6 facetas (13–23) → harmonizar frente superior; ajustar tom geral para (**BL2**).

DADOS RECEBIDOS:
- quantidade_facetas: ${String(analiseJSON?.quantidade_facetas ?? analiseJSON?.recomendacao_tratamento?.quantidade_facetas ?? 0)}
- dentes_tratados: ${JSON.stringify(analiseJSON?.dentes_tratados ?? analiseJSON?.recomendacao_tratamento?.dentes_fdi_tratados ?? [])}
- cor_recomendada: BL2 (PADRÃO FIXO)
- procedimentos_recomendados: ${JSON.stringify(analiseJSON?.procedimentos_recomendados ?? [])}

SAÍDA:
- Retorne **apenas** a imagem simulada final (ex.: JPEG base64) sem legendas ou texto.
`;
}

/**
 * ✅ FASE 2: GERADOR DE RELATÓRIO TÉCNICO EM TEXTO COM PONTUAÇÃO QUANTITATIVA
 * Converte JSON estruturado com pontuação clínica em relatório narrativo profissional
 */
function generateTextReportFromJSON(
  analiseJSON: any,
  servicosAtivos: Array<{ name: string; category: string; price: number }>
): string {
  const sections: string[] = [];
  const analise = analiseJSON.analise || analiseJSON;

  // 1. ANÁLISE CLÍNICA INICIAL
  sections.push("═══════════════════════════════════════");
  sections.push("ANÁLISE CLÍNICA INICIAL");
  sections.push("═══════════════════════════════════════\n");
  
  sections.push(`Tom de pele: ${analise.tom_pele || 'Não especificado'}`);
  sections.push(`Cor dos olhos: ${analise.cor_olhos || 'Não especificado'}\n`);
  
  // 2. AVALIAÇÃO QUANTITATIVA (NOVO)
  if (analise.estado_geral) {
    const eg = analise.estado_geral;
    
    sections.push("═══════════════════════════════════════");
    sections.push("AVALIAÇÃO QUANTITATIVA");
    sections.push("═══════════════════════════════════════\n");
    
    sections.push(`1. Alinhamento: ${(eg.alinhamento || 'N/A').toUpperCase()} (${eg.alinhamento_pontos || 0} pontos)`);
    sections.push(`   └─ ${eg.alinhamento_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`2. Proporção: ${(eg.proporcao || 'N/A').toUpperCase()} (${eg.proporcao_pontos || 0} pontos)`);
    sections.push(`   └─ ${eg.proporcao_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`3. Forma: ${(eg.forma || 'N/A').toUpperCase()} (${eg.forma_pontos || 0} pontos)`);
    sections.push(`   └─ ${eg.forma_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`4. Integridade: ${(eg.integridade || 'N/A').toUpperCase()} (${eg.integridade_pontos || 0} pontos)`);
    sections.push(`   └─ ${eg.integridade_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`5. Cor: ${(eg.cor || 'N/A').toUpperCase()} (${eg.cor_pontos || 0} pontos)`);
    sections.push(`   └─ ${eg.cor_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`6. Linha Gengival: ${(eg.linha_gengival || 'N/A').toUpperCase()}`);
    sections.push(`   └─ ${eg.linha_gengival_detalhes || 'Sem detalhes'}\n`);
    
    sections.push(`────────────────────────────────────────`);
    sections.push(`📊 PONTUAÇÃO TOTAL: ${eg.pontuacao_total || 0} pontos`);
    sections.push(`📋 INTERPRETAÇÃO: ${eg.interpretacao || '0-2: Clareamento | 3-4: Avaliar | 5+: Facetas'}\n`);
  }

  // 3. DECISÃO CLÍNICA (NOVO)
  if (analise.decisao_clinica) {
    const dc = analise.decisao_clinica;
    
    sections.push("═══════════════════════════════════════");
    sections.push("DECISÃO CLÍNICA");
    sections.push("═══════════════════════════════════════\n");
    
    sections.push(`Conduta: ${(dc.conducta || 'NÃO ESPECIFICADA').toUpperCase()}\n`);
    sections.push(`Justificativa Técnica:`);
    sections.push(`${dc.justificativa_tecnica || 'Não fornecida'}\n`);
    
    if (dc.quantidade_facetas > 0) {
      sections.push(`Quantidade de facetas: ${dc.quantidade_facetas}`);
      sections.push(`Dentes a serem tratados: ${dc.dentes_tratados?.join(', ') || 'Não especificado'}\n`);
      
      if (dc.dentes_justificativa) {
        sections.push(`Justificativa por dente:`);
        sections.push(`${dc.dentes_justificativa}\n`);
      }
    }
  }

  // 4. DETALHAMENTO POR DENTE (NOVO - apenas se houver facetas)
  if (analise.detalhamento_por_dente && Object.keys(analise.detalhamento_por_dente).length > 0) {
    sections.push("═══════════════════════════════════════");
    sections.push("DETALHAMENTO POR DENTE");
    sections.push("═══════════════════════════════════════\n");
    
    const dentes = ['11', '21', '12', '22', '13', '23'];
    dentes.forEach(dente => {
      const det = analise.detalhamento_por_dente[dente];
      if (det && det.problemas && det.problemas.length > 0) {
        sections.push(`Dente ${dente}:`);
        sections.push(`  Problemas: ${det.problemas.join(', ')}`);
        sections.push(`  Faceta necessária: ${det.necessita_faceta ? 'SIM' : 'NÃO'}`);
        if (det.justificativa) {
          sections.push(`  Justificativa: ${det.justificativa}`);
        }
        sections.push('');
      }
    });
  }

  // 5. PROCEDIMENTOS RECOMENDADOS
  if (analise.procedimentos_recomendados && analise.procedimentos_recomendados.length > 0) {
    sections.push("═══════════════════════════════════════");
    sections.push("PROCEDIMENTOS RECOMENDADOS");
    sections.push("═══════════════════════════════════════\n");
    
    analise.procedimentos_recomendados.forEach((proc: string, index: number) => {
      sections.push(`${index + 1}. ${proc}`);
    });
    sections.push("");
  }

  // 6. ESPECIFICAÇÕES TÉCNICAS
  sections.push("═══════════════════════════════════════");
  sections.push("ESPECIFICAÇÕES TÉCNICAS");
  sections.push("═══════════════════════════════════════\n");
  
  sections.push(`Cor final recomendada: ${analise.cor_recomendada || 'BL2'} (escala Vita)`);
  sections.push(`Protocolo: Padrão da clínica para resultados harmoniosos\n`);
  
  // Detectar tipo de faceta nos serviços ativos (apenas se houver facetas)
  const quantidadeFacetas = analise.decisao_clinica?.quantidade_facetas || analise.quantidade_facetas || 0;
  if (quantidadeFacetas > 0) {
    const tipoFaceta = servicosAtivos.find(s => 
      s.name.toLowerCase().includes('porcelana') || 
      s.name.toLowerCase().includes('cerâmica')
    ) ? 'Cerâmica/Porcelana' : 'Resina composta';
    
    sections.push(`Material: ${tipoFaceta}`);
    sections.push("Técnica: Minimamente invasiva com preservação dental");
    sections.push("Preparo: Conservador com manutenção da estrutura dentária\n");
  }

  // 3. PROCEDIMENTOS RECOMENDADOS
  if (analiseJSON.procedimentos_recomendados && analiseJSON.procedimentos_recomendados.length > 0) {
    sections.push("═══════════════════════════════════════");
    sections.push("PROCEDIMENTOS RECOMENDADOS");
    sections.push("═══════════════════════════════════════\n");
    
    analiseJSON.procedimentos_recomendados.forEach((proc: string, index: number) => {
      sections.push(`${index + 1}. ${proc}`);
    });
    sections.push("");
  }

  // 4. ESPECIFICAÇÕES TÉCNICAS (quando há facetas)
  if (analiseJSON.quantidade_facetas > 0) {
    sections.push("═══════════════════════════════════════");
    sections.push("ESPECIFICAÇÕES TÉCNICAS");
    sections.push("═══════════════════════════════════════\n");
    
    // Detectar tipo de faceta nos serviços ativos
    const tipoFaceta = servicosAtivos.find(s => 
      s.name.toLowerCase().includes('porcelana') || 
      s.name.toLowerCase().includes('cerâmica')
    ) ? 'Cerâmica/Porcelana' : 'Resina composta';
    
    sections.push(`Material: ${tipoFaceta}`);
    sections.push(`Cor: ${analiseJSON.cor_recomendada} (Vita)`);
    sections.push("Técnica: Minimamente invasiva com preservação dental");
    sections.push("Preparo: Conservador com manutenção da estrutura dentária\n");
  }

  // 5. PLANEJAMENTO DO TRATAMENTO
  sections.push("═══════════════════════════════════════");
  sections.push("PLANEJAMENTO DO TRATAMENTO");
  sections.push("═══════════════════════════════════════\n");
  
  let etapa = 1;
  
  // Etapa 1: Consulta inicial (sempre)
  sections.push(`Etapa ${etapa}: Consulta de avaliação e planejamento digital`);
  etapa++;
  
  // Etapa 2: Clareamento (se recomendado)
  if (analiseJSON.procedimentos_recomendados?.some((p: string) => p.toLowerCase().includes('clarear'))) {
    sections.push(`Etapa ${etapa}: Clareamento dental ${analiseJSON.quantidade_facetas > 0 ? '(pré-facetas)' : ''}`);
    etapa++;
  }
  
  // Etapa 3: Gengivoplastia (se recomendado)
  if (analiseJSON.procedimentos_recomendados?.some((p: string) => p.toLowerCase().includes('gengivo'))) {
    sections.push(`Etapa ${etapa}: Gengivoplastia (contorno gengival)`);
    etapa++;
  }
  
  // Etapa 4: Facetas (se recomendado)
  if (analiseJSON.quantidade_facetas > 0) {
    sections.push(`Etapa ${etapa}: Confecção e instalação das facetas`);
    etapa++;
  }
  
  // Etapa 5: Ajustes e polimento final
  sections.push(`Etapa ${etapa}: Ajustes finais e polimento\n`);

  // 6. CUIDADOS PÓS-PROCEDIMENTO
  sections.push("═══════════════════════════════════════");
  sections.push("CUIDADOS PÓS-PROCEDIMENTO");
  sections.push("═══════════════════════════════════════\n");
  sections.push("- Higiene oral rigorosa com escovação 3x ao dia");
  sections.push("- Uso de fio dental diariamente");
  sections.push("- Evitar alimentos muito duros nas primeiras semanas");
  if (analiseJSON.procedimentos_recomendados?.some((p: string) => p.toLowerCase().includes('clarear'))) {
    sections.push("- Evitar alimentos/bebidas pigmentados por 48h após clareamento");
  }
  sections.push("- Consultas de acompanhamento semestrais\n");

  // 7. PROGNÓSTICO
  sections.push("═══════════════════════════════════════");
  sections.push("PROGNÓSTICO E DURABILIDADE");
  sections.push("═══════════════════════════════════════\n");
  
  if (analiseJSON.quantidade_facetas > 0) {
    sections.push("Com cuidados adequados, facetas de cerâmica/resina possuem durabilidade média de 10-15 anos.");
  } else {
    sections.push("Clareamento dental possui duração média de 1-3 anos, dependendo dos hábitos alimentares.");
  }
  sections.push("Prognóstico: Excelente, com resultados estéticos naturais e harmoniosos.\n");

  // 8. OBSERVAÇÕES IMPORTANTES
  sections.push("═══════════════════════════════════════");
  sections.push("OBSERVAÇÕES IMPORTANTES");
  sections.push("═══════════════════════════════════════\n");
  sections.push("- Este relatório é baseado em análise fotográfica preliminar");
  sections.push("- Avaliação clínica presencial é obrigatória antes do início do tratamento");
  sections.push("- Radiografias e exames complementares podem ser necessários");
  sections.push("- O plano de tratamento pode ser ajustado após avaliação presencial");

  return sections.join("\n");
}

/**
 * ✅ FASE 1: Prompt de análise com sistema de pontuação clínica quantitativa
 * Sistema baseado em critérios numéricos objetivos (mm, graus, %) para decisões consistentes
 */
function buildAnalysisPrompt(
  analiseJSON: any,
  servicos_ativos: string[]
): string {
  return `
Você é um dentista especialista em odontologia estética com formação em Ortodontia e Prótese.
Sua análise DEVE ser baseada em CRITÉRIOS TÉCNICOS OBJETIVOS e EVIDÊNCIAS FOTOGRÁFICAS.

═══════════════════════════════════════════════════════════════════════
🎯 SISTEMA DE DECISÃO CLÍNICA - CRITÉRIOS QUANTITATIVOS OBRIGATÓRIOS
═══════════════════════════════════════════════════════════════════════

METODOLOGIA DE AVALIAÇÃO (3 ETAPAS):

ETAPA 1: ANÁLISE QUANTITATIVA POR CATEGORIA
ETAPA 2: PONTUAÇÃO DE SEVERIDADE
ETAPA 3: DECISÃO BASEADA EM EVIDÊNCIAS

───────────────────────────────────────────────────────────────────────
ETAPA 1: CRITÉRIOS QUANTITATIVOS DE AVALIAÇÃO
───────────────────────────────────────────────────────────────────────

Para CADA categoria abaixo, classifique como NORMAL, LEVE ou SEVERO:

🔸 CATEGORIA 1: ALINHAMENTO (Rotações e Posição)

NORMAL (0 pontos):
• Rotações ≤ 10° em qualquer dente
• Projeção/recuo ≤ 1mm em relação ao arco
• Sem sobreposições visíveis
• Linha incisal harmoniosa

LEVE (1 ponto):
• Rotações entre 10-20° em 1-2 dentes
• Projeção/recuo entre 1-2mm
• Leve assimetria no arco (não impacta função)

SEVERO (3 pontos): ← INDICA FACETAS
• Rotações > 20° em qualquer dente
• Projeção/recuo > 2mm (dente visivelmente "para dentro" ou "para fora")
• Sobreposições dentárias
• Caninos projetados > 2mm para fora do arco

🔸 CATEGORIA 2: PROPORÇÃO E SIMETRIA

NORMAL (0 pontos):
• Laterais (12/22): diferença de tamanho ≤ 10%
• Centrais (11/21): diferença de tamanho ≤ 5%
• Proporção largura/altura: 75-85%
• Simetria bilateral preservada

LEVE (1 ponto):
• Laterais: diferença 10-20%
• Centrais: diferença 5-15%
• Assimetria perceptível mas não grotesca

SEVERO (3 pontos): ← INDICA FACETAS
• Laterais: diferença > 20% (um visivelmente menor)
• Centrais: diferença > 15%
• Um lateral claramente menor/maior que o contralateral
• Desproporção que compromete harmonia do sorriso

🔸 CATEGORIA 3: FORMA DENTÁRIA

NORMAL (0 pontos):
• Forma retangular-ovalada adequada
• Bordas incisais íntegras
• Ângulos preservados
• Anatomia dental harmoniosa

LEVE (1 ponto):
• Desgaste incisal leve (< 1mm)
• Pequenas irregularidades nas bordas
• Forma levemente triangular nos laterais

SEVERO (3 pontos): ← INDICA FACETAS
• Desgaste incisal > 2mm (borda plana/irregular)
• Dentes excessivamente triangulares (formato "ponta")
• Fraturas visíveis em esmalte
• Forma inadequada para a face do paciente

🔸 CATEGORIA 4: INTEGRIDADE ESTRUTURAL

NORMAL (0 pontos):
• Sem restaurações visíveis
• Esmalte íntegro
• Sem diastemas
• Estrutura preservada

LEVE (1 ponto):
• Pequenas restaurações em resina (< 30% da face vestibular)
• Diastema < 1mm
• Manchas leves de fluorose

SEVERO (3 pontos): ← INDICA FACETAS
• Restaurações extensas (> 30% da face vestibular)
• Manchas ao redor de restaurações
• Diastemas > 1.5mm entre incisivos centrais
• Fraturas de esmalte
• Múltiplas restaurações com cores diferentes

🔸 CATEGORIA 5: COR DENTÁRIA

NORMAL (0 pontos):
• Cor UNIFORME entre todos os dentes
• Tom entre A2-A3.5 (natural)
• Sem manchas ou descolorações
• Translucidez incisal preservada

LEVE (1 ponto):
• Cor UNIFORME mas amarelada (A3.5-B3)
• Leve variação de tom (< 1 shade entre dentes)
• Clareamento resolve completamente

SEVERO (3 pontos): ← INDICA FACETAS
• Cor DESUNIFORME entre dentes (≥ 2 shades de diferença)
• Centrais claros (A1) + laterais amarelos (A3.5) = "efeito chiclete"
• Manchas brancas/marrons em esmalte
• Restaurações com cor diferente dos dentes
• Cor UNIFORME só resolve com facetas + clareamento conjunto

🔸 CATEGORIA 6: LINHA GENGIVAL E SORRISO GENGIVAL

NORMAL (0 pontos):
• Exposição gengival ≤ 2mm ao sorrir
• Linha gengival simétrica
• Contorno harmônico

LEVE (1 ponto):
• Exposição gengival 2-3mm
• Leve assimetria (< 1mm de diferença)

SEVERO (2 pontos): ← INDICA GENGIVOPLASTIA (não facetas)
• Exposição gengival > 3mm (sorriso gengival)
• Assimetria > 1mm
• Obs: Gengivoplastia é procedimento COMPLEMENTAR

───────────────────────────────────────────────────────────────────────
ETAPA 2: SISTEMA DE PONTUAÇÃO
───────────────────────────────────────────────────────────────────────

Some os pontos de TODAS as categorias (exceto categoria 6):

PONTUAÇÃO TOTAL = Σ (categorias 1-5)

Máximo possível: 15 pontos (3 × 5 categorias)

───────────────────────────────────────────────────────────────────────
ETAPA 3: DECISÃO CLÍNICA BASEADA NA PONTUAÇÃO
───────────────────────────────────────────────────────────────────────

📊 INTERPRETAÇÃO DA PONTUAÇÃO:

0-2 PONTOS → APENAS CLAREAMENTO ✅
├─ Estrutura dental EXCELENTE
├─ Alinhamento, proporção e forma adequados
├─ Problema principal (se houver): cor uniforme amarelada
└─ Conduta: Clareamento dental resolve

3-4 PONTOS → AVALIAR CASO A CASO ⚠️
├─ Se problema ÚNICO for COR DESUNIFORME → Facetas seletivas
├─ Se problema PRINCIPAL for ESTRUTURAL → Facetas
├─ Se problemas LEVES múltiplos → Considerar clareamento primeiro
└─ Use bom senso clínico

5+ PONTOS → FACETAS INDICADAS ✅
├─ Múltiplos fatores comprometidos
├─ OU único fator SEVERAMENTE comprometido
├─ Facetas são necessidade clínica (não estética)
└─ Clareamento isolado NÃO resolve

═══════════════════════════════════════════════════════════════════════
📋 EXEMPLOS PRÁTICOS DE APLICAÇÃO
═══════════════════════════════════════════════════════════════════════

CASO 1: Apenas dentes amarelados uniformes
├─ Alinhamento: NORMAL (0 pontos)
├─ Proporção: NORMAL (0 pontos)
├─ Forma: NORMAL (0 pontos)
├─ Integridade: NORMAL (0 pontos)
├─ Cor: LEVE - amarelado uniforme (1 ponto)
└─ TOTAL: 1 ponto → CLAREAMENTO

CASO 2: Dente 12 recuado + laterais pequenos
├─ Alinhamento: SEVERO - dente 12 recuado 2.5mm (3 pontos)
├─ Proporção: SEVERO - 12 é 25% menor que 22 (3 pontos)
├─ Forma: NORMAL (0 pontos)
├─ Integridade: NORMAL (0 pontos)
├─ Cor: LEVE - uniforme amarelado (1 ponto)
└─ TOTAL: 7 pontos → 4 FACETAS (11,21,12,22) + clareamento demais

CASO 3: Centrais com restaurações + laterais amarelos
├─ Alinhamento: NORMAL (0 pontos)
├─ Proporção: LEVE - pequena assimetria (1 ponto)
├─ Forma: NORMAL (0 pontos)
├─ Integridade: SEVERO - restaurações extensas em 11,21 (3 pontos)
├─ Cor: SEVERO - centrais A1, laterais A3.5 (3 pontos)
└─ TOTAL: 7 pontos → 4 FACETAS + clareamento dos caninos

═══════════════════════════════════════════════════════════════════════
🦷 QUANTIDADE DE FACETAS - CRITÉRIOS TÉCNICOS
═══════════════════════════════════════════════════════════════════════

0 FACETAS (Apenas Clareamento):
✅ Pontuação total: 0-2 pontos
✅ Estrutura dental excelente
✅ Único problema: cor uniforme (se houver)

2 FACETAS (Incisivos Centrais: 11, 21):
✅ Pontuação ≥ 5 E problemas CONCENTRADOS em 11 e 21
✅ Exemplos:
   - Restaurações extensas apenas em 11 e 21
   - Fraturas apenas em centrais
   - Centrais com forma inadequada + laterais OK

4 FACETAS (Incisivos: 11, 21, 12, 22):
✅ Pontuação ≥ 5 E problemas nos INCISIVOS
✅ Exemplos:
   - Cor desuniforme: centrais claros + laterais escuros
   - Dente 12 recuado + assimetria 12 vs 22
   - Forma inadequada em múltiplos incisivos
   - Restaurações em incisivos

6 FACETAS (Arco anterior: 13, 12, 11, 21, 22, 23):
✅ Pontuação ≥ 8 E problemas INCLUEM caninos
✅ Exemplos:
   - Caninos projetados/rotacionados (>2mm ou >20°)
   - Caninos com forma inadequada
   - Cor desuniforme envolvendo caninos
   - Problemas estruturais em toda arcada anterior

⚠️ REGRA CRÍTICA: NUNCA recomende 6 facetas por "padrão estético"
Só recomende 6 se caninos tiverem problemas QUANTIFICÁVEIS

═══════════════════════════════════════════════════════════════════════
🎨 COR RECOMENDADA - SEMPRE BL2 (PADRÃO DA CLÍNICA)
═══════════════════════════════════════════════════════════════════════

Independente do resultado da análise:
• cor_recomendada: "BL2" (FIXO)
• Justificativa: Protocolo padrão da clínica para resultados harmoniosos

═══════════════════════════════════════════════════════════════════════
📤 FORMATO DE RESPOSTA - APENAS JSON VÁLIDO
═══════════════════════════════════════════════════════════════════════

Retorne APENAS este JSON (sem tags, sem markdown, sem texto adicional):

{
  "analise": {
    "tom_pele": "clara|média|morena|escura",
    "cor_olhos": "claros|médios|escuros",
    
    "estado_geral": {
      "alinhamento": "normal|leve|severo",
      "alinhamento_pontos": 0|1|3,
      "alinhamento_detalhes": "Rotações <10° em todos os dentes",
      
      "proporcao": "normal|leve|severo",
      "proporcao_pontos": 0|1|3,
      "proporcao_detalhes": "Laterais 12=22, diferença <5%",
      
      "forma": "normal|leve|severo",
      "forma_pontos": 0|1|3,
      "forma_detalhes": "Forma retangular adequada, sem desgastes",
      
      "integridade": "normal|leve|severo",
      "integridade_pontos": 0|1|3,
      "integridade_detalhes": "Esmalte íntegro, sem restaurações",
      
      "cor": "normal|leve|severo",
      "cor_pontos": 0|1|3,
      "cor_detalhes": "Cor uniforme A3 em todos os dentes",
      
      "linha_gengival": "normal|leve|severo",
      "linha_gengival_detalhes": "Exposição <2mm, simétrica",
      
      "pontuacao_total": 0,
      "interpretacao": "0-2: Clareamento | 3-4: Avaliar | 5+: Facetas"
    },
    
    "decisao_clinica": {
      "conducta": "clareamento|facetas|facetas+clareamento",
      "justificativa_tecnica": "Pontuação total: 1 ponto. Estrutura dental excelente (alinhamento, proporção, forma adequados). Único problema: cor uniforme amarelada A3. Clareamento resolve completamente.",
      "quantidade_facetas": 0|2|4|6,
      "dentes_tratados": [],
      "dentes_justificativa": "Para cada dente, explique o problema quantificado"
    },
    
    "procedimentos_recomendados": [
      "Clareamento Dental",
      "Facetas de Porcelana",
      "Gengivoplastia"
    ],
    
    "cor_recomendada": "BL2",
    
    "detalhamento_por_dente": {
      "11": {
        "problemas": ["restauração extensa 40%", "cor A1 (desuniforme)"],
        "necessita_faceta": true|false,
        "justificativa": "Restauração >30% + cor 2 shades mais clara"
      },
      "12": {
        "problemas": ["recuado 2.5mm", "25% menor que dente 22"],
        "necessita_faceta": true|false,
        "justificativa": "Recuo >2mm + assimetria >20%"
      }
    }
  }
}

═══════════════════════════════════════════════════════════════════════
✅ CHECKLIST FINAL - ANTES DE GERAR A RESPOSTA
═══════════════════════════════════════════════════════════════════════

□ Avaliei CADA categoria com critérios quantitativos?
□ Calculei a pontuação TOTAL honestamente?
□ A decisão está ALINHADA com a pontuação?
□ Justifiquei com DADOS numéricos (mm, graus, %)?
□ Se indiquei facetas, pontuação ≥5?
□ Se indiquei clareamento, pontuação ≤2?
□ Quantidade de facetas está JUSTIFICADA dente a dente?
□ Cor recomendada é BL2?
□ JSON está válido (sem markdown, sem tags)?

Serviços disponíveis: ${JSON.stringify(servicos_ativos)}

Gere o JSON de análise agora:`;
}

// Prompt estático (será substituído pelo dinâmico)
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
   **ATENÇÃO: Use SEMPRE e OBRIGATORIAMENTE a cor BL2.**
   
   Independente do tom de pele ou cor dos olhos, a cor final DEVE SER:
   - cor_recomendada: "BL2"
   
   NÃO use BL1, BL3, BL4, A1, A2, A3, B1, B2 ou qualquer outra cor.
   
   Justificativa: BL2 é a cor padrão da clínica para resultados naturais e harmoniosos.

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
  
  // PATCH 5: Gerar run_id único para rastreamento
  const runId = crypto.randomUUID();
  const log = createLogger(runId);
  
  try {
    const body = await req.json();
    const { imageBase64, action, analysisData, reportText, config, treatment_type, simulationId, userId } = body;
    
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
      log.info('═══════════════════════════════════════');
      log.info(`AÇÃO: ANÁLISE - Tipo: ${treatment_type || 'facetas'}`);
      log.info(`Modelo: ${MODEL_NAME}`);
      log.info('═══════════════════════════════════════');
      
      // PATCH 1: Guard clause - verificar permissão do módulo de clareamento
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
      
      // PATCH 2: Idempotência - verificar requisição duplicada
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
        
        // Atualizar status para 'analyzing'
        await supabase
          .from('simulations')
          .update({ 
            status: 'analyzing', 
            run_id: runId,
            idempotency_key: body.idempotencyKey
          })
          .eq('id', simulationId);
        
        log.info(`Idempotency key registrado: ${body.idempotencyKey}`);
      }
      
      // Receber e processar serviços ativos
      const servicos_ativos = body.servicos_ativos || [];
      console.log('🛠️ Serviços ativos recebidos:', servicos_ativos.length);
      
      // Categorizar serviços disponíveis
      const tratamentosDisponiveis = {
        facetas: servicos_ativos.some((s: any) => 
          s.name.toLowerCase().includes('faceta') || 
          s.name.toLowerCase().includes('lente')
        ),
        clareamento: servicos_ativos.some((s: any) => 
          s.name.toLowerCase().includes('clarear')
        ),
        gengivoplastia: servicos_ativos.some((s: any) => 
          s.name.toLowerCase().includes('gengivo')
        ),
        planejamento: servicos_ativos.some((s: any) => 
          s.name.toLowerCase().includes('planejamento') ||
          s.name.toLowerCase().includes('dsd')
        )
      };
      
      console.log('✓ Tratamentos disponíveis:', tratamentosDisponiveis);
      
      // ✅ FASE 4: Selecionar prompt baseado em treatment_type
      const servicos_ativos_names = servicos_ativos.map((s: any) => s.name || s);
      let analysisPrompt: string;
      
      if (treatment_type === 'clareamento') {
        // Usar prompt simplificado para clareamento
        analysisPrompt = WHITENING_PROMPT;
        console.log('📝 Prompt de CLAREAMENTO selecionado');
      } else {
        // Usar prompt completo para facetas
        analysisPrompt = buildAnalysisPrompt({}, servicos_ativos_names);
        console.log('📝 Prompt de FACETAS selecionado');
      }
      
      console.log(`📝 Prompt construído: ${analysisPrompt.length} caracteres`);
      console.log('✓ Prompt adaptado ao tipo de tratamento');
      
      // Timeout de 90 segundos para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Timeout: requisição excedeu 90 segundos');
        controller.abort();
      }, 90000);
      
      try {
        // Usar exclusivamente Gemini
        const model = 'google/gemini-2.5-flash';
        const apiKeyToUse = apiKey; // LOVABLE_API_KEY
        
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
                  { type: 'text', text: analysisPrompt },
                  { type: 'image_url', image_url: { url: imageBase64 } },
                ],
              },
            ],
            response_mime_type: 'application/json',  // ← FORÇAR JSON PURO
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
        const responseText = analysisResult.choices?.[0]?.message?.content?.trim();
        
        if (!responseText) {
          throw new Error('Gemini não retornou conteúdo');
        }
        
        console.log('✓ Resposta JSON recebida do Gemini');
        console.log(`📝 Tamanho: ${responseText.length} caracteres`);
        
        // Parsear JSON com limpeza de tags Markdown
        let analise_data;
        try {
          let cleanJsonText = responseText.trim();
          
          // 🐛 CORREÇÃO CRÍTICA: Remove tags Markdown (```json e ```)
          if (cleanJsonText.startsWith('```')) {
            cleanJsonText = cleanJsonText.replace(/```(json)?\s*/i, '').trim();
            cleanJsonText = cleanJsonText.replace(/```$/, '').trim();
            console.log('🧹 Tags Markdown removidas');
          }
          
          analise_data = JSON.parse(cleanJsonText);
          console.log('✓ JSON parseado com sucesso');
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          console.error('📄 Resposta recebida:', responseText.substring(0, 500));
          throw new Error('Resposta da IA não está em formato JSON válido');
        }
        
        // ✅ FASE 3: Validação completa com sistema de pontuação
        if (!analise_data.analise) {
          console.error('═══════════════════════════════════════');
          console.error('❌ JSON incompleto:', JSON.stringify(analise_data, null, 2));
          console.error('Mensagem: Faltam campos obrigatórios (analise)');
          console.error('═══════════════════════════════════════');
          throw new Error('JSON incompleto - faltam campos obrigatórios');
        }

        const analise = analise_data.analise;
        
        // Validar estado_geral
        if (!analise.estado_geral || typeof analise.estado_geral !== 'object') {
          console.error('❌ JSON inválido: falta campo "estado_geral"');
          throw new Error('JSON inválido: falta campo "estado_geral"');
        }
        
        const eg = analise.estado_geral;
        
        // Validar pontuação de cada categoria
        if (typeof eg.alinhamento_pontos !== 'number' || 
            typeof eg.proporcao_pontos !== 'number' ||
            typeof eg.forma_pontos !== 'number' ||
            typeof eg.integridade_pontos !== 'number' ||
            typeof eg.cor_pontos !== 'number') {
          console.error('❌ JSON inválido: faltam campos de pontuação');
          throw new Error('JSON inválido: faltam campos de pontuação');
        }
        
        // Validar pontuacao_total
        if (typeof eg.pontuacao_total !== 'number') {
          console.error('❌ JSON inválido: falta "pontuacao_total"');
          throw new Error('JSON inválido: falta "pontuacao_total"');
        }
        
        // Validar decisao_clinica
        if (!analise.decisao_clinica) {
          console.error('❌ JSON inválido: falta "decisao_clinica"');
          throw new Error('JSON inválido: falta "decisao_clinica"');
        }
        
        // ✅ FASE 5: Logs de depuração detalhados
        console.log('═══════════════════════════════════════');
        console.log('📊 SISTEMA DE PONTUAÇÃO CLÍNICA');
        console.log('═══════════════════════════════════════');
        console.log('Categoria 1 - Alinhamento:', eg.alinhamento, `(${eg.alinhamento_pontos} pts)`);
        console.log('Categoria 2 - Proporção:', eg.proporcao, `(${eg.proporcao_pontos} pts)`);
        console.log('Categoria 3 - Forma:', eg.forma, `(${eg.forma_pontos} pts)`);
        console.log('Categoria 4 - Integridade:', eg.integridade, `(${eg.integridade_pontos} pts)`);
        console.log('Categoria 5 - Cor:', eg.cor, `(${eg.cor_pontos} pts)`);
        console.log('Categoria 6 - Linha Gengival:', eg.linha_gengival, '(não conta para score)');
        console.log('───────────────────────────────────────');
        console.log(`📊 PONTUAÇÃO TOTAL: ${eg.pontuacao_total} pontos`);
        console.log(`🎯 DECISÃO: ${analise.decisao_clinica.conducta}`);
        console.log(`💰 FACETAS: ${analise.decisao_clinica.quantidade_facetas || 0}`);
        console.log('═══════════════════════════════════════');
        
        // Validar consistência: pontuação vs decisão
        const score = eg.pontuacao_total;
        const conducta = analise.decisao_clinica.conducta;
        
        if (score <= 2 && conducta !== 'clareamento') {
          console.warn(`⚠️ Inconsistência: score ${score} pts mas conducta "${conducta}"`);
          console.warn('   Esperado: clareamento (score 0-2)');
        }
        if (score >= 5 && !conducta.includes('facetas')) {
          console.warn(`⚠️ Inconsistência: score ${score} pts mas conducta "${conducta}"`);
          console.warn('   Esperado: facetas ou facetas+clareamento (score 5+)');
        }
        
        // ✅ Forçar cor BL2 independente do que a IA retornar
        if (analise_data.analise) {
          analise_data.analise.cor_recomendada = 'BL2';
          console.log('→ Cor normalizada para BL2 (padrão fixo da clínica)');
        }

        // Validação condicional: se há facetas, deve haver dentes tratados
        const quantidadeFacetas = analise.decisao_clinica.quantidade_facetas || 0;
        if (quantidadeFacetas > 0) {
          if (!analise.decisao_clinica.dentes_tratados || analise.decisao_clinica.dentes_tratados.length === 0) {
            console.error('❌ quantidade_facetas > 0 mas dentes_tratados está vazio');
            throw new Error('Quando há facetas recomendadas, dentes_tratados não pode estar vazio');
          }
        }

        // Campos sempre obrigatórios
        if (!analise.cor_recomendada || !analise.procedimentos_recomendados || analise.procedimentos_recomendados.length === 0) {
          console.error('❌ Faltam campos obrigatórios: cor_recomendada ou procedimentos_recomendados');
          throw new Error('Campos obrigatórios ausentes na análise');
        }

        console.log('✅ JSON validado com sucesso');
        console.log(`📋 Procedimentos: ${analise.procedimentos_recomendados.join(', ')}`);
        
        // Verificar se a resposta foi truncada
        const finishReason = analysisResult.choices?.[0]?.finish_reason;
        if (finishReason === 'length') {
          console.warn('⚠️ AVISO: Resposta truncada devido a max_tokens');
        }
        
      // ✅ FASE 4: Gerar relatório técnico em texto narrativo
      console.log('→ Gerando relatório técnico em texto...');
      const relatorio_tecnico = generateTextReportFromJSON(
        analise_data.analise,  // ← Passar apenas o objeto "analise"
        servicos_ativos
      );
      console.log('✓ Relatório técnico gerado:', relatorio_tecnico.substring(0, 200) + '...');
        
        // Retornar JSON estruturado + relatório em texto
        return new Response(
          JSON.stringify({ 
            success: true,
            relatorio_tecnico,
            analise_data,  // ← JSON PURO da IA
            metadata: {
              model: 'google/gemini-2.5-flash',
              timestamp: new Date().toISOString(),
              truncated: finishReason === 'length',
              finish_reason: finishReason
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
      
      // Receber dados estruturados da análise
      const analiseData = body.analiseJSON;
      if (analiseData) {
        console.log('📊 Dados da análise recebidos:', {
          tom_pele: analiseData?.analise?.tom_pele,
          cor_olhos: analiseData?.analise?.cor_olhos,
          cor_recomendada: analiseData?.analise?.cor_recomendada,
          quantidade_facetas: analiseData?.analise?.quantidade_facetas
        });
      }
      
      // EXTRAIR dados das seções relevantes
      // (Orçamento é IGNORADO - não é usado para geração de imagem)
      const treatmentType = body.treatment_type || analiseData?.analise?.tipo_tratamento || 'facetas';
      const extracted = parseReport(report, treatmentType);
      
      // Obter serviços ativos
      const servicos_ativos_generate = (body.servicos_ativos || []).map((s: any) => s.name || s);
      
      // Construir prompt de simulação com dados enriquecidos
      const simulationPrompt = buildSimulationPrompt(
        analiseData || {}, 
        servicos_ativos_generate,
        imageBase64.substring(0, 50) + '...' // Referência à imagem
      );
      
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
