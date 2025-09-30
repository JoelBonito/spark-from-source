import Layout from "@/components/Layout";
import ConfigForm from "@/components/ConfigForm";

export default function Config() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Configure sua API Key do Google Gemini e parâmetros de geração
          </p>
        </div>

        <ConfigForm />
      </div>
    </Layout>
  );
}
