import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Save, RotateCcw, DollarSign, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveConfig, getConfig, DEFAULT_PROMPT, DEFAULT_SERVICES, type Config, type ServicePrice } from "@/utils/storage";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/contexts/ConfigContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    servicePrices: DEFAULT_SERVICES,
    crmEnabled: true
  });
  useEffect(() => {
    getConfig().then(config => {
      if (config) {
        setFormData(config);
      }
    });
  }, []);

  // Lógica de manipulação de serviços
  const handleServiceChange = (index: number, field: keyof ServicePrice, value: any) => {
    const newServices = [...formData.servicePrices];

    // Converte preço para float
    if (field === 'price') {
      value = parseFloat(value);
      if (isNaN(value)) return;
    }
    newServices[index] = {
      ...newServices[index],
      [field]: value
    };

    // Garante que só 1 é base (se o campo alterado for 'base')
    if (field === 'base' && value === true) {
      newServices.forEach((service, i) => {
        if (i !== index) service.base = false;
      });
    }
    setFormData({
      ...formData,
      servicePrices: newServices
    });
  };
  const handleAddService = () => {
    setFormData({
      ...formData,
      servicePrices: [...formData.servicePrices, {
        name: "Novo Serviço",
        description: "",
        price: 0,
        base: false,
        category: "Opcional", // FASE 1: Novos serviços vão para categoria "Opcional"
        active: true,
        required: false
      }]
    });
  };
  const handleRemoveService = (index: number) => {
    const serviceToRemove = formData.servicePrices[index];
    
    // FASE 2: Não permitir remover serviços obrigatórios
    if (serviceToRemove.required) {
      toast.error("Não é possível remover serviços obrigatórios (Facetas, Clareamento, Consulta, Gengivoplastia).");
      return;
    }
    
    if (serviceToRemove.base) {
      toast.error("Não é possível remover o serviço base.");
      return;
    }
    
    const newServices = formData.servicePrices.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      servicePrices: newServices
    });
  };
  const handleResetServices = () => {
    setFormData({
      ...formData,
      servicePrices: DEFAULT_SERVICES
    });
    toast.info("Serviços restaurados para o padrão");
  };
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

    // Validação de Serviços
    if (!formData.servicePrices.some(s => s.base)) {
      newErrors.servicePrices = "Deve haver exatamente um serviço marcado como base (preço unitário da faceta).";
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
      servicePrices: formData.servicePrices,
      crmEnabled: formData.crmEnabled
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
      {/* CREDENCIAIS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          🔑 Configurações da API Gemini
        </h2>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Google Gemini API Key *</Label>
          <div className="relative">
            <Input id="apiKey" type={showApiKey ? "text" : "password"} value={formData.apiKey} onChange={e => setFormData({
            ...formData,
            apiKey: e.target.value
          })} placeholder="AIza..." className={errors.apiKey ? "border-destructive" : ""} />
            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.apiKey && <p className="text-sm text-destructive">{errors.apiKey}</p>}
          <p className="text-xs text-muted-foreground">
            ℹ️ Obtenha em:{" "}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              makersuite.google.com/app/apikey
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backendUrl">Backend URL *</Label>
          <Input id="backendUrl" type="text" value={formData.backendUrl} disabled placeholder={import.meta.env.VITE_SUPABASE_URL} className="bg-muted" />
          <p className="text-xs text-muted-foreground">
            ℹ️ Usando Lovable Cloud (configurado automaticamente)
          </p>
        </div>
      </div>

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

      {/* CRM MODULE TOGGLE */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          📊 Módulos do Sistema
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="crmEnabled" className="text-base font-semibold">
                Módulo CRM
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar o módulo de gestão de leads
              </p>
            </div>
            <Switch id="crmEnabled" checked={formData.crmEnabled} onCheckedChange={checked => setFormData(prev => ({
            ...prev,
            crmEnabled: checked
          }))} />
          </div>
        </div>
      </div>

      {/* SERVIÇOS E PREÇOS */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Serviços e Preços da Clínica *
        </h2>
        
        <p className="text-sm text-muted-foreground">
          <strong>Serviços Obrigatórios:</strong> Facetas, Clareamento, Consulta e Gengivoplastia são usados pela IA para calcular orçamentos automaticamente. Configure os nomes e preços de acordo com sua clínica.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Serviços Opcionais:</strong> Adicione outros serviços que você oferece para uso em orçamentos manuais.
        </p>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Serviço</TableHead>
                <TableHead className="min-w-[250px]">Descrição</TableHead>
                <TableHead className="w-[120px] text-right">Preço</TableHead>
                <TableHead className="w-[80px] text-center">Ativo</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // FASE 2: Separar serviços obrigatórios dos opcionais
                const requiredServices = formData.servicePrices.filter(s => s.required);
                const optionalServices = formData.servicePrices.filter(s => !s.required);
                
                return (
                  <>
                    {/* Seção de serviços obrigatórios */}
                    <TableRow className="bg-primary/10">
                      <TableCell colSpan={5} className="font-bold text-sm py-3">
                        ⭐ SERVIÇOS OBRIGATÓRIOS (não removíveis)
                      </TableCell>
                    </TableRow>
                    {requiredServices.map((service, idx) => {
                      const index = formData.servicePrices.indexOf(service);
                      const isInactive = !service.active || service.price <= 0;
                      
                      return (
                        <TableRow key={`required-${index}`} className={isInactive ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                          <TableCell className="align-top">
                            <div className="flex items-center gap-2">
                              <Input 
                                type="text" 
                                value={service.name} 
                                onChange={e => handleServiceChange(index, 'name', e.target.value)} 
                                placeholder="Nome do Serviço"
                                className="text-sm w-full"
                              />
                              {isInactive && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">⚠️</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Categoria: {service.category}</p>
                          </TableCell>
                          <TableCell className="align-top">
                            <Textarea 
                              value={service.description} 
                              onChange={e => handleServiceChange(index, 'description', e.target.value)} 
                              placeholder="Descrição do serviço"
                              className="text-sm resize-none min-h-[60px] w-full"
                              rows={2}
                            />
                          </TableCell>
                          <TableCell className="text-right align-top">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                value={service.price} 
                                onChange={e => handleServiceChange(index, 'price', e.target.value)} 
                                className={`text-right pl-8 text-sm ${service.price <= 0 ? 'border-yellow-500' : ''}`}
                              />
                            </div>
                            {service.category !== 'Gengivoplastia' && service.price <= 0 && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Obrigatório &gt; 0</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={service.active}
                              onCheckedChange={(checked) => handleServiceChange(index, 'active', checked)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              disabled
                              title="Serviço obrigatório não pode ser removido"
                            >
                              <Trash2 className="h-4 w-4 text-muted" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Seção de serviços opcionais */}
                    {optionalServices.length > 0 && (
                      <>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={5} className="font-semibold text-sm py-3">
                            💼 SERVIÇOS OPCIONAIS (customizáveis)
                          </TableCell>
                        </TableRow>
                        {optionalServices.map((service, idx) => {
                          const index = formData.servicePrices.indexOf(service);
                          
                          return (
                            <TableRow key={`optional-${index}`} className={!service.active ? "opacity-50 bg-muted/30" : ""}>
                              <TableCell className="align-top">
                                <Input 
                                  type="text" 
                                  value={service.name} 
                                  onChange={e => handleServiceChange(index, 'name', e.target.value)} 
                                  placeholder="Nome do Serviço"
                                  className="text-sm w-full"
                                />
                              </TableCell>
                              <TableCell className="align-top">
                                <Textarea 
                                  value={service.description} 
                                  onChange={e => handleServiceChange(index, 'description', e.target.value)} 
                                  placeholder="Descrição do serviço"
                                  className="text-sm resize-none min-h-[60px] w-full"
                                  rows={2}
                                />
                              </TableCell>
                              <TableCell className="text-right align-top">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    value={service.price} 
                                    onChange={e => handleServiceChange(index, 'price', e.target.value)} 
                                    className="text-right pl-8 text-sm" 
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={service.active}
                                  onCheckedChange={(checked) => handleServiceChange(index, 'active', checked)}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRemoveService(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </>
                    )}
                  </>
                );
              })()}
            </TableBody>
          </Table>
        </div>

        {errors.servicePrices && <p className="text-sm text-destructive">{errors.servicePrices}</p>}
        
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleAddService} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Serviço
          </Button>
          <Button type="button" variant="outline" onClick={handleResetServices} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
          <Button type="submit" className="flex items-center gap-2 bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Salvar Configuração
          </Button>
      </div>
    </form>;
}