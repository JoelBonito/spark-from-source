import Layout from "@/components/Layout";
import ConfigForm from "@/components/ConfigForm";

export default function Config() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Gerencie suas chaves de API, parâmetros de IA e os preços praticados pela clínica.</p>
        <ConfigForm />
      </div>
    </Layout>
  );
}
