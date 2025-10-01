import React from 'react';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TechnicalReportPreviewProps {
  reportContent?: string;
  reportPdfUrl?: string;
  generating: boolean;
  onGenerate: () => void;
}

export const TechnicalReportPreview: React.FC<TechnicalReportPreviewProps> = ({
  reportContent,
  reportPdfUrl,
  generating,
  onGenerate
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold">Relatório Técnico</h3>
      </div>

      {!reportContent && !generating && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">
            Gere um relatório técnico profissional para este procedimento
          </p>
          <Button onClick={onGenerate} size="lg">
            Gerar Relatório Técnico
          </Button>
        </div>
      )}

      {generating && (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <p className="font-semibold mb-2">
            Gerando relatório técnico...
          </p>
          <p className="text-sm text-muted-foreground">
            A IA está analisando a imagem e criando um relatório profissional
          </p>
        </div>
      )}

      {reportContent && !generating && (
        <div>
          <div className="bg-muted rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {reportContent}
            </pre>
          </div>

          <div className="flex gap-3">
            {reportPdfUrl && (
              <>
                <Button
                  asChild
                  className="flex-1"
                >
                  <a
                    href={reportPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Visualizar PDF
                  </a>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                >
                  <a
                    href={reportPdfUrl}
                    download
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download
                  </a>
                </Button>
              </>
            )}
            
            <Button
              onClick={onGenerate}
              variant="outline"
            >
              Gerar Novamente
            </Button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Este relatório é baseado em análise de imagem e tem caráter orientativo. 
              Avaliação clínica presencial é obrigatória antes de qualquer procedimento.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
