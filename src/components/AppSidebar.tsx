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
    <div className="flex flex-col h-full w-64 border-r border-sidebar-border bg-sidebar/70 glass-effect shadow-glass">
      {/* Logo */}
      <div className="flex items-center justify-center py-7 px-6">
        <div className="flex items-center gap-3 animate-logo-float">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Smile className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold gradient-text">
            TruSmile
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-1 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={`
              flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium
              transition-all duration-300 ease-out group
              ${isActive(item.url)
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-l-2 border-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1'
              }
            `}
          >
            <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-5 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-primary text-white font-semibold shadow-lg">
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
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
