import { Lead } from '@/services/leadService';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Tag, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const timeInStage = formatDistanceToNow(new Date(lead.created_at), {
    locale: ptBR,
    addSuffix: true
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-card border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="space-y-3">
        {/* Nome */}
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {lead.name}
          </h3>
        </div>

        {/* Contato */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Valor */}
        {lead.opportunity_value && (
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(lead.opportunity_value)}
          </div>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {lead.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{lead.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Tempo na etapa */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeInStage}</span>
        </div>

        {/* Fonte */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {lead.source === 'simulacao' ? 'Simulação' : lead.source}
          </Badge>
        </div>
      </div>
    </div>
  );
}
