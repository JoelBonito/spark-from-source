import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ConfigPage() {
  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configure seu sistema e preferências
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display">Em Breve</CardTitle>
              <CardDescription>
                Funcionalidade de configurações será implementada em breve
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página permitirá configurar preferências do sistema, integrações com APIs,
            personalização de modelos e outras configurações avançadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
