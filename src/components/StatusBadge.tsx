import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'archived';
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    variant: 'warning' as const,
  },
  sent: {
    label: 'Enviado',
    variant: 'info' as const,
  },
  viewed: {
    label: 'Visualizado',
    variant: 'default' as const,
  },
  accepted: {
    label: 'Aceito',
    variant: 'success' as const,
  },
  rejected: {
    label: 'Recusado',
    variant: 'destructive' as const,
  },
  expired: {
    label: 'Expirado',
    variant: 'outline' as const,
  },
  archived: {
    label: 'Arquivado',
    variant: 'outline' as const,
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};
