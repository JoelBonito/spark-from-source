import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/crm/LeadForm';
import { mockLeads } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function EditLeadPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const lead = mockLeads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead não encontrado</p>
      </div>
    );
  }

  const handleSubmit = (data: any) => {
    console.log('Updating lead:', data);
    toast.success('Lead atualizado com sucesso!');
    navigate(`/crm/${id}`);
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/crm/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Editar Lead</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações de {lead.name}
          </p>
        </div>
      </div>

      <Card className="shadow-md max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">Informações do Lead</CardTitle>
          <CardDescription>Atualize os dados do lead</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm
            defaultValues={{
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              stage: lead.stage as any,
            }}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
