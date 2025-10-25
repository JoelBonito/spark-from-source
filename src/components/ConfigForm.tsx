import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Save, RotateCcw, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveConfig, getConfig, DEFAULT_PROMPT, type Config } from "@/utils/storage";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/contexts/ConfigContext";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
export default function ConfigForm() {
  const navigate = useNavigate();
  const {
    refreshConfig
  } = useConfig();
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Config>({
    apiKey: "",
    backendUrl: import.meta.env.VITE_SUPABASE_URL || "",
    temperature: 0.4,
    topK: 32,
    topP: 1.0,
    maxTokens: 8192,
    promptTemplate: DEFAULT_PROMPT,
    userName: "",
    userPhone: "",
    userEmail: "",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicEmail: "",
    crmEnabled: true,
    facetsSimulatorEnabled: true,
    whiteningSimulatorEnabled: true
  });
  useEffect(() => {
    getConfig().then(config => {
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
      userName: formData.userName,
      userPhone: formData.userPhone,
      userEmail: formData.userEmail,
      clinicName: formData.clinicName,
      clinicAddress: formData.clinicAddress,
      clinicPhone: formData.clinicPhone,
      clinicEmail: formData.clinicEmail,
      crmEnabled: formData.crmEnabled,
      facetsSimulatorEnabled: formData.facetsSimulatorEnabled,
      whiteningSimulatorEnabled: formData.whiteningSimulatorEnabled
    };
    try {
      await saveConfig(config);
      await refreshConfig(); // Atualizar contexto
      toast.success("Configuração salva com sucesso!");
      setTimeout(() => navigate("/"), 500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    }
  };
  const handleResetPrompt = () => {
    setFormData({
      ...formData,
      promptTemplate: DEFAULT_PROMPT
    });
    toast.info("Prompt restaurado para o padrão");
  };
  return <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* DADOS DO USUÁRIO */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          👤 Dados do Usuário
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Nome Completo</Label>
            <Input 
              id="userName" 
              type="text"
              placeholder="Seu nome completo"
              value={formData.userName || ''} 
              onChange={e => setFormData({...formData, userName: e.target.value})} 
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá na barra lateral
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userPhone">Telefone</Label>
            <Input 
              id="userPhone" 
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.userPhone || ''} 
              onChange={e => setFormData({...formData, userPhone: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="userEmail">E-mail</Label>
            <Input 
              id="userEmail" 
              type="email"
              placeholder="seu@email.com"
              value={formData.userEmail || ''} 
              onChange={e => setFormData({...formData, userEmail: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* DADOS DA CLÍNICA */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          🏥 Dados da Clínica/Consultório
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clinicName">Nome da Clínica</Label>
            <Input 
              id="clinicName" 
              type="text"
              placeholder="Nome do seu consultório ou clínica"
              value={formData.clinicName || ''} 
              onChange={e => setFormData({...formData, clinicName: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clinicAddress">Endereço</Label>
            <Input 
              id="clinicAddress" 
              type="text"
              placeholder="Rua, número, bairro, cidade - UF"
              value={formData.clinicAddress || ''} 
              onChange={e => setFormData({...formData, clinicAddress: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clinicPhone">Telefone</Label>
            <Input 
              id="clinicPhone" 
              type="tel"
              placeholder="(00) 0000-0000"
              value={formData.clinicPhone || ''} 
              onChange={e => setFormData({...formData, clinicPhone: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clinicEmail">E-mail</Label>
            <Input 
              id="clinicEmail" 
              type="email"
              placeholder="contato@clinica.com"
              value={formData.clinicEmail || ''} 
              onChange={e => setFormData({...formData, clinicEmail: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* CREDENCIAIS */}
      

      {/* PARÂMETROS AVANÇADOS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          ⚙️ Parâmetros de Geração (Gemini)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Temperature, TopK, TopP, MaxTokens... */}
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura</Label>
            <Input id="temperature" type="number" min="0" max="1" step="0.1" value={formData.temperature} onChange={e => setFormData({
            ...formData,
            temperature: parseFloat(e.target.value)
          })} className={errors.temperature ? "border-destructive" : ""} />
            {errors.temperature && <p className="text-sm text-destructive">{errors.temperature}</p>}
            <p className="text-xs text-muted-foreground">Randomicidade (0.0=Consistente, 1.0=Criativo)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topK">Top K</Label>
            <Input id="topK" type="number" min="1" step="1" value={formData.topK} onChange={e => setFormData({
            ...formData,
            topK: parseInt(e.target.value)
          })} className={errors.topK ? "border-destructive" : ""} />
            {errors.topK && <p className="text-sm text-destructive">{errors.topK}</p>}
            <p className="text-xs text-muted-foreground">Número de tokens a considerar (maior = mais diversidade)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topP">Top P</Label>
            <Input id="topP" type="number" min="0" max="1" step="0.1" value={formData.topP} onChange={e => setFormData({
            ...formData,
            topP: parseFloat(e.target.value)
          })} className={errors.topP ? "border-destructive" : ""} />
            {errors.topP && <p className="text-sm text-destructive">{errors.topP}</p>}
            <p className="text-xs text-muted-foreground">Probabilidade cumulativa (0.0-1.0)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input id="maxTokens" type="number" min="100" step="1" value={formData.maxTokens} onChange={e => setFormData({
            ...formData,
            maxTokens: parseInt(e.target.value)
          })} className={errors.maxTokens ? "border-destructive" : ""} />
            {errors.maxTokens && <p className="text-sm text-destructive">{errors.maxTokens}</p>}
            <p className="text-xs text-muted-foreground">Limite de tokens na resposta (max. 8192)</p>
          </div>
        </div>
      </div>

      {/* MÓDULOS DO SISTEMA */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          📊 Módulos do Sistema
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="crmEnabled" className="text-base font-semibold">
                    Módulo CRM
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Sistema de gestão de relacionamento com clientes. 
                          Gerencie leads, oportunidades e pipeline de vendas.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ativar ou desativar o módulo de gestão de leads
                </p>
              </div>
            </div>
            <Switch id="crmEnabled" checked={formData.crmEnabled} onCheckedChange={checked => setFormData(prev => ({
              ...prev,
              crmEnabled: checked
            }))} />
          </div>
        </div>
      </div>

      {/* MÓDULOS DE SIMULAÇÃO */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          🦷 Módulos de Simulação
        </h2>
        
        <div className="space-y-4">
          {/* Facetas (AGORA COM TOGGLE) */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="facetsEnabled" className="text-base font-semibold">
                    Simulador de Facetas Dentárias
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Módulo principal de simulação de facetas dentárias. 
                          Recomendamos manter sempre ativo.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simulação de facetas de cerâmica (ativo por padrão)
                </p>
              </div>
            </div>
            <Switch 
              id="facetsEnabled" 
              checked={formData.facetsSimulatorEnabled ?? true}
              onCheckedChange={checked => setFormData(prev => ({
                ...prev, 
                facetsSimulatorEnabled: checked
              }))} 
            />
          </div>
          
          {/* Clareamento (toggle) */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="whiteningEnabled" className="text-base font-semibold">
                    Simulador de Clareamento Dental
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Simulação de clareamento dental. Útil para apresentar 
                          resultados de tratamentos de branqueamento.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ative para permitir simulações de clareamento dental
                </p>
              </div>
            </div>
            <Switch 
              id="whiteningEnabled" 
              checked={formData.whiteningSimulatorEnabled ?? true}
              onCheckedChange={checked => setFormData(prev => ({
                ...prev,
                whiteningSimulatorEnabled: checked
              }))} 
            />
          </div>
        </div>
      </div>

      {/* INFORMATIVO - SERVIÇOS AGORA GERIDOS EM ABA PRÓPRIA */}
      

      <div className="flex justify-end gap-3 pb-6">
          <Button type="submit" className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Salvar Configuração
          </Button>
      </div>
    </form>;
}