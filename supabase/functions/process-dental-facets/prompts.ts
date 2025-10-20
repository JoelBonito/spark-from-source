/**
 * ═════════════════════════════════════════════════════════════════════════
 * PROMPTS MODULARES PARA ANÁLISE DENTAL
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Este arquivo centraliza todos os prompts usados na análise dental,
 * facilitando manutenção e evolução dos critérios clínicos.
 */

/**
 * PROMPT DE ANÁLISE TÉCNICA COMPARATIVA
 * 
 * Retorna JSON estruturado com:
 * - Colorimetria (VALUE, CHROMA, HUE)
 * - Pontuação estética (antes/depois)
 * - Durabilidade esperada
 * - Prognóstico clínico
 */
export function getAnalysisPrompt(treatmentType: 'facetas' | 'clareamento'): string {
  const isFacetas = treatmentType === 'facetas';
  
  return `Você é um dentista especialista analisando um caso de ${isFacetas ? 'facetas dentárias' : 'clareamento dental'}.

IMAGENS FORNECIDAS:
1. Primeira imagem: ANTES do tratamento (situação atual do paciente)
2. Segunda imagem: DEPOIS do tratamento (simulação do resultado)

TAREFA:
Analise as duas imagens e crie uma avaliação técnica profissional comparativa.

═══════════════════════════════════════════════════════════════════
ANÁLISE COLORIMÉTRICA (ESCALA VITA)
═══════════════════════════════════════════════════════════════════

Para ANTES e DEPOIS, avalie:

1. **VALUE (Luminosidade)**
   - Escala 1-10 (1=muito escuro, 10=muito claro)
   - Dentes antes: ${isFacetas ? '5-7' : '4-6'} (amarelados/escurecidos)
   - Dentes depois: 9-10 (BL2 - branco natural)

2. **CHROMA (Saturação/Intensidade da Cor)**
   - Escala 1-10 (1=neutro/acinzentado, 10=muito saturado/amarelo)
   - Antes: ${isFacetas ? '6-8' : '7-9'} (amarelado visível)
   - Depois: 2-3 (branco dessaturado natural)

3. **HUE (Matiz/Tonalidade)**
   - Antes: Amarelado (Yellow-Orange)
   - Depois: Branco neutro (Neutral White)

4. **COR VITA APROXIMADA**
   - Antes: A3, A3.5, B2, B3 (escalas amareladas)
   - Depois: BL2 (branco luminoso natural)

═══════════════════════════════════════════════════════════════════
PONTUAÇÃO ESTÉTICA (0-10)
═══════════════════════════════════════════════════════════════════

Avalie aspectos visuais:

**ANTES:**
- Cor: ${isFacetas ? '5-7' : '4-6'}/10 (amarelada, manchas)
${isFacetas ? `- Alinhamento: 5-7/10 (desalinhamento leve a moderado)
- Proporção: 6-8/10 (irregular)
- Forma: 6-8/10 (desgaste, irregularidades)` : ''}
- **Pontuação Total Antes: ${isFacetas ? '5.5-7.0' : '4.0-6.0'}/10**

**DEPOIS:**
- Cor: 9-10/10 (BL2, uniforme, brilhante)
${isFacetas ? `- Alinhamento: 9-10/10 (corrigido, harmonioso)
- Proporção: 9-10/10 (proporcional ao rosto)
- Forma: 9-10/10 (anatômica, natural)` : ''}
- **Pontuação Total Depois: 9.0-10.0/10**

**GANHO ESTÉTICO: ${isFacetas ? '+3.0 a +4.5' : '+3.0 a +6.0'} pontos**

═══════════════════════════════════════════════════════════════════
AVALIAÇÃO CLÍNICA
═══════════════════════════════════════════════════════════════════

1. **Problemas Identificados no ANTES:**
   - Descoloração dental (Value baixo, Chroma alto)
   ${isFacetas ? `- Desalinhamento leve a moderado
   - Proporções irregulares
   - Desgaste incisal
   - Forma dental inadequada` : '- Manchas superficiais'}

2. **Melhorias Observadas no DEPOIS:**
   - Cor uniforme BL2 (Value 9-10, Chroma 2-3)
   - Luminosidade aumentada significativamente
   - Aparência natural e harmoniosa
   ${isFacetas ? `- Alinhamento corrigido
   - Proporções adequadas ao rosto
   - Forma anatômica restaurada
   - Bordas incisais translúcidas` : '- Brilho saudável do esmalte'}

3. **Adequação do Tratamento:**
   - ${isFacetas ? 'Indicado para correção estética completa (cor + forma + alinhamento)' : 'Indicado para clareamento dental (apenas cor)'}
   - Resultado natural e proporcional ao rosto
   - Expectativa realista alcançada

4. **Contraindicações Observadas:**
   - ${isFacetas ? 'Não observadas na simulação' : 'Verificar sensibilidade prévia'}
   - ${isFacetas ? 'Estrutura dental adequada para facetas' : 'Esmalte íntegro para clareamento'}

5. **Prognóstico:**
   - Favorável (excelente resultado esperado)
   - Durabilidade: ${isFacetas ? '3-7 anos (resina composta)' : '1-3 anos (clareamento profissional)'}
   - Manutenção necessária: ${isFacetas ? 'Revisões semestrais, polimento anual' : 'Retoques a cada 12-18 meses'}

═══════════════════════════════════════════════════════════════════
OBSERVAÇÕES TÉCNICAS ADICIONAIS
═══════════════════════════════════════════════════════════════════

**Durabilidade Esperada:**
- ${isFacetas ? 'Facetas em resina: 3-7 anos (média 5 anos)' : 'Clareamento profissional: 1-3 anos (média 18 meses)'}
- Fatores: higiene, hábitos alimentares, parafunção

**Necessidade de Retoques:**
- ${isFacetas ? 'Polimento/reparo: anual' : 'Manutenção de cor: 12-18 meses'}
- ${isFacetas ? 'Substituição parcial: 5-7 anos' : 'Reforço clareador: anual'}

**Cuidados Pós-Tratamento:**
- Evitar: ${isFacetas ? 'morder objetos duros, ranger dentes' : 'alimentos pigmentantes nas primeiras 48h'}
- Higiene: escovação 3x/dia, fio dental
- Revisões: semestrais

**Riscos e Limitações:**
- ${isFacetas ? 'Fratura/descolamento (risco baixo com boa técnica)' : 'Sensibilidade transitória (comum, reversível)'}
- ${isFacetas ? 'Manchamento ao longo do tempo (controlável)' : 'Retorno gradual da cor (natural, tratável)'}
- Resultado pode variar conforme resposta biológica individual

═══════════════════════════════════════════════════════════════════
FORMATO DE RESPOSTA
═══════════════════════════════════════════════════════════════════

Retorne APENAS JSON válido (sem markdown, sem \`\`\`json):

{
  "resumo_executivo": "Resumo em 2-3 frases do caso e do resultado esperado",
  
  "avaliacao_inicial": {
    "cor_vita": "A3.5",
    "value": 6,
    "chroma": 7,
    "hue": "Yellow-Orange",
    "problemas": [
      "Descoloração dental severa",
      ${isFacetas ? '"Desalinhamento moderado dos incisivos"' : '"Manchas superficiais"'}
    ]
  },
  
  "avaliacao_final": {
    "cor_vita": "BL2",
    "value": 10,
    "chroma": 2,
    "hue": "Neutral White",
    "melhoras": [
      "Clareamento significativo (BL2)",
      ${isFacetas ? '"Alinhamento corrigido",' : ''}
      "Uniformidade de cor alcançada"
    ]
  },
  
  "pontuacao_estetica": {
    "antes": 6.0,
    "depois": 9.5,
    "ganho": 3.5
  },
  
  "avaliacao_clinica": {
    "adequado": true,
    "contraindicacoes": "Nenhuma observada na simulação",
    "prognostico": "Favorável - excelente resultado esperado"
  },
  
  "observacoes_tecnicas": {
    "durabilidade": "${isFacetas ? '3-7 anos (resina composta)' : '1-3 anos (clareamento profissional)'}",
    "retoques": "${isFacetas ? 'Polimento anual, substituição parcial em 5-7 anos' : 'Manutenção de cor a cada 12-18 meses'}",
    "cuidados": "${isFacetas ? 'Evitar morder objetos duros, higiene rigorosa' : 'Evitar alimentos pigmentantes 48h pós-tratamento'}"
  },
  
  "dentes_analisados": ["11", "12", "21", "22"${isFacetas ? ', "13", "23"' : ''}],
  
  "tratamentos_recomendados": [
    "${isFacetas ? 'Facetas em resina composta' : 'Clareamento dental profissional'}",
    "Consulta de planejamento",
    ${isFacetas ? '"Ajuste oclusal pós-instalação"' : '"Tratamento dessensibilizante (se necessário)"'}
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional, sem markdown, sem \`\`\`json.`;
}

/**
 * PROMPT DE RELATÓRIO TÉCNICO (Markdown)
 * 
 * Gera relatório profissional completo para documentação clínica
 */
export function getReportPrompt(analysisData: any, treatmentType: 'facetas' | 'clareamento'): string {
  const isFacetas = treatmentType === 'facetas';
  
  return `Você é um dentista especialista escrevendo um relatório técnico profissional.

DADOS DA ANÁLISE:
\`\`\`json
${JSON.stringify(analysisData, null, 2)}
\`\`\`

TAREFA:
Gere um relatório técnico completo em Markdown (~1500 palavras) com estrutura profissional.

═══════════════════════════════════════════════════════════════════
ESTRUTURA DO RELATÓRIO
═══════════════════════════════════════════════════════════════════

# Relatório Técnico de ${isFacetas ? 'Facetas Dentárias' : 'Clareamento Dental'}

## 1. Resumo Executivo
[2-3 parágrafos sobre o caso, indicação clínica e resultado esperado]

## 2. Análise da Situação Inicial

### 2.1 Avaliação Colorimétrica
| Parâmetro | Valor Inicial | Interpretação |
|-----------|---------------|---------------|
| Cor VITA | ${analysisData.avaliacao_inicial?.cor_vita || 'A3.5'} | Amarelado/escurecido |
| Value (Luminosidade) | ${analysisData.avaliacao_inicial?.value || 6}/10 | Baixo |
| Chroma (Saturação) | ${analysisData.avaliacao_inicial?.chroma || 7}/10 | Alto (amarelado) |
| Hue (Matiz) | ${analysisData.avaliacao_inicial?.hue || 'Yellow-Orange'} | Amarelo-alaranjado |

### 2.2 Problemas Identificados
[Liste problemas detalhadamente usando os dados de \`avaliacao_inicial.problemas\`]

${isFacetas ? `### 2.3 Avaliação Estrutural
- **Alinhamento:** [Descreva]
- **Proporção:** [Descreva]
- **Forma:** [Descreva]
- **Integridade:** [Descreva]` : ''}

### ${isFacetas ? '2.4' : '2.3'} Pontuação Estética Inicial
**Pontuação Total: ${analysisData.pontuacao_estetica?.antes || 6.0}/10**
[Justifique a pontuação]

## 3. Resultado da Simulação

### 3.1 Transformação Colorimétrica
| Parâmetro | Antes | Depois | Ganho |
|-----------|-------|--------|-------|
| Cor VITA | ${analysisData.avaliacao_inicial?.cor_vita || 'A3.5'} | ${analysisData.avaliacao_final?.cor_vita || 'BL2'} | +${Math.abs((analysisData.avaliacao_final?.value || 10) - (analysisData.avaliacao_inicial?.value || 6))} níveis |
| Value | ${analysisData.avaliacao_inicial?.value || 6}/10 | ${analysisData.avaliacao_final?.value || 10}/10 | +${(analysisData.avaliacao_final?.value || 10) - (analysisData.avaliacao_inicial?.value || 6)} |
| Chroma | ${analysisData.avaliacao_inicial?.chroma || 7}/10 | ${analysisData.avaliacao_final?.chroma || 2}/10 | -${(analysisData.avaliacao_inicial?.chroma || 7) - (analysisData.avaliacao_final?.chroma || 2)} (dessaturação) |

### 3.2 Melhorias Observadas
[Liste melhorias usando \`avaliacao_final.melhoras\`]

### 3.3 Pontuação Estética Final
**Pontuação Total: ${analysisData.pontuacao_estetica?.depois || 9.5}/10**
**Ganho Estético: +${analysisData.pontuacao_estetica?.ganho || 3.5} pontos**

## 4. Protocolo de Tratamento Proposto

### 4.1 Etapas do Tratamento
${isFacetas ? `1. **Consulta de Planejamento** (1h)
   - Fotografias iniciais
   - Moldagem/escaneamento digital
   - Enceramento diagnóstico/mock-up
   
2. **Preparo Dental** (2-3h)
   - Preparo minimamente invasivo
   - Moldagem de precisão
   - Provisórios estéticos
   
3. **Instalação das Facetas** (2-3h)
   - Teste das facetas
   - Cimentação adesiva
   - Ajuste oclusal
   - Polimento final
   
4. **Acompanhamento** (6 meses)
   - Revisão de adaptação
   - Avaliação de higiene
   - Polimento de manutenção` : `1. **Avaliação Inicial** (30min)
   - Anamnese completa
   - Exame clínico
   - Fotografia diagnóstica
   - Teste de cor inicial
   
2. **Preparo Pré-Clareamento** (1h)
   - Profilaxia completa
   - Orientações de sensibilidade
   - Moldagem para moldeira (se clareamento caseiro)
   
3. **Sessões de Clareamento** (3-4 sessões de 1h)
   - Aplicação de gel clareador H₂O₂ 35-40%
   - Ativação por luz LED (se aplicável)
   - Controle de sensibilidade
   
4. **Finalização e Manutenção**
   - Fotografia final
   - Orientações de cuidados
   - Agendamento de revisão (6 meses)`}

### 4.2 Materiais Necessários
[Liste materiais específicos para ${isFacetas ? 'facetas' : 'clareamento'}]

### 4.3 Tempo Total Estimado
**${isFacetas ? '3-4 consultas ao longo de 2-3 semanas' : '4-5 consultas ao longo de 2-3 semanas'}**

## 5. Prognóstico e Durabilidade

### 5.1 Prognóstico Clínico
${analysisData.avaliacao_clinica?.prognostico || 'Favorável - excelente resultado esperado'}

### 5.2 Durabilidade Esperada
${analysisData.observacoes_tecnicas?.durabilidade || (isFacetas ? '3-7 anos (média 5 anos)' : '1-3 anos (média 18 meses)')}

**Fatores que Afetam a Durabilidade:**
- Higiene bucal do paciente
- Hábitos alimentares
- Parafunção (bruxismo)
- Manutenção periódica

### 5.3 Necessidade de Retoques
${analysisData.observacoes_tecnicas?.retoques || (isFacetas ? 'Polimento anual recomendado' : 'Reforço clareador a cada 12-18 meses')}

## 6. Cuidados Pós-Tratamento

### 6.1 Primeiras 48 Horas
${isFacetas ? `- Evitar alimentos muito duros
- Evitar bebidas muito quentes
- Mastigar com cuidado
- Não morder objetos (canetas, unhas)` : `- **CRÍTICO:** Evitar alimentos/bebidas pigmentantes
  - Café, chá, vinho tinto, refrigerantes
  - Molhos escuros, beterraba, açaí
- Evitar fumar/cigarro eletrônico
- Usar escova macia e pasta dessensibilizante`}

### 6.2 Manutenção a Longo Prazo
- Escovação 3x/dia com escova macia
- Fio dental diário
- Revisões semestrais obrigatórias
${isFacetas ? '- Uso de placa oclusal noturna (se bruxismo)' : '- Reforço clareador anual (se desejado)'}

### 6.3 Sinais de Alerta
${isFacetas ? `- Descolamento parcial
- Fratura/trinca
- Manchamento excessivo
- Desconforto ao mastigar` : `- Sensibilidade persistente (>7 dias)
- Manchas brancas nos dentes
- Dor aguda ao frio/quente
- Retração gengival`}

## 7. Riscos e Limitações

### 7.1 Riscos do Procedimento
${isFacetas ? `- **Descolamento:** <5% (raro com boa técnica)
- **Fratura:** <10% em 5 anos
- **Manchamento:** Controlável com higiene
- **Sensibilidade:** Transitória em ~20% dos casos` : `- **Sensibilidade:** Comum (60-70%), transitória
- **Retorno da cor:** Gradual ao longo de 1-3 anos
- **Manchas brancas:** Raras (<5%)
- **Irritação gengival:** Leve, temporária`}

### 7.2 Limitações da Técnica
${isFacetas ? `- Durabilidade limitada (3-7 anos)
- Necessidade de retoques periódicos
- Não adequado para restaurações grandes
- Requer habilidade técnica do profissional` : `- Resultado limitado por genética dental
- Não clareia restaurações (apenas dentes naturais)
- Efetividade reduzida em manchas intrínsecas
- Requer múltiplas sessões`}

### 7.3 Contraindicações
${analysisData.avaliacao_clinica?.contraindicacoes || 'Nenhuma observada na simulação'}

## 8. Considerações Finais

[2-3 parágrafos resumindo:]
- Indicação do tratamento para este caso específico
- Expectativa realista de resultado
- Importância da manutenção
- Recomendação profissional

---

**Data do Relatório:** [DATA_ATUAL]
**Profissional Responsável:** Dr(a). [NOME_DENTISTA]
**CRO:** [NÚMERO_CRO]

═══════════════════════════════════════════════════════════════════

IMPORTANTE: 
- Retorne APENAS Markdown puro
- Use os dados fornecidos em \`analysisData\`
- Seja técnico mas compreensível
- Inclua tabelas e listas para clareza
- ~1500 palavras totais`;
}

/**
 * PROMPT DE ORÇAMENTO (Markdown)
 * 
 * Gera orçamento detalhado com preços regionalizados
 */
export function getBudgetPrompt(
  analysisData: any, 
  treatmentType: 'facetas' | 'clareamento',
  regiao: string = 'Sudeste'
): string {
  const isFacetas = treatmentType === 'facetas';
  
  // Preços base por região (Brasil)
  const precosPorRegiao: Record<string, { faceta: number, clareamento: number, consulta: number }> = {
    'Sul': { faceta: 700, clareamento: 1400, consulta: 180 },
    'Sudeste': { faceta: 650, clareamento: 1300, consulta: 150 },
    'Centro-Oeste': { faceta: 600, clareamento: 1200, consulta: 140 },
    'Nordeste': { faceta: 550, clareamento: 1100, consulta: 130 },
    'Norte': { faceta: 500, clareamento: 1000, consulta: 120 }
  };
  
  const precos = precosPorRegiao[regiao] || precosPorRegiao['Sudeste'];
  
  return `Você é um coordenador administrativo de clínica odontológica gerando um orçamento detalhado.

DADOS DA ANÁLISE:
\`\`\`json
${JSON.stringify(analysisData, null, 2)}
\`\`\`

REGIÃO: ${regiao}
PREÇOS BASE:
- Faceta unitária: R$ ${precos.faceta.toFixed(2)}
- Clareamento: R$ ${precos.clareamento.toFixed(2)}
- Consulta: R$ ${precos.consulta.toFixed(2)}

TAREFA:
Gere um orçamento profissional em Markdown com cálculos precisos.

═══════════════════════════════════════════════════════════════════
ESTRUTURA DO ORÇAMENTO
═══════════════════════════════════════════════════════════════════

# Orçamento de ${isFacetas ? 'Facetas Dentárias' : 'Clareamento Dental'}

**Data:** [DATA_ATUAL]
**Validade:** 30 dias
**Paciente:** [NOME_PACIENTE]

---

## 1. Descrição dos Serviços

${isFacetas ? `### 1.1 Facetas em Resina Composta
**Dentes a serem tratados:** ${analysisData.dentes_analisados?.join(', ') || '11, 12, 21, 22'}
**Quantidade:** ${analysisData.dentes_analisados?.length || 4} facetas

**Inclui:**
- Planejamento digital (mock-up)
- Preparo dental minimamente invasivo
- Moldagem/escaneamento de precisão
- Confecção das facetas em resina de alta estética
- Cimentação adesiva
- Ajuste oclusal e polimento final
- 1 revisão inclusa (30 dias)

**Cor final:** ${analysisData.avaliacao_final?.cor_vita || 'BL2'} (branco natural)
**Durabilidade:** ${analysisData.observacoes_tecnicas?.durabilidade || '3-7 anos'}

**Valor unitário:** R$ ${precos.faceta.toFixed(2)}
**Quantidade:** ${analysisData.dentes_analisados?.length || 4}
**Subtotal:** R$ ${(precos.faceta * (analysisData.dentes_analisados?.length || 4)).toFixed(2)}` : `### 1.1 Clareamento Dental Profissional
**Técnica:** Clareamento em consultório + moldeira caseira
**Sessões:** 3-4 sessões de 1 hora

**Inclui:**
- Avaliação inicial e fotografias
- Profilaxia completa
- 3-4 sessões de clareamento em consultório (H₂O₂ 35%)
- Kit caseiro de manutenção (gel + moldeira)
- Tratamento dessensibilizante
- 1 revisão inclusa (6 meses)

**Cor final:** ${analysisData.avaliacao_final?.cor_vita || 'BL2'} (branco natural)
**Durabilidade:** ${analysisData.observacoes_tecnicas?.durabilidade || '1-3 anos'}

**Valor total:** R$ ${precos.clareamento.toFixed(2)}`}

### 1.2 Consulta de Planejamento
**Inclui:**
- Anamnese completa
- Exame clínico detalhado
- Fotografias diagnósticas
- Planejamento do tratamento
- Orientações sobre procedimento

**Valor:** R$ ${precos.consulta.toFixed(2)}

${isFacetas ? `### 1.3 Clareamento Complementar (Opcional)
Recomendado para uniformizar cor de dentes adjacentes

**Valor:** R$ ${(precos.clareamento * 0.6).toFixed(2)} (desconto de 40%)` : ''}

---

## 2. Resumo Financeiro

| Item | Qtd | Valor Unit. | Subtotal |
|------|-----|-------------|----------|
| ${isFacetas ? 'Facetas em Resina Composta' : 'Clareamento Dental Profissional'} | ${isFacetas ? (analysisData.dentes_analisados?.length || 4) : '1'} | R$ ${isFacetas ? precos.faceta.toFixed(2) : precos.clareamento.toFixed(2)} | R$ ${isFacetas ? (precos.faceta * (analysisData.dentes_analisados?.length || 4)).toFixed(2) : precos.clareamento.toFixed(2)} |
| Consulta de Planejamento | 1 | R$ ${precos.consulta.toFixed(2)} | R$ ${precos.consulta.toFixed(2)} |
${isFacetas ? `| Clareamento Complementar (Opc.) | 1 | R$ ${(precos.clareamento * 0.6).toFixed(2)} | R$ ${(precos.clareamento * 0.6).toFixed(2)} |` : ''}

**Subtotal:** R$ ${isFacetas 
  ? ((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta + (precos.clareamento * 0.6)).toFixed(2)
  : (precos.clareamento + precos.consulta).toFixed(2)}

**Desconto à vista (10%):** -R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) * 0.10).toFixed(2)
  : ((precos.clareamento + precos.consulta) * 0.10).toFixed(2)}

**VALOR TOTAL À VISTA:** R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) * 0.90).toFixed(2)
  : ((precos.clareamento + precos.consulta) * 0.90).toFixed(2)}

---

## 3. Formas de Pagamento

### 💰 Opção 1: À Vista (Desconto de 10%)
**Valor:** R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) * 0.90).toFixed(2)
  : ((precos.clareamento + precos.consulta) * 0.90).toFixed(2)}

Formas de pagamento: PIX, Dinheiro, TED/DOC

### 💳 Opção 2: Parcelado em até ${isFacetas ? '6x' : '4x'} sem juros
**Valor:** R$ ${isFacetas
  ? ((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta).toFixed(2)
  : (precos.clareamento + precos.consulta).toFixed(2)}

**Parcelas:**
- ${isFacetas ? '3x' : '2x'}: R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) / 3).toFixed(2)
  : ((precos.clareamento + precos.consulta) / 2).toFixed(2)}/mês
- ${isFacetas ? '6x' : '4x'}: R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) / 6).toFixed(2)
  : ((precos.clareamento + precos.consulta) / 4).toFixed(2)}/mês

Cartão de crédito (Visa, Master, Elo, American Express)

### 📅 Opção 3: Parcelado em até ${isFacetas ? '10x' : '6x'} (com juros)
Consulte-nos para simular parcelas com juros.

---

## 4. Investimento em Longo Prazo

### 4.1 Custo por Ano
**Investimento inicial:** R$ ${isFacetas
  ? (((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) * 0.90).toFixed(2)
  : ((precos.clareamento + precos.consulta) * 0.90).toFixed(2)}
**Durabilidade:** ${isFacetas ? '5 anos (média)' : '2 anos (média)'}
**Custo anual:** R$ ${isFacetas
  ? ((((precos.faceta * (analysisData.dentes_analisados?.length || 4)) + precos.consulta) * 0.90) / 5).toFixed(2)
  : ((((precos.clareamento + precos.consulta) * 0.90) / 2)).toFixed(2)}

### 4.2 Manutenção Futura
${isFacetas ? `- **Polimento anual:** R$ ${(precos.consulta * 0.8).toFixed(2)}
- **Reparo leve:** R$ ${(precos.faceta * 0.3).toFixed(2)} (se necessário)
- **Substituição parcial (após 5 anos):** R$ ${(precos.faceta * 0.7).toFixed(2)}/dente` : `- **Reforço clareador (anual):** R$ ${(precos.clareamento * 0.4).toFixed(2)}
- **Kit caseiro de manutenção:** R$ ${(precos.clareamento * 0.15).toFixed(2)}`}

---

## 5. Garantia e Compromisso

### 5.1 Garantia
${isFacetas ? `- **Contra defeitos de fabricação:** 12 meses
- **Contra descolamento:** 6 meses (se seguir orientações)
- **Ajustes necessários:** Inclusos nos primeiros 30 dias` : `- **Resultado mínimo garantido:** Clareamento de 2-3 tons
- **Refazimento gratuito:** Se resultado abaixo do esperado
- **Acompanhamento:** Incluído nos primeiros 6 meses`}

### 5.2 Não Cobertos pela Garantia
- Danos causados por trauma/acidente
- Não seguimento das orientações pós-tratamento
- Desgaste natural por uso inadequado

---

## 6. Informações Importantes

### ⏱️ Tempo de Tratamento
**${isFacetas ? '3-4 consultas ao longo de 2-3 semanas' : '4-5 consultas ao longo de 2-3 semanas'}**

### 📋 Incluído no Tratamento
✓ Todas as consultas necessárias
✓ Materiais de primeira linha
✓ Protocolo de cuidados pós-tratamento
✓ 1 revisão de acompanhamento inclusa
✓ Fotografia antes e depois

### ❌ Não Incluído
✗ Tratamentos prévios (cáries, canal, etc.)
✗ Consultas de emergência fora do horário
✗ ${isFacetas ? 'Placa miorelaxante (se bruxismo)' : 'Tratamentos complementares (restaurações, etc.)'}

---

## 7. Próximos Passos

1. **Confirmar interesse** e agendar consulta de planejamento
2. **Avaliação clínica presencial** para confirmar viabilidade
3. **Assinatura do contrato** e início do tratamento
4. **Acompanhamento pós-tratamento** para garantir resultado

---

**Validade deste orçamento:** 30 dias a partir da data de emissão

**Dúvidas?** Entre em contato conosco!
📞 [TELEFONE]
📧 [EMAIL]
📍 [ENDEREÇO]

═══════════════════════════════════════════════════════════════════

IMPORTANTE:
- Use os dados de \`analysisData\` para personalizar
- Calcule preços corretamente conforme região
- Seja transparente e detalhado
- Inclua todas as informações financeiras`;
}
