import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Users } from 'lucide-react';

export default function SimulationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // TODO: Buscar simulação do Supabase
  const simulation = null;

  if (!simulation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Simulação não encontrada</p>
        <Button onClick={() => navigate('/simulator')} className="mt-4">
          Voltar para Simulador
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/simulations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Detalhes da Simulação</h1>
            <p className="text-muted-foreground mt-1">
              Simulação para {simulation.patient_name}
            </p>
          </div>
        </div>
        <Badge>{simulation.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Imagem Original</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">Imagem não disponível</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Imagem Processada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">Imagem não disponível</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Informações da Simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="font-medium">{simulation.patient_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Tratamento</p>
            <p className="font-medium capitalize">{simulation.treatment_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data da Simulação</p>
            <p className="font-medium">
              {new Date(simulation.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-display">Ações</CardTitle>
          <CardDescription>O que você gostaria de fazer?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Orçamento
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Vincular ao Paciente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
