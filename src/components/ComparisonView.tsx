import { Loader2 } from "lucide-react";

interface ComparisonViewProps {
  beforeImage: string;
  afterImage: string | null;
  isProcessing: boolean;
  processingTime?: number;
}

export default function ComparisonView({
  beforeImage,
  afterImage,
  isProcessing,
  processingTime,
}: ComparisonViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ANTES */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <h3 className="text-lg font-semibold text-foreground">ANTES</h3>
          </div>
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <img
              src={beforeImage}
              alt="Imagem original"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* DEPOIS */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <h3 className="text-lg font-semibold text-foreground">
              DEPOIS {afterImage && "✅"}
            </h3>
          </div>
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            {isProcessing ? (
              <div className="aspect-square flex flex-col items-center justify-center p-12 bg-muted">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-foreground">Processando com Gemini...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Isso pode levar alguns segundos
                </p>
              </div>
            ) : afterImage ? (
              <img
                src={afterImage}
                alt="Imagem processada"
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-square flex items-center justify-center p-12 bg-muted">
                <p className="text-sm text-muted-foreground">
                  Aguardando processamento
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-lg border bg-card p-4">
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processando... {processingTime ? `${(processingTime / 1000).toFixed(1)}s` : ""}</span>
          </div>
        )}
        {afterImage && processingTime && (
          <p className="text-sm text-muted-foreground">
            ✓ Processado com sucesso em {(processingTime / 1000).toFixed(1)} segundos
          </p>
        )}
      </div>
    </div>
  );
}
