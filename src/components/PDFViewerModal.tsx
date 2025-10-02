import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export function PDFViewerModal({ isOpen, onClose, pdfUrl, title }: PDFViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Visualização do documento PDF
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
