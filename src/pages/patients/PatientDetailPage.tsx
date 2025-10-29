import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Smile, FileText, Calendar } from 'lucide-react';
import { usePatientDetail } from '@/hooks/usePatientDetail';

export default function PatientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { patient, simulations, loading } = usePatientDetail(id || null);

  if (loading) {
    return (
      <div className="space-y-6 fade-in-up">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Paciente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">{patient.name}</h1>
            <p className="text-muted-foreground mt-1">Detalhes do paciente</p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">
                {new Date(patient.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
               variant="outline" 
               className="w-full justify-start"
               onClick={() => navigate('/simulator', { 
               state: { selectedPatient: patient } 
               })}
              >  
            <Smile className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/budgets', { 
                state: { 
                  createNew: true,
                  patientId: patient.id,
                  patientName: patient.name
                }   
              })}
            >
              <FileText className="h-4 w-4 mr-2" />
               Gerar Orçamento
            </Button> 
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Consulta (Brevemente)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Histórico de Simulações</CardTitle>
          <CardDescription>
            {simulations.length} simulações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {simulations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma simulação realizada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {simulations.map((sim: any) => (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/simulations/${sim.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Smile className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{sim.treatment_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge>{sim.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
