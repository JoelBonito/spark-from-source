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
- **Cor final na escala Vita**: **somente BL2, BL3 ou BL4**.
  - Nunca mais claro que BL2; nunca mais escuro que BL4.
- **Serviços ativos**: aplique **apenas** procedimentos presentes em ${JSON.stringify(servicos_ativos)}.
- Se "quantidade_facetas" for 2 ou 4, **inclua clareamento** dos demais dentes para uniformizar com a cor das facetas (etapa prévia).
- **Proporção da imagem** deve ser preservada (sem distorções ou crop agressivo).
- Resultado deve ser **natural e plausível** (sem brilho artificial excessivo, sem "Hollywood smile").

PLANOS TÍPICOS:
- 0 facetas → somente clareamento (uniformizar cor dentro de BL2–BL4).
- 2 facetas (11 e 21) → harmonizar forma/cor desses dentes; clarear os demais para igualar (BL2–BL4).
- 4 facetas (11, 12, 21, 22) → harmonizar forma/cor nesses; clarear demais dentes (BL2–BL4).
- 6 facetas (13–23) → harmonizar frente superior; considerar ajustar tom geral (BL2–BL4).

DADOS RECEBIDOS:
- quantidade_facetas: ${String(analiseJSON?.quantidade_facetas ?? analiseJSON?.recomendacao_tratamento?.quantidade_facetas ?? 0)}
- dentes_tratados: ${JSON.stringify(analiseJSON?.dentes_tratados ?? analiseJSON?.recomendacao_tratamento?.dentes_fdi_tratados ?? [])}
- cor_recomendada: ${String(analiseJSON?.cor_recomendada ?? analiseJSON?.recomendacao_tratamento?.cor_recomendada ?? 'BL3')}
- procedimentos_recomendados: ${JSON.stringify(analiseJSON?.procedimentos_recomendados ?? [])}

SAÍDA:
- Retorne **apenas** a imagem simulada final (ex.: JPEG base64) sem legendas ou texto.
`;
}

/**
 * ✅ FASE 4: GERADOR DE RELATÓRIO TÉCNICO EM TEXTO (ATUALIZADO PARA NOVO FORMATO)
 * Converte JSON estruturado no novo formato em relatório narrativo profissional
 */
function generateTextReportFromJSON(
  analiseJSON: any,
  servicosAtivos: Array<{ name: string; category: string; price: number }>
): string {
  const sections: string[] = [];

  // 1. ANÁLISE CLÍNICA INICIAL
  sections.push("═══════════════════════════════════════");
  sections.push("ANÁLISE CLÍNICA INICIAL");
  sections.push("═══════════════════════════════════════\n");
  
  sections.push(`Tom de pele: ${analiseJSON.tom_pele || 'Não especificado'}`);
  sections.push(`Cor dos olhos: ${analiseJSON.cor_olhos || 'Não especificado'}\n`);
  
  if (analiseJSON.estado_geral) {
    sections.push("Avaliação Geral:");
    sections.push(`- Alinhamento: ${analiseJSON.estado_geral.alinhamento || 'Adequado'}`);
    sections.push(`- Proporção: ${analiseJSON.estado_geral.proporcao || 'Adequado'}`);
    sections.push(`- Forma: ${analiseJSON.estado_geral.forma || 'Adequado'}`);
    sections.push(`- Cor: ${analiseJSON.estado_geral.cor || 'Adequado'}`);
    sections.push(`- Linha gengival: ${analiseJSON.estado_geral.linha_gengival || 'Adequado'}\n`);
  }

  // 2. INDICAÇÃO DO TRATAMENTO
  sections.push("═══════════════════════════════════════");
  sections.push("INDICAÇÃO DO TRATAMENTO");
  sections.push("═══════════════════════════════════════\n");
  
  sections.push(`Justificativa: ${analiseJSON.justificativa || 'Otimização estética do sorriso'}\n`);
  
  if (analiseJSON.quantidade_facetas > 0) {
    sections.push(`Quantidade de facetas recomendadas: ${analiseJSON.quantidade_facetas}`);
    sections.push(`Dentes a serem tratados (FDI): ${analiseJSON.dentes_tratados?.join(', ') || 'Não especificado'}`);
  } else {
    sections.push("Tratamento conservador: Apenas clareamento dental recomendado");
  }
  
  sections.push(`Cor final recomendada: ${analiseJSON.cor_recomendada || 'BL3'} (escala Vita)\n`);

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
 * ✅ NOVO: Prompt de análise conservador BL2-BL4
 * Construção dinâmica baseada em serviços ativos, retorna APENAS JSON válido
 */
function buildAnalysisPrompt(
  analiseJSON: any,
  servicos_ativos: string[]
): string {
  return `
Você é dentista especialista em odontologia estética. Analise a foto e o objeto "analiseJSON" e gere uma ANÁLISE CLÍNICA e RECOMENDAÇÃO DE TRATAMENTO conservadoras, realistas e alinhadas aos serviços disponíveis.

