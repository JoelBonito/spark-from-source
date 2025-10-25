import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/crm/LeadForm';
import { toast } from 'sonner';

export default function NewLeadPage() {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    console.log('Creating lead:', data);
    toast.success('Lead criado com sucesso!');
    navigate('/crm');
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Novo Lead</h1>
          <p className="text-muted-foreground mt-1">
            Adicione um novo lead ao pipeline
          </p>
        </div>
      </div>

      <Card className="shadow-md max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">Informações do Lead</CardTitle>
          <CardDescription>Preencha os dados do novo lead</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
