import { Lead, ExtendedLead } from '@/services/leadService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Phone, Mail, Tag, Clock, Sparkles, Smile, MoreHorizontal, Trash2, Archive } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface LeadCardProps {
  lead: ExtendedLead;
  onClick: () => void;
  onDelete?: (leadId: string) => void;
  onArchive?: (leadId: string) => void;
}

export function LeadCard({ lead, onClick, onDelete, onArchive }: LeadCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(lead.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card border rounded-lg hover:shadow-md transition-all group relative"
      >
        {/* Menu de Ações - SEM PROPAGAÇÃO */}
        {onDelete && (
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onArchive && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(lead.id);
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ÁREA DE DRAG - SEM ONCLICK */}
        <div
          {...attributes}
          {...listeners}
          className="p-4 cursor-move"
        >
          {/* Header com nome e badge - APENAS VISUAL PARA DRAG */}
          <div className="flex items-start justify-between gap-2 pr-8">
            <h3 className="font-semibold text-foreground">
              {lead.name}
            </h3>
            {/* Badge de tipo de tratamento */}
            {lead.treatment_type && (
              <Badge 
                variant={lead.treatment_type === 'clareamento' ? 'secondary' : 'default'}
                className="text-xs flex items-center gap-1 shrink-0"
              >
                {lead.treatment_type === 'clareamento' ? (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Clareamento
                  </>
                ) : (
                  <>
                    <Smile className="h-3 w-3" />
                    Facetas
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* ÁREA DE CLICK - SEPARADA DO DRAG */}
        <div 
          className="px-4 pb-4 space-y-3 cursor-pointer"
          onClick={onClick}
        >

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

          {/* Valor e Contagem */}
          <div className="flex items-center justify-between">
            {lead.opportunity_value && (
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(lead.opportunity_value)}
              </div>
            )}
            {lead.simulationCount && lead.simulationCount > 1 && (
              <Badge variant="outline" className="text-xs">
                {lead.simulationCount} simulações
              </Badge>
            )}
          </div>

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

      {/* Alert Dialog de Confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
