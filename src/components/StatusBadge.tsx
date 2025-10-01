import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
  },
  sent: {
    label: 'Enviado',
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
  },
  viewed: {
    label: 'Visualizado',
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
  },
  accepted: {
    label: 'Aceito',
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
  },
  rejected: {
    label: 'Recusado',
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  },
  expired: {
    label: 'Expirado',
    className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
