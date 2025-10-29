import { Lead } from '@/services/leadService';
import { Button } from './ui/button';
import { Sparkles, FileText, Calendar, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  lead: Lead;
}

export function QuickActions({ lead }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleNewSimulation = () => {
    navigate('/simulador', { state: { patientId: lead.patient_id } });
  };

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground mb-3">
        Ações Rápidas
      </h4>

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
        onClick={() => navigate('/orcamentos', { 
          state: { 
            createNew: true, 
            patientId: lead.patient_id,
            patientName: lead.name 
          } 
        })}
        className="w-full justify-start"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Orçamento
      </Button>

      <Button
        onClick={() => navigate('/orcamentos', { 
          state: { 
            filterPatientId: lead.patient_id 
          } 
        })}
        className="w-full justify-start"
        variant="outline"
      >
        <Eye className="h-4 w-4 mr-2" />
        Ver Orçamentos
      </Button>

      <Button
        className="w-full justify-start"
        variant="outline"
        disabled
      >
        <Calendar className="h-4 w-4 mr-2" />
        Agendar Consulta (brevemente)
      </Button>
    </div>
  );
}