DADOS RECEBIDOS (resumo):
- quantidade_facetas: ${String(analiseJSON?.quantidade_facetas ?? '')}
- cor_recomendada (se houver): ${String(analiseJSON?.cor_recomendada ?? '')}
- procedimentos_recomendados: ${JSON.stringify(analiseJSON?.procedimentos_recomendados ?? [])}
- tom_pele: ${String(analiseJSON?.tom_pele ?? '')}
- cor_olhos: ${String(analiseJSON?.cor_olhos ?? '')}
- dentes_tratados (se houver): ${JSON.stringify(analiseJSON?.dentes_tratados ?? [])}
- servicos_ativos: ${JSON.stringify(servicos_ativos)}

RESTRIÇÕES:
- Use **somente** procedimentos presentes em servicos_ativos.
- Postura **conservadora**: resultados naturais, sem exageros.
- Cor final **apenas** dentro de **BL2–BL4** (BL2, BL3 ou BL4).
  - Nunca use mais claro que BL2 (BL1/BL0).
  - Nunca use mais escuro que BL4 (A1/A2/A3).
- Se indicar **2 ou 4 facetas**, inclua **obrigatoriamente** "Clareamento Dental" como **primeira etapa**.

REGRAS DE AVALIAÇÃO (resuma, sem inventar):
1) Classifique: alinhamento, proporção/simetria, forma, cor e linha gengival como
   "adequado", "levemente comprometido" ou "comprometido".
   - Variações naturais discretas (<10%) **não** indicam facetas.
2) Indique facetas **somente** com evidência clara de:
   - diastema > 1 mm, desgaste > 2 mm, fratura visível,
   - rotação/desalinhamento > 15°, diferença de forma > 20% entre homólogos.
   Caso contrário, **clareamento** é a conduta padrão (se ativo).
3) Quantidade de facetas (quando aplicável):
   - 0 → estrutura adequada → apenas clareamento (se ativo).
   - 2 → 11 e 21 comprometidos.
   - 4 → 11, 12, 21, 22 comprometidos.
   - 6 → 13 a 23 comprometidos. **Nunca** proponha 6 por padrão.
4) Gengivoplastia só se ativa **e** sorriso gengival > 3 mm.

FORMATO DE RESPOSTA (retorne **APENAS JSON válido**):
{
  "analise": {
    "tom_pele": "<texto curto>",
    "cor_olhos": "<texto curto>",
    "estado_geral": {
      "alinhamento": "adequado|levemente comprometido|comprometido",
      "proporcao": "adequado|levemente comprometido|comprometido",
      "forma": "adequado|levemente comprometido|comprometido",
      "cor": "adequado|levemente comprometido|comprometido",
      "linha_gengival": "adequado|levemente comprometido|comprometido"
    },
    "quantidade_facetas": 0|2|4|6,
    "dentes_tratados": [11,12,21,22],
    "procedimentos_recomendados": [
      // use apenas itens contidos em servicos_ativos;
      // se quantidade_facetas = 2 ou 4, inclua "Clareamento Dental"
    ],
    "cor_recomendada": "BL2|BL3|BL4",
    "justificativa": "síntese técnica objetiva (1-3 frases) com o porquê da indicação"
  }
}

NOTAS DE ESTILO:
- Técnica, objetiva e conservadora.
- Não use termos como "Hollywood smile" ou "transformação drástica".
- Não invente dados; baseie-se na foto e em analiseJSON.
`;
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
      console.log('Modelo: Gemini (google/gemini-2.5-flash)');
      console.log('═══════════════════════════════════════');
      
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
      
      // ✅ NOVO: Usar prompt conservador BL2-BL4
      const servicos_ativos_names = servicos_ativos.map((s: any) => s.name || s);
      const analysisPrompt = buildAnalysisPrompt({}, servicos_ativos_names);
      console.log(`📝 Prompt conservador BL2-BL4 construído: ${analysisPrompt.length} caracteres`);
      console.log('✓ Prompt adaptado aos serviços disponíveis');
      
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
        
        // ✅ FASE 3: Validar estrutura do novo prompt conservador
        if (!analise_data.analise) {
          console.error('═══════════════════════════════════════');
          console.error('❌ JSON incompleto:', JSON.stringify(analise_data, null, 2));
          console.error('Mensagem: Faltam campos obrigatórios (analise)');
          console.error('═══════════════════════════════════════');
          throw new Error('JSON incompleto - faltam campos obrigatórios');
        }

        const analise = analise_data.analise;

        // Validação condicional: se há facetas, deve haver dentes tratados
        if (analise.quantidade_facetas > 0) {
          if (!analise.dentes_tratados || analise.dentes_tratados.length === 0) {
            console.error('❌ quantidade_facetas > 0 mas dentes_tratados está vazio');
            throw new Error('Quando há facetas recomendadas, dentes_tratados não pode estar vazio');
          }
        }

        // Campos sempre obrigatórios
        if (!analise.cor_recomendada || !analise.procedimentos_recomendados || analise.procedimentos_recomendados.length === 0) {
          console.error('❌ Faltam campos obrigatórios: cor_recomendada ou procedimentos_recomendados');
          throw new Error('Campos obrigatórios ausentes na análise');
        }

        console.log('✓ Validação de campos concluída com sucesso');
        
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
      const extracted = parseReport(report);
      
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
