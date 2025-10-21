import { useLocation } from 'react-router-dom';
import { Bell, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/simulator': 'Simulador de Sorriso',
  '/patients': 'Pacientes',
  '/patients/new': 'Novo Paciente',
  '/simulations': 'Histórico de Simulações',
  '/budgets': 'Orçamentos',
  '/crm': 'CRM',
  '/crm/new': 'Novo Lead',
  '/services': 'Serviços',
  '/reports': 'Relatórios',
  '/config': 'Configurações',
  '/settings': 'Configurações',
};

export function AppHeader() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b bg-background px-4">
      {/* Mobile Menu */}
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

      {/* Page Title */}
      <h1 className="text-xl font-display font-bold">{title}</h1>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
