import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBadge } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Visualize relatórios técnicos e documentação
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileBadge className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display">Em Breve</CardTitle>
              <CardDescription>
                Funcionalidade de relatórios será implementada em breve
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página permitirá gerar e visualizar relatórios técnicos detalhados das
            simulações, com análise completa e documentação profissional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
