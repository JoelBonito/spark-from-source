import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  suggestions?: string[];
  onClose?: () => void;
}

export default function ErrorAlert({ message, suggestions, onClose }: ErrorAlertProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-1">Erro ao Processar</h3>
          <p className="text-sm text-destructive/90 mb-3">{message}</p>
          
          {suggestions && suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-destructive mb-2">Possíveis causas:</p>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-destructive/80">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
