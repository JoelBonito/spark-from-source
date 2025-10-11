export interface DenteAnalise {
  dente: string;
  nome: string;
  condicao_atual: string;
  alteracoes_cromaticas: string;
  morfologia: string;
  integridade_estrutural: string;
  indicacao_faceta: 'sim' | 'não';
  justificativa: string;
}

export interface RelatorioTecnico {
  avaliacao_por_dente: DenteAnalise[];
  diagnostico: {
    complexidade: 'baixa' | 'média' | 'alta';
    justificativa_complexidade: string;
    fatores_considerados: string[];
  };
  planejamento: {
    objetivo_tratamento: string;
    protocolo_clinico: {
      fase_1: string;
      fase_2: string;
      fase_3: string;
      fase_4: string;
      fase_5: string;
    };
    materiais: {
      tipo_faceta: string;
      sistema_adesivo: string;
      justificativa: string;
    };
  };
  analise_estetica: {
    proporcao_dentaria: string;
    simetria: string;
    harmonizacao_facial: string;
  };
  recomendacoes_clinicas: string[];
  cronograma: {
    numero_sessoes: number;
    duracao_semanas: string;
    detalhamento: string;
  };
  alternativa_conservadora: {
    descricao: string;
    valor: number;
    quando_indicar: string;
  };
  prognostico: string;
}

export interface AnalysisData {
  analise_resumo: {
    facetas_necessarias: number;
    dentes_identificados: string[];
    manchas: 'leve' | 'moderada' | 'severa';
    complexidade: 'baixa' | 'média' | 'alta';
    confianca: number;
  };
  valores: {
    facetas: number;
    clareamento: number;
    total: number;
  };
  relatorio_tecnico: RelatorioTecnico;
}

export interface AnalysisResult {
  analysis: AnalysisData;
  needsClareamento: boolean;
}

// NOVA ESTRUTURA JSON - Sistema de Pontuação Clínica

export interface AnaliseJSON {
  analise: {
    tipo_tratamento: 'clareamento' | 'facetas' | 'facetas_clareamento';
    tom_pele: 'clara' | 'média' | 'morena' | 'escura';
    cor_olhos: 'claros' | 'médios' | 'escuros';
    
    estado_geral: {
      alinhamento: 'normal' | 'leve' | 'severo';
      alinhamento_pontos: 0 | 1 | 3;
      alinhamento_detalhes: string;
      
      proporcao: 'normal' | 'leve' | 'severo';
      proporcao_pontos: 0 | 1 | 3;
      proporcao_detalhes: string;
      
      forma: 'normal' | 'leve' | 'severo';
      forma_pontos: 0 | 1 | 3;
      forma_detalhes: string;
      
      integridade: 'normal' | 'leve' | 'severo';
      integridade_pontos: 0 | 1 | 3;
      integridade_detalhes: string;
      
      cor: 'normal' | 'leve' | 'severo';
      cor_pontos: 0 | 1 | 3;
      cor_detalhes: string;
      
      linha_gengival: 'normal' | 'leve' | 'severo';
      linha_gengival_detalhes: string;
      
      pontuacao_total: number;
      interpretacao: string;
    };
    
    decisao_clinica: {
      conducta: 'clareamento' | 'facetas' | 'facetas_clareamento';
      justificativa_tecnica: string;
      quantidade_facetas: 0 | 2 | 4 | 6;
      dentes_tratados: string[];
      dentes_justificativa: string | null;
    };
    
    procedimentos_recomendados: string[];
    procedimentos_opcionais: string[];
    cor_recomendada: 'BL2' | 'BL3';
    
    detalhamento_por_dente: {
      [dente: string]: {
        problemas: string[];
        necessita_faceta: boolean;
        justificativa: string;
      };
    };
    
    orcamento: {
      tratamento_principal: string;
      valor_base_tipo: 'clareamento' | 'facetas_2' | 'facetas_4' | 'facetas_6';
      procedimentos_inclusos: string[];
      procedimentos_opcionais: string[];
      observacoes: string;
    };
  };
}
