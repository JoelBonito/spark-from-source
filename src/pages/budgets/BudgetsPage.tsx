import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export default function BudgetsPage() {
  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus orçamentos e propostas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display">Em Breve</CardTitle>
              <CardDescription>
                Funcionalidade de orçamentos será implementada em breve
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página permitirá criar, visualizar e gerenciar orçamentos para seus pacientes,
            com integração direta com as simulações realizadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
