import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { fileToBase64, validateImageFile } from "@/utils/imageProcessing";

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  onClear,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        onImageSelect(base64);
      } catch (err) {
        setError("Erro ao carregar imagem. Tente novamente.");
      }
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  if (currentImage) {
    return (
      <div className="relative">
        <img
          src={currentImage}
          alt="Imagem selecionada"
          className="w-full rounded-lg shadow-md"
        />
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Arraste uma foto do sorriso aqui
        </h3>
        <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
        
        <div className="text-xs text-muted-foreground space-y-1 text-center">
          <p>Formatos: JPG, PNG, WEBP</p>
          <p>Tamanho máximo: 8MB</p>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
