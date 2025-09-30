import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveConfig, getConfig, DEFAULT_PROMPT, type Config } from "@/utils/storage";

export default function ConfigForm() {
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    apiKey: "",
    backendUrl: import.meta.env.VITE_SUPABASE_URL || "",
    temperature: 0.4,
    topK: 32,
    topP: 1.0,
    maxTokens: 8192,
    promptTemplate: DEFAULT_PROMPT,
  });

  useEffect(() => {
    getConfig().then((config) => {
      if (config) {
        setFormData(config);
      }
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.apiKey || formData.apiKey.length < 20) {
      newErrors.apiKey = "API Key inválida (mínimo 20 caracteres)";
    }

    if (!formData.backendUrl) {
      newErrors.backendUrl = "URL do backend é obrigatória";
    } else {
      try {
        new URL(formData.backendUrl);
      } catch {
        newErrors.backendUrl = "URL inválida";
      }
    }

    if (formData.temperature < 0 || formData.temperature > 1) {
      newErrors.temperature = "Temperature deve estar entre 0 e 1";
    }

    if (formData.topK <= 0) {
      newErrors.topK = "Top K deve ser maior que 0";
    }

    if (formData.topP < 0 || formData.topP > 1) {
      newErrors.topP = "Top P deve estar entre 0 e 1";
    }

    if (formData.maxTokens <= 0) {
      newErrors.maxTokens = "Max Tokens deve ser maior que 0";
    }

    if (!formData.promptTemplate.trim()) {
      newErrors.promptTemplate = "Template do prompt é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    const config: Config = {
      apiKey: formData.apiKey,
      backendUrl: formData.backendUrl,
      temperature: formData.temperature,
      topK: formData.topK,
      topP: formData.topP,
      maxTokens: formData.maxTokens,
      promptTemplate: formData.promptTemplate,
    };

    try {
      await saveConfig(config);
      toast.success("Configuração salva com sucesso!");
      setTimeout(() => navigate("/"), 500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    }
  };

  const handleResetPrompt = () => {
    setFormData({ ...formData, promptTemplate: DEFAULT_PROMPT });
    toast.info("Prompt restaurado para o padrão");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* CREDENCIAIS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          🔑 Configurações da API Gemini
        </h2>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Google Gemini API Key *</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="AIza..."
              className={errors.apiKey ? "border-destructive" : ""}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.apiKey && (
            <p className="text-sm text-destructive">{errors.apiKey}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ℹ️ Obtenha em:{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              makersuite.google.com/app/apikey
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backendUrl">Backend URL *</Label>
          <Input
            id="backendUrl"
            type="text"
            value={formData.backendUrl}
            disabled
            placeholder={import.meta.env.VITE_SUPABASE_URL}
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            ℹ️ Usando Lovable Cloud (configurado automaticamente)
          </p>
        </div>
      </div>

      {/* PARÂMETROS AVANÇADOS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          ⚙️ Parâmetros de Geração
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">
              Temperature: {formData.temperature.toFixed(2)}
            </Label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={formData.temperature}
              onChange={(e) =>
                setFormData({ ...formData, temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Criatividade (0 = conservador, 1 = criativo)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topK">Top K</Label>
            <Input
              id="topK"
              type="number"
              value={formData.topK}
              onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })}
              min="1"
              className={errors.topK ? "border-destructive" : ""}
            />
            {errors.topK && <p className="text-sm text-destructive">{errors.topK}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topP">Top P: {formData.topP.toFixed(2)}</Label>
            <input
              id="topP"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={formData.topP}
              onChange={(e) =>
                setFormData({ ...formData, topP: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={formData.maxTokens}
              onChange={(e) =>
                setFormData({ ...formData, maxTokens: parseInt(e.target.value) })
              }
              min="1"
              className={errors.maxTokens ? "border-destructive" : ""}
            />
            {errors.maxTokens && (
              <p className="text-sm text-destructive">{errors.maxTokens}</p>
            )}
          </div>
        </div>
      </div>

      {/* PROMPT TEMPLATE */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          📝 Template do Prompt
        </h2>

        <div className="space-y-2">
          <Textarea
            value={formData.promptTemplate}
            onChange={(e) =>
              setFormData({ ...formData, promptTemplate: e.target.value })
            }
            rows={20}
            className={`font-mono text-sm ${errors.promptTemplate ? "border-destructive" : ""}`}
          />
          {errors.promptTemplate && (
            <p className="text-sm text-destructive">{errors.promptTemplate}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetPrompt}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button
            type="submit"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Salvar Configuração
          </Button>
        </div>
      </div>
    </form>
  );
}
