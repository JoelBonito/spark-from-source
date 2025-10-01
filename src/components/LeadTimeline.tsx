import { Activity } from '@/services/leadService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar, 
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface LeadTimelineProps {
  activities: Activity[];
  onAddNote: (note: string) => Promise<void>;
}

const activityIcons: Record<string, any> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  meeting: Calendar,
  simulation: Sparkles,
  stage_change: ArrowRightLeft
};

export function LeadTimeline({ activities, onAddNote }: LeadTimelineProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAdding(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Adicionar nova nota */}
      <div className="space-y-2">
        <Textarea
          placeholder="Adicionar uma nota..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
        <Button
          onClick={handleAddNote}
          disabled={isAdding || !newNote.trim()}
          size="sm"
        >
          Adicionar Nota
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-muted-foreground">
          Histórico de Atividades
        </h4>
        
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || MessageSquare;
              const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                locale: ptBR,
                addSuffix: true
              });

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-medium text-sm text-foreground">
                        {activity.title}
                      </h5>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
