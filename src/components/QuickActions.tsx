import { Lead } from '@/services/leadService';
import { Button } from './ui/button';
import { MessageCircle, Sparkles, FileText, Calendar, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  lead: Lead;
}

export function QuickActions({ lead }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá ${lead.name}! Entrando em contato sobre sua simulação de facetas dentárias.`
    );
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleNewSimulation = () => {
    navigate('/', { state: { patientId: lead.patient_id } });
  };

  const handleEmail = () => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground mb-3">
        Ações Rápidas
      </h4>

      <Button
        onClick={handleWhatsApp}
        className="w-full justify-start"
        variant="outline"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>

      {lead.patient_id && (
        <Button
          onClick={handleNewSimulation}
          className="w-full justify-start glow-trusmile transition-all duration-300"
          variant="trusmile"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Nova Simulação
        </Button>
      )}

      <Button
        onClick={() => navigate('/orcamentos')}
        className="w-full justify-start"
        variant="outline"
      >
        <FileText className="h-4 w-4 mr-2" />
        Ver Orçamentos
      </Button>

      <Button
        className="w-full justify-start"
        variant="outline"
        disabled
      >
        <Calendar className="h-4 w-4 mr-2" />
        Agendar Consulta
      </Button>

      {lead.email && (
        <Button
          onClick={handleEmail}
          className="w-full justify-start"
          variant="outline"
        >
          <Mail className="h-4 w-4 mr-2" />
          Enviar Email
        </Button>
      )}
    </div>
  );
}
