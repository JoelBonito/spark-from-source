import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { mockSimulations } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function SimulationsHistoryPage() {
  const navigate = useNavigate();
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Histórico de Simulações</h1>
        <p className="text-muted-foreground mt-1">
          Visualize todas as simulações realizadas
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Simulações Realizadas</CardTitle>
          <CardDescription>
            Total de {mockSimulations.length} simulações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Tratamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSimulations.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="font-medium">{sim.patient_name}</TableCell>
                  <TableCell className="capitalize">{sim.treatment_type}</TableCell>
                  <TableCell>
                    {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sim.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/simulations/${sim.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
