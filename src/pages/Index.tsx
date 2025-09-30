import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Download, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import ComparisonView from "@/components/ComparisonView";
import ErrorAlert from "@/components/ErrorAlert";
import { hasConfig, getConfig } from "@/utils/storage";
import { downloadImage } from "@/utils/imageProcessing";
import { getTimestamp } from "@/utils/formatters";

export default function Index() {
  const navigate = useNavigate();
  const [hasApiConfig, setHasApiConfig] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if config exists
      hasConfig().then((exists) => {
        setHasApiConfig(exists);
        if (!exists) {
          navigate("/config");
        }
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setProcessingTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleImageSelect = (base64: string) => {
    setOriginalImage(base64);
    setProcessedImage(null);
    setError(null);
  };

  const handleClearImage = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  const handleProcessImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);
    setProcessedImage(null);
    setProcessingTime(0);

    const startTime = Date.now();

    try {
      const config = await getConfig();
      if (!config) {
        throw new Error("Configuração não encontrada");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/process-dental-facets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: originalImage,
          prompt: config.promptTemplate,
          config: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.imageBase64) {
        throw new Error("Resposta inválida do servidor: imagem não encontrada");
      }

      setProcessedImage(result.imageBase64);
      setProcessingTime(Date.now() - startTime);
      toast.success("Simulação gerada com sucesso!");
    } catch (err) {
      console.error("Erro ao processar:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error("Erro ao processar imagem");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const filename = `facetas-resultado-${getTimestamp()}.jpg`;
      downloadImage(processedImage, filename);
      toast.success("Download iniciado!");
    }
  };

  const handleNewSimulation = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setProcessingTime(0);
  };

  if (!hasApiConfig) {
    return null; // Already redirecting to /config
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🦷 Simulador de Facetas
          </h1>
          <p className="text-muted-foreground">
            Faça upload de uma foto e veja o resultado com facetas dentárias
          </p>
        </div>

        {!originalImage && (
          <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              PASSO 1: Upload da Foto
            </h2>
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={originalImage}
              onClear={handleClearImage}
              disabled={isProcessing}
            />
          </div>
        )}

        {originalImage && !processedImage && !isProcessing && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                PASSO 1: Foto Carregada
              </h2>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={originalImage}
                onClear={handleClearImage}
                disabled={isProcessing}
              />
            </div>

            <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                PASSO 2: Processar
              </h2>
              <Button
                onClick={handleProcessImage}
                disabled={isProcessing || !originalImage}
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Zap className="h-5 w-5 mr-2" />
                Gerar Simulação
              </Button>
            </div>
          </div>
        )}

        {(isProcessing || processedImage) && originalImage && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                Comparação de Resultados
              </h2>
              <ComparisonView
                beforeImage={originalImage}
                afterImage={processedImage}
                isProcessing={isProcessing}
                processingTime={processingTime}
              />
            </div>

            {processedImage && (
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={handleNewSimulation}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Nova Simulação
                </Button>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Download className="h-5 w-5" />
                  Baixar Resultado
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <ErrorAlert
            message={error}
            suggestions={[
              "Verifique sua API Key nas configurações",
              "Backend não está rodando ou URL está incorreta",
              "Imagem em formato inválido ou muito grande",
              "Tempo limite excedido - tente novamente",
            ]}
            onClose={() => setError(null)}
          />
        )}
      </div>
    </Layout>
  );
}
