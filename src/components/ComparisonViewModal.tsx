import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComparisonView from './ComparisonView';

interface ComparisonViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
  patientName: string;
}

export function ComparisonViewModal({
  isOpen,
  onClose,
  beforeImage,
  afterImage,
  patientName
}: ComparisonViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Antes e Depois - {patientName}</DialogTitle>
        </DialogHeader>
        <ComparisonView
          beforeImage={beforeImage}
          afterImage={afterImage}
          isProcessing={false}
        />
      </DialogContent>
    </Dialog>
  );
}
