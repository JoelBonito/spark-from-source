import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Smile,
  Users,
  History,
  FileText,
  Target,
  Briefcase,
  FileBadge,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Simulador', url: '/simulator', icon: Smile },
  { title: 'Pacientes', url: '/patients', icon: Users },
  { title: 'Simulações', url: '/simulations', icon: History },
  { title: 'Orçamentos', url: '/budgets', icon: FileText },
  { title: 'CRM', url: '/crm', icon: Target },
  { title: 'Serviços', url: '/services', icon: Briefcase },
  { title: 'Relatórios', url: '/reports', icon: FileBadge },
  { title: 'Configurações', url: '/config', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full w-64 border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 px-4">
        <h1 className="text-2xl font-display font-bold text-primary">
          TruSmile
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive(item.url)
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }
            `}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">
            {user?.email?.split('@')[0]}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
