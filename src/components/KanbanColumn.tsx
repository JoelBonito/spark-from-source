import { Lead, ExtendedLead } from '@/services/leadService';
import { LeadCard } from './LeadCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: {
    id: string;
    name: string;
    color: string;
    description: string;
  };
  leads: ExtendedLead[];
  onLeadClick: (lead: ExtendedLead) => void;
  onDeleteLead?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  onEditLead?: (leadId: string) => void;
}

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
};

export function KanbanColumn({ stage, leads, onLeadClick, onDeleteLead, onArchiveLead, onEditLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="w-full">
      <div
        className={cn(
          'border-2 rounded-lg p-4 h-full transition-colors',
          colorClasses[stage.color] || colorClasses.gray,
          isOver && 'ring-2 ring-primary'
        )}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg text-foreground">
              {stage.name}
            </h3>
            <span className="text-sm font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded">
              {leads.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stage.description}
          </p>
        </div>

        {/* Leads */}
        <div
          ref={setNodeRef}
          className="space-y-3 min-h-[200px]"
        >
          <SortableContext
            items={leads.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead)}
                onDelete={onDeleteLead}
                onArchive={onArchiveLead}
                onEdit={onEditLead}
              />
            ))}
          </SortableContext>

          {leads.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhum lead nesta etapa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
