import { supabase } from "@/integrations/supabase/client";

export interface Config {
  apiKey: string;
  backendUrl: string;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  promptTemplate: string;
  
  // Dados do usuário
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  
  // Dados da clínica
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicLogoUrl?: string;
  clinicZipCode?: string;
  clinicCity?: string;
  clinicState?: string;
  
  // Módulos
  crmEnabled: boolean;
  facetsSimulatorEnabled?: boolean;
  whiteningSimulatorEnabled?: boolean;
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
      
      // Dados do usuário
      user_name: config.userName || null,
      user_phone: config.userPhone || null,
      user_email: config.userEmail || null,
      
      // Dados da clínica
      clinic_name: config.clinicName || null,
      clinic_address: config.clinicAddress || null,
      clinic_phone: config.clinicPhone || null,
      clinic_email: config.clinicEmail || null,
      clinic_logo_url: config.clinicLogoUrl || null,
      clinic_zip_code: config.clinicZipCode || null,
      clinic_city: config.clinicCity || null,
      clinic_state: config.clinicState || null,
      
      // Módulos
      crm_enabled: config.crmEnabled,
      facets_simulator_enabled: config.facetsSimulatorEnabled ?? true,
      whitening_simulator_enabled: config.whiteningSimulatorEnabled ?? true,
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

  return {
    apiKey: data.api_key,
    backendUrl: data.backend_url,
    temperature: Number(data.temperature),
    topK: data.top_k,
    topP: Number(data.top_p),
    maxTokens: data.max_tokens,
    promptTemplate: data.prompt_template,
    
    // Dados do usuário
    userName: data.user_name || undefined,
    userPhone: data.user_phone || undefined,
    userEmail: data.user_email || undefined,
    
    // Dados da clínica
    clinicName: data.clinic_name || undefined,
    clinicAddress: data.clinic_address || undefined,
    clinicPhone: data.clinic_phone || undefined,
    clinicEmail: data.clinic_email || undefined,
    clinicLogoUrl: data.clinic_logo_url || undefined,
    clinicZipCode: data.clinic_zip_code || undefined,
    clinicCity: data.clinic_city || undefined,
    clinicState: data.clinic_state || undefined,
    
    // Módulos
    crmEnabled: data.crm_enabled !== false,
    facetsSimulatorEnabled: data.facets_simulator_enabled ?? true,
    whiteningSimulatorEnabled: data.whitening_simulator_enabled ?? true,
  };
}

export async function hasConfig(): Promise<boolean> {
  const config = await getConfig();
  return config !== null;
}
