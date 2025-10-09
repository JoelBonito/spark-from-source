import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_SERVICES = [
  // Categoria 1 – Facetas e Lentes de Contato
  { 
    name: "Faceta de Porcelana (por dente)", 
    description: "Faceta em porcelana feldspática ou dissilicato de lítio",
    price: 2500.00, 
    base: true,
    category: "Facetas e Lentes de Contato",
    active: true
  },
  { 
    name: "Lente de Contato Dental (por dente)", 
    description: "Lâmina ultra-fina de porcelana",
    price: 2800.00, 
    base: false,
    category: "Facetas e Lentes de Contato",
    active: true
  },
  { 
    name: "Faceta em Resina (por dente)", 
    description: "Faceta confeccionada em resina composta",
    price: 800.00, 
    base: false,
    category: "Facetas e Lentes de Contato",
    active: true
  },
  
  // Categoria 2 – Clareamento
  { 
    name: "Clareamento Dental a Laser (sessão)", 
    description: "Clareamento profissional em consultório",
    price: 800.00, 
    base: false,
    category: "Clareamento",
    active: true
  },
  { 
    name: "Clareamento Caseiro Supervisionado (kit completo)", 
    description: "Moldeira + gel clareador para uso domiciliar",
    price: 600.00, 
    base: false,
    category: "Clareamento",
    active: true
  },
  { 
    name: "Clareamento Interno (por dente)", 
    description: "Clareamento para dentes escurecidos após tratamento de canal",
    price: 300.00, 
    base: false,
    category: "Clareamento",
    active: true
  },
  
  // Categoria 3 – Preparação e Procedimentos Complementares
  { 
    name: "Moldagem Digital (arcada completa)", 
    description: "Escaneamento intraoral 3D",
    price: 300.00, 
    base: false,
    category: "Preparação e Procedimentos Complementares",
    active: true
  },
  { 
    name: "Planejamento Digital do Sorriso (DSD)", 
    description: "Design digital do novo sorriso",
    price: 500.00, 
    base: false,
    category: "Preparação e Procedimentos Complementares",
    active: true
  },
  { 
    name: "Gengivoplastia (por sextante)", 
    description: "Correção do contorno gengival",
    price: 800.00, 
    base: false,
    category: "Preparação e Procedimentos Complementares",
    active: true
  },
  { 
    name: "Restauração em Resina (por dente)", 
    description: "Restauração estética direta",
    price: 250.00, 
    base: false,
    category: "Preparação e Procedimentos Complementares",
    active: true
  },
  
  // Categoria 4 – Tratamentos de Canal e Estruturais
  { 
    name: "Tratamento de Canal (por dente)", 
    description: "Endodontia necessária antes da faceta",
    price: 600.00, 
    base: false,
    category: "Tratamentos de Canal e Estruturais",
    active: true
  },
  { 
    name: "Pino de Fibra de Vidro (por dente)", 
    description: "Reforço estrutural intra-radicular",
    price: 300.00, 
    base: false,
    category: "Tratamentos de Canal e Estruturais",
    active: true
  },
  { 
    name: "Coroa Provisória (por dente)", 
    description: "Coroa temporária durante o tratamento",
    price: 150.00, 
    base: false,
    category: "Tratamentos de Canal e Estruturais",
    active: true
  },
  
  // Categoria 5 – Manutenção e Follow-up
  { 
    name: "Consulta de Planejamento", 
    description: "Consulta inicial com análise e proposta",
    price: 200.00, 
    base: false,
    category: "Manutenção e Follow-up",
    active: true
  },
  { 
    name: "Retorno e Ajustes (por sessão)", 
    description: "Ajuste oclusal e polimento pós-cimentação",
    price: 150.00, 
    base: false,
    category: "Manutenção e Follow-up",
    active: true
  },
  { 
    name: "Manutenção Anual", 
    description: "Consulta de manutenção preventiva",
    price: 200.00, 
    base: false,
    category: "Manutenção e Follow-up",
    active: true
  },
];

