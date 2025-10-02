import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AnalysisData } from "@/types/simulation";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalysisData;
  patientName: string;
  onDownloadPDF: () => void;
}

export function BudgetDialog({ 
  open, 
  onOpenChange, 
  data, 
  patientName,
  onDownloadPDF 
}: BudgetDialogProps) {
  const { valores, analise_resumo } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Orçamento - {patientName}</DialogTitle>
          <DialogDescription>
            Investimento necessário para o tratamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Tratamento Proposto</p>
            <p className="text-lg font-semibold">
              {analise_resumo.facetas_necessarias} Facetas de Porcelana + Clareamento
            </p>
          </div>

          {/* Valores */}
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Valor</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b">
                <td className="py-3">
                  Facetas de Porcelana ({analise_resumo.facetas_necessarias}x)
                </td>
                <td className="text-right font-medium">
                  R$ {valores.facetas.toLocaleString('pt-BR')}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Clareamento Dental Prévio</td>
                <td className="text-right font-medium">
                  R$ {valores.clareamento.toLocaleString('pt-BR')}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Moldagem Digital</td>
                <td className="text-right text-muted-foreground">Incluído</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Mock-up</td>
                <td className="text-right text-muted-foreground">Incluído</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="py-4 text-lg font-semibold">TOTAL</td>
                <td className="text-right text-xl font-bold text-green-600">
                  R$ {valores.total.toLocaleString('pt-BR')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Nota */}
          <p className="text-xs text-muted-foreground">
            * Formas de pagamento e parcelamento serão discutidas na consulta presencial
          </p>

          <Button 
            className="w-full" 
            onClick={onDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Orçamento (PDF)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
