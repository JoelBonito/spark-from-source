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
import { Phone, Mail, Tag, Clock, Sparkles, Smile, MoreHorizontal, Trash2, Archive, Edit } from 'lucide-react';
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
  onEdit?: (leadId: string) => void;
}

export function LeadCard({ lead, onClick, onDelete, onArchive, onEdit }: LeadCardProps) {
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
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(lead.id);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
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
          className="p-3 cursor-move space-y-2"
        >
          {/* Badge de tipo de tratamento ACIMA do nome */}
          {lead.treatment_type && (
            <Badge 
              variant={lead.treatment_type === 'clareamento' ? 'secondary' : 'default'}
              className="text-xs flex items-center gap-1 w-fit"
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
          
          {/* Nome do paciente ABAIXO do badge */}
          <h3 className="font-semibold text-sm text-foreground pr-8">
            {lead.name}
          </h3>
        </div>

        {/* ÁREA DE CLICK - SEPARADA DO DRAG */}
        <div 
          className="px-3 pb-3 space-y-2 cursor-pointer"
          onClick={onClick}
        >
          {/* Contato */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>

          {/* Contagem de simulações */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>{lead.simulationCount || 0} simulações</span>
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
