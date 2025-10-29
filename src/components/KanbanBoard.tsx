import { Lead, ExtendedLead } from '@/services/leadService';
import { getPipelineStages } from '@/services/pipelineService';
import { KanbanColumn } from './KanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { LeadCard } from './LeadCard';
import { useState } from 'react';

interface KanbanBoardProps {
  leadsByStage: Record<string, ExtendedLead[]>;
  onLeadClick: (lead: ExtendedLead) => void;
  onMoveLeadToStage: (leadId: string, newStage: string) => Promise<void>;
  onDeleteLead?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  onEditLead?: (leadId: string) => void;
}

export function KanbanBoard({ leadsByStage, onLeadClick, onMoveLeadToStage, onDeleteLead, onArchiveLead, onEditLead }: KanbanBoardProps) {
  const stages = getPipelineStages();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, over } = event;
    
    if (!over) return;
    
    const leadId = active.id as string;
    const newStage = over.id as string;
    
    // Encontrar o lead atual e verificar se mudou de stage
    let currentStage: string | null = null;
    for (const [stage, leads] of Object.entries(leadsByStage)) {
      if (leads.some(l => l.id === leadId)) {
        currentStage = stage;
        break;
      }
    }
    
    if (currentStage && currentStage !== newStage) {
      onMoveLeadToStage(leadId, newStage);
    }
  };

  const activeLead = activeId
    ? Object.values(leadsByStage)
        .flat()
        .find(lead => lead.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stages.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.id] || []}
            onLeadClick={onLeadClick}
            onDeleteLead={onDeleteLead}
            onArchiveLead={onArchiveLead}
            onEditLead={onEditLead}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 scale-105">
            <LeadCard lead={activeLead} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