export interface ServicePrice {
  name: string;
  description: string;
  price: number;
  base: boolean;
  category: string;
  active: boolean;
}

export interface Config {
  apiKey: string;
  backendUrl: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  promptTemplate: string;
  servicePrices: ServicePrice[];
  crmEnabled: boolean;
}

export const DEFAULT_PROMPT = `Você é um especialista em design de sorriso digital e odontologia estética.
Aplique facetas dentárias de cerâmica de alta qualidade nesta imagem seguindo estas especificações:

DENTES A MODIFICAR (Sistema FDI):
- Incisivos centrais superiores (11, 21)
- Incisivos laterais superiores (12, 22)

ESPECIFICAÇÕES DAS FACETAS:
- Material: Cerâmica feldspática com técnica estratificada
- Cor: Branco natural (escala Vita A1-A2)
- Translucidez: Bordas incisais com 30-40% de translucidez
- Formato: Levemente arredondado, seguindo anatomia natural
- Textura: Superfície lisa com brilho natural discreto
- Proporção: Largura/altura de 75-80% (proporção áurea)

AJUSTES GENGIVAIS (se necessário):
- Corrigir contorno gengival APENAS se houver assimetria evidente
- Manter proporção natural entre coroa e gengiva
- Preservar papilas interdentais

PRESERVAR COMPLETAMENTE:
- Textura e tom da pele facial
- Estrutura do cabelo e penteado
- Cor e formato dos olhos
- Sobrancelhas e expressão facial
- Barba, bigode ou pelos faciais
- Óculos, joias ou acessórios
- Expressão e emoção do rosto
- Iluminação original e sombras
- Fundo e ambiente da foto
- Formato natural dos lábios
- Características únicas do paciente

RESULTADO ESPERADO:
O resultado deve ser fotorrealista, natural e adequado para apresentação clínica profissional.
Evite efeito artificial ("dentes de chiclete"). Mantenha a identidade do paciente.

---
ANÁLISE QUANTITATIVA OBRIGATÓRIA:

Após processar a imagem, você DEVE especificar EXATAMENTE quantos dentes foram modificados com facetas.

Formato obrigatório de resposta (adicione no final):
DENTES_MODIFICADOS: [número]

Exemplo:
DENTES_MODIFICADOS: 4

Normalmente são modificados os incisivos centrais e laterais superiores (dentes 11, 21, 12, 22), totalizando 4 facetas.
Se a análise visual indicar número diferente, especifique o valor correto.`;

export async function saveConfig(config: Config): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("user_configs")
    .upsert({
      user_id: user.id,
      api_key: config.apiKey,
      backend_url: config.backendUrl,
      temperature: config.temperature,
      top_k: config.topK,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      prompt_template: config.promptTemplate,
      service_prices: config.servicePrices as any,
      crm_enabled: config.crmEnabled,
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function getConfig(): Promise<Config | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_configs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Garantir compatibilidade com dados antigos
  const rawServices = data.service_prices || DEFAULT_SERVICES;
  const servicePrices = (Array.isArray(rawServices) ? rawServices : DEFAULT_SERVICES).map((service: any) => ({
    name: service.name,
    description: service.description || '',
    price: service.price,
    base: service.base || false,
    category: service.category || 'Outros',
    active: service.active !== undefined ? service.active : true,
  }));

  return {
    apiKey: data.api_key,
    backendUrl: data.backend_url,
    temperature: Number(data.temperature),
    topK: data.top_k,
    topP: Number(data.top_p),
    maxTokens: data.max_tokens,
    promptTemplate: data.prompt_template,
    servicePrices,
    crmEnabled: data.crm_enabled !== false,
  };
}

export async function hasConfig(): Promise<boolean> {
  const config = await getConfig();
  return config !== null;
}
