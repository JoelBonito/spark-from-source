import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Serviços</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os serviços oferecidos
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display">Em Breve</CardTitle>
              <CardDescription>
                Funcionalidade de serviços será implementada em breve
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página permitirá cadastrar e gerenciar os serviços oferecidos pela clínica,
            com preços e descrições detalhadas para cada tratamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
