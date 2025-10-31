import React, { createContext, useContext, useState, useEffect } from 'react';
import { getConfig, Config } from '@/utils/storage';
import { useAuth } from '@/hooks/use-auth';

interface ConfigContextType {
  config: Config | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshConfig = async () => {
    try {
      const loadedConfig = await getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar configurações quando o usuário mudar (login/logout)
  useEffect(() => {
    if (user) {
      // Usuário fez login - carregar configurações
      refreshConfig();
    } else {
      // Usuário fez logout - limpar configurações
      setConfig(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  }
  return context;
}
