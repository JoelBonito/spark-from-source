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
    title: 'Configurações',
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
      {/* Top bar com menu e settings */}
      <div className="h-14 flex items-center justify-between px-4">
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <h1 className="text-xl font-display font-bold">{pageInfo.title}</h1>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={() => navigate('/config')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Description bar (se existir) */}
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
