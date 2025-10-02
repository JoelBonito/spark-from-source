import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AnalysisData } from "@/types/simulation";

interface TechnicalReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalysisData;
  patientName: string;
  onDownloadPDF: () => void;
}

export function TechnicalReportDialog({ 
  open, 
  onOpenChange, 
  data, 
  patientName,
  onDownloadPDF 
}: TechnicalReportDialogProps) {
  const { relatorio_tecnico, analise_resumo, valores } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Técnico Completo</DialogTitle>
          <DialogDescription>
            Análise detalhada do caso clínico - {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Executivo */}
          <section className="border-b pb-4">
            <h3 className="font-semibold text-lg mb-3">Resumo Executivo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Facetas Necessárias:</span>
                <p className="font-medium">{analise_resumo.facetas_necessarias}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Complexidade:</span>
                <p className="font-medium capitalize">{analise_resumo.complexidade}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dentes:</span>
                <p className="font-medium">{analise_resumo.dentes_identificados.join(', ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Investimento:</span>
                <p className="font-medium text-green-600">
                  R$ {valores.total.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </section>

          {/* Avaliação Por Dente */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Avaliação Dental Detalhada</h3>
            <div className="space-y-4">
              {relatorio_tecnico.avaliacao_por_dente.map((dente) => (
                <div key={dente.dente} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">
                      Dente {dente.dente} - {dente.nome}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      dente.indicacao_faceta === 'sim' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dente.indicacao_faceta === 'sim' ? 'Faceta Indicada' : 'Não Necessário'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Condição:</span> {dente.condicao_atual}</p>
                    <p><span className="font-medium">Cromática:</span> {dente.alteracoes_cromaticas}</p>
                    <p><span className="font-medium">Morfologia:</span> {dente.morfologia}</p>
                    <p><span className="font-medium">Integridade:</span> {dente.integridade_estrutural}</p>
                    {dente.indicacao_faceta === 'sim' && (
                      <p className="text-muted-foreground italic">{dente.justificativa}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Diagnóstico */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Diagnóstico</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Complexidade:</span>
                <span className="ml-2 capitalize">{relatorio_tecnico.diagnostico.complexidade}</span>
              </div>
              <p className="text-muted-foreground">
                {relatorio_tecnico.diagnostico.justificativa_complexidade}
              </p>
              <div>
                <span className="font-medium">Fatores Considerados:</span>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {relatorio_tecnico.diagnostico.fatores_considerados.map((fator, i) => (
                    <li key={i}>{fator}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Planejamento */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Planejamento Proposto</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {relatorio_tecnico.planejamento.objetivo_tratamento}
              </p>
              
              <div>
                <h4 className="font-medium mb-2">Protocolo Clínico:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>{relatorio_tecnico.planejamento.protocolo_clinico.fase_1}</li>
                  <li>{relatorio_tecnico.planejamento.protocolo_clinico.fase_2}</li>
                  <li>{relatorio_tecnico.planejamento.protocolo_clinico.fase_3}</li>
                  <li>{relatorio_tecnico.planejamento.protocolo_clinico.fase_4}</li>
                  <li>{relatorio_tecnico.planejamento.protocolo_clinico.fase_5}</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Materiais Recomendados:</h4>
                <p><span className="font-medium">Facetas:</span> {relatorio_tecnico.planejamento.materiais.tipo_faceta}</p>
                <p><span className="font-medium">Adesivo:</span> {relatorio_tecnico.planejamento.materiais.sistema_adesivo}</p>
                <p className="text-muted-foreground italic mt-1">
                  {relatorio_tecnico.planejamento.materiais.justificativa}
                </p>
              </div>
            </div>
          </section>

          {/* Análise Estética */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Análise Estética</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Proporção Dentária:</span> {relatorio_tecnico.analise_estetica.proporcao_dentaria}</p>
              <p><span className="font-medium">Simetria:</span> {relatorio_tecnico.analise_estetica.simetria}</p>
              <p><span className="font-medium">Harmonização Facial:</span> {relatorio_tecnico.analise_estetica.harmonizacao_facial}</p>
            </div>
          </section>

          {/* Recomendações Clínicas */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Recomendações Clínicas</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {relatorio_tecnico.recomendacoes_clinicas.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </section>

          {/* Cronograma */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Cronograma</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Sessões:</span> {relatorio_tecnico.cronograma.numero_sessoes}</p>
              <p><span className="font-medium">Duração:</span> {relatorio_tecnico.cronograma.duracao_semanas} semanas</p>
              <p className="text-muted-foreground">{relatorio_tecnico.cronograma.detalhamento}</p>
            </div>
          </section>

          {/* Alternativa Conservadora */}
          {relatorio_tecnico.alternativa_conservadora && (
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Alternativa Conservadora</h3>
              <p className="text-sm mb-2">{relatorio_tecnico.alternativa_conservadora.descricao}</p>
              <p className="text-sm">
                <span className="font-medium">Investimento:</span> R$ {relatorio_tecnico.alternativa_conservadora.valor}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {relatorio_tecnico.alternativa_conservadora.quando_indicar}
              </p>
            </section>
          )}

          {/* Prognóstico */}
          <section className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Prognóstico</h3>
                <p className="text-2xl font-bold text-green-600">
                  {relatorio_tecnico.prognostico}
                </p>
              </div>
              <Button onClick={onDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
