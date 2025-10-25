import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smile, Users, History, FileText, Target, Briefcase, FileBadge, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { useConfig } from '@/contexts/ConfigContext';
const menuItems = [{
  title: 'Dashboard',
  url: '/',
  icon: LayoutDashboard,
  bold: false
}, {
  title: 'Simulador',
  url: '/simulator',
  icon: Smile,
  bold: true
}, {
  title: 'CRM',
  url: '/crm',
  icon: Target,
  bold: true
}, {
  title: 'Pacientes',
  url: '/patients',
  icon: Users,
  bold: false
}, {
  title: 'Orçamentos',
  url: '/budgets',
  icon: FileText,
  bold: false
}, {
  title: 'Serviços',
  url: '/services',
  icon: Briefcase,
  bold: false
}, {
  title: 'Configurações',
  url: '/config',
  icon: Settings,
  bold: false
}];
export function AppSidebar() {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const { config } = useConfig();
  const isActive = (path: string) => location.pathname === path;
  
  // Determinar nome a exibir
  const displayName = config?.userName || user?.email?.split('@')[0] || 'Usuário';
  const displayInitials = config?.userName
    ? config.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  // Formatar endereço completo da clínica
  const getFullAddress = () => {
    const parts = [];
    if (config?.clinicAddress) parts.push(config.clinicAddress);
    if (config?.clinicZipCode) parts.push(`CEP ${config.clinicZipCode}`);
    if (config?.clinicCity && config?.clinicState) {
      parts.push(`${config.clinicCity} - ${config.clinicState}`);
    } else if (config?.clinicCity) {
      parts.push(config.clinicCity);
    }
    return parts.join(' • ');
  };

  const fullAddress = getFullAddress();
  return <div className="flex flex-col h-full w-64 border-r bg-gradient-to-b from-white to-accent/30 dark:from-sidebar dark:to-accent/10">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 px-4">
        <Logo variant="compact" width={140} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map(item => <Link key={item.url} to={item.url} className={`
              flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
              ${isActive(item.url) ? 'bg-primary/10 text-primary font-semibold' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
              ${item.bold ? 'font-bold' : 'font-medium'}
            `}>
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>)}
      </nav>

      {/* Clinic Info */}
      {(config?.clinicLogoUrl || config?.clinicName || fullAddress) && (
        <div className="px-4 py-4 border-t bg-accent/5">
          <div className="space-y-3">
            {config?.clinicLogoUrl && (
              <div className="flex justify-center">
                <img
                  src={config.clinicLogoUrl}
                  alt="Logo da clínica"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            {config?.clinicName && (
              <p className="text-xs font-semibold text-center text-foreground">
                {config.clinicName}
              </p>
            )}
            {fullAddress && (
              <p className="text-xs text-center text-muted-foreground line-clamp-3">
                {fullAddress}
              </p>
            )}
          </div>
        </div>
      )}

      {/* User Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate" title={displayName}>
            {displayName}
          </span>
        </div>
        <Button variant="ghost" onClick={signOut} className="w-full justify-start text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>;
}