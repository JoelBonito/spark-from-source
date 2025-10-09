/**
 * Gera texto completo do Relatório Técnico a partir do JSON estruturado
 * Substitui a geração de texto livre pela IA
 */

export function generateTextReportFromJSON(json: any): string {
  let report = '';
  
  // Seção 1: Harmonia Facial
  report += `ANÁLISE CLÍNICA INICIAL\n\n`;
  report += `HARMONIA FACIAL:\n`;
  report += `- Tom de pele: ${json.analise_clinica?.tom_pele || 'não especificado'}\n`;
  report += `- Cor dos olhos: ${json.analise_clinica?.cor_olhos || 'não especificado'}\n`;
  report += `- Cor recomendada: ${json.recomendacao_tratamento?.cor_recomendada || 'BL3'}\n\n`;
  
  // Seção 2: Análise por Dente
  if (json.analise_clinica?.analise_por_dente) {
    report += `AVALIAÇÃO POR DENTE:\n\n`;
    const dentesMap: Record<string, string> = {
      '11': 'Incisivo Central Superior Direito',
      '21': 'Incisivo Central Superior Esquerdo',
      '12': 'Incisivo Lateral Superior Direito',
      '22': 'Incisivo Lateral Superior Esquerdo',
      '13': 'Canino Superior Direito',
      '23': 'Canino Superior Esquerdo'
    };
    
    Object.keys(json.analise_clinica.analise_por_dente).forEach(dente => {
      const analise = json.analise_clinica.analise_por_dente[dente];
      const nomeDente = dentesMap[dente] || `Dente ${dente}`;
      report += `${nomeDente} (${dente}):\n`;
      report += `  - Cor: ${analise.cor || 'não especificado'}\n`;
      report += `  - Forma: ${analise.forma || 'não especificado'}\n`;
      report += `  - Posição: ${analise.posicao || 'não especificado'}\n`;
      if (analise.desgaste) {
        report += `  - Desgaste: ${analise.desgaste}\n`;
      }
      report += `\n`;
    });
  }
  
  // Seção 3: Avaliação Geral
  if (json.analise_clinica?.avaliacao_geral) {
    report += `AVALIAÇÃO GERAL:\n`;
    const geral = json.analise_clinica.avaliacao_geral;
    report += `- Alinhamento: ${geral.alinhamento || 'não especificado'}\n`;
    report += `- Proporção: ${geral.proporcao || 'não especificado'}\n`;
    report += `- Forma: ${geral.forma || 'não especificado'}\n`;
    report += `- Cor: ${geral.cor || 'não especificado'}\n`;
    report += `- Linha gengival: ${geral.linha_gengival || 'não especificado'}\n\n`;
  }
  
  // Seção 4: Indicação do Tratamento
  report += `INDICAÇÃO DO TRATAMENTO\n\n`;
  const tipo = json.recomendacao_tratamento?.tipo || 'nenhum';
  const justificativa = json.recomendacao_tratamento?.justificativa || 'Análise em andamento';
  
  report += `${justificativa}\n\n`;
  
  // Seção 5: Dentes a Serem Tratados
  report += `DENTES A SEREM TRATADOS\n\n`;
  
  if (tipo === 'facetas') {
    const dentes = json.recomendacao_tratamento?.dentes_fdi_tratados || [];
    const quantidade = json.recomendacao_tratamento?.quantidade_facetas || dentes.length;
    
    report += `Os dentes que receberão facetas de cerâmica são:\n`;
    dentes.forEach((dente: string) => {
      const nomeDente = {
        '11': 'Incisivo central superior direito',
        '21': 'Incisivo central superior esquerdo',
        '12': 'Incisivo lateral superior direito',
        '22': 'Incisivo lateral superior esquerdo',
        '13': 'Canino superior direito',
        '23': 'Canino superior esquerdo'
      }[dente] || `Dente ${dente}`;
      report += `- ${nomeDente} (${dente})\n`;
    });
    report += `\nTotal: ${quantidade} facetas de cerâmica\n\n`;
  } else if (tipo === 'clareamento') {
    report += `Não serão aplicadas facetas. Todos os dentes apresentam alinhamento, proporção e forma adequados.\n`;
    report += `O tratamento será apenas clareamento dental.\n\n`;
  } else {
    report += `Não há necessidade de tratamento estrutural.\n`;
    report += `O sorriso apresenta características naturalmente harmoniosas.\n\n`;
  }
  
  // Seção 6: Procedimentos Complementares
  if (json.procedimentos_complementares?.gengivoplastia_recomendada) {
    report += `PROCEDIMENTO COMPLEMENTAR RECOMENDADO:\n`;
    report += `- Gengivoplastia: ${json.procedimentos_complementares.gengivoplastia_justificativa}\n\n`;
  }
  
  // Seção 7: Especificações Técnicas
  if (json.especificacoes_tecnicas) {
    report += `ESPECIFICAÇÕES TÉCNICAS\n\n`;
    const specs = json.especificacoes_tecnicas;
    if (specs.material) report += `Material: ${specs.material}\n`;
    if (specs.forma) report += `Forma: ${specs.forma}\n`;
    if (specs.alinhamento) report += `Alinhamento: ${specs.alinhamento}\n`;
    if (specs.superficie) report += `Superfície: ${specs.superficie}\n`;
    report += `\n`;
  }
  
  // Seção 8: Planejamento do Tratamento
  if (json.planejamento?.sessoes && json.planejamento.sessoes.length > 0) {
    report += `PLANEJAMENTO DO TRATAMENTO\n\n`;
    json.planejamento.sessoes.forEach((sessao: any) => {
      report += `Sessão ${sessao.numero}: ${sessao.descricao}\n`;
      if (sessao.duracao) report += `Duração estimada: ${sessao.duracao}\n`;
      report += `\n`;
    });
  }
  
  // Seção 9: Cuidados Pós-Procedimento
  if (json.cuidados_pos_procedimento && json.cuidados_pos_procedimento.length > 0) {
    report += `CUIDADOS PÓS-PROCEDIMENTO\n\n`;
    json.cuidados_pos_procedimento.forEach((cuidado: string) => {
      report += `- ${cuidado}\n`;
    });
    report += `\n`;
  }
  
  // Seção 10: Prognóstico
  if (json.prognostico) {
    report += `PROGNÓSTICO E DURABILIDADE\n\n`;
    report += `${json.prognostico}\n\n`;
  }
  
  // Seção 11: Contraindicações
  if (json.contraindicacoes && json.contraindicacoes.length > 0) {
    report += `CONTRAINDICAÇÕES E CONSIDERAÇÕES\n\n`;
    json.contraindicacoes.forEach((contra: string) => {
      report += `- ${contra}\n`;
    });
    report += `\n`;
  }
  
  // Seção 12: Observações Profissionais
  if (json.observacoes_profissionais) {
    report += `OBSERVAÇÕES PROFISSIONAIS\n\n`;
    report += `${json.observacoes_profissionais}\n`;
  }
  
  return report;
}
