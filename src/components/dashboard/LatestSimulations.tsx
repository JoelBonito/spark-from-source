import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface Simulation {
  id: string;
  patient_name: string;
  treatment_type: string;
  processed_image_url?: string;
  created_at: string;
}

interface LatestSimulationsProps {
  simulations: Simulation[];
  loading: boolean;
}

export function LatestSimulations({ simulations, loading }: LatestSimulationsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Últimas Simulações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">Últimas Simulações</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/simulations')}>
          Ver tudo
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {simulations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma simulação ainda
          </p>
        ) : (
          simulations.slice(0, 5).map((sim) => (
            <div
              key={sim.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/simulations/${sim.id}`)}
            >
              {sim.processed_image_url && (
                <img
                  src={sim.processed_image_url}
                  alt={sim.patient_name}
                  className="h-12 w-12 rounded-md object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{sim.patient_name}</p>
                <p className="text-sm text-muted-foreground">
                  {sim.treatment_type} • {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
