import ConfigForm from '@/components/ConfigForm';

export default function ConfigPage() {
  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-display font-bold">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas chaves de API, parâmetros de IA e os preços praticados pela clínica
        </p>
      </div>
      <ConfigForm />
    </div>
  );
}