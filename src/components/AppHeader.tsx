import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import NotificationBell from './notifications/NotificationBell';

const PAGE_INFO: Record<string, { title: string; description?: string }> = {
  '/': { 
    title: 'Dashboard',
    description: 'Visão geral do sistema'
  },
  '/simulator': { 
    title: 'Simulador de Sorriso',
    description: 'Crie simulações de facetas e clareamento'
  },
  '/patients': { 
    title: 'Pacientes',
    description: 'Gerencie todos os seus pacientes'
  },
  '/patients/new': { 
    title: 'Novo Paciente',
    description: 'Cadastre um novo paciente'
  },
  '/budgets': { 
    title: 'Orçamentos',
    description: 'Gerencie todos os orçamentos gerados'
  },
  '/crm': { 
    title: 'CRM',
    description: 'Gerencie seus leads desde a simulação até o fechamento'
  },
  '/crm/new': { 
    title: 'Novo Lead',
    description: 'Cadastre um novo lead no pipeline'
  },
  '/services': { 
    title: 'Serviços',
    description: 'Gerencie os serviços oferecidos pela clínica'
  },
  '/config': {
    title: 'Configurações do Sistema',
    description: 'Gerencie suas chaves de API e parâmetros'
  },
  '/settings': { 
    title: 'Configurações',
    description: 'Ajuste as configurações do sistema'
  },
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageInfo = PAGE_INFO[location.pathname] || { title: 'Dashboard' };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur-sm">
      <div className="h-14 flex items-center justify-between px-4 gap-4">
        {/* Menu hamburguer apenas no mobile */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Título centralizado no mobile, à esquerda no desktop */}
        <h1 className="text-lg lg:text-xl font-display font-bold flex-1 lg:flex-none truncate">
          {pageInfo.title}
        </h1>

        {/* Ações do header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/config')}
            aria-label="Configurações"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Barra de descrição */}
      {pageInfo.description && (
        <div className="px-4 py-2 border-t border-primary/10 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {pageInfo.description}
          </p>
        </div>
      )}
    </header>
  );
}
