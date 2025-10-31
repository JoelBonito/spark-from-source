import { Link, useLocation } from 'react-router-dom';
import { Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardIcon, SimuladorIcon, CRMIcon, PacientesIcon, OrcamentosIcon, ServicosIcon } from '@/components/ui/custom-icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { useConfig } from '@/contexts/ConfigContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logoIcon from '@/assets/trusmile-logo.png';

const allMenuItems = [{
  title: 'Dashboard',
  url: '/',
  icon: DashboardIcon,
  bold: false
}, {
  title: 'Simulador',
  url: '/simulator',
  icon: SimuladorIcon,
  bold: true
}, {
  title: 'CRM',
  url: '/crm',
  icon: CRMIcon,
  bold: true,
  configKey: 'crmEnabled'
}, {
  title: 'Pacientes',
  url: '/patients',
  icon: PacientesIcon,
  bold: false
}, {
  title: 'Orçamentos',
  url: '/budgets',
  icon: OrcamentosIcon,
  bold: false
}, {
  title: 'Serviços',
  url: '/services',
  icon: ServicosIcon,
  bold: false
}, {
  title: 'Configurações',
  url: '/config',
  icon: Settings,
  bold: false
}];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps = {}) {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const { config } = useConfig();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  // Filtrar menu items baseado nas configurações
  const menuItems = allMenuItems.filter(item => {
    if (item.configKey === 'crmEnabled') {
      return config?.crmEnabled !== false;
    }
    return true;
  });
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

  return <div className={`flex flex-col h-full border-r bg-gradient-to-b from-white to-accent/30 dark:from-sidebar dark:to-accent/10 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-center py-6 px-4">
        {isCollapsed ? (
          <img
            src={logoIcon}
            alt="TruSmile"
            className="w-12 h-12 object-contain"
          />
        ) : (
          <Logo variant="compact" width={140} />
        )}
      </div>

      {/* Toggle Button */}
      <div className={`px-3 mb-2 ${isCollapsed ? 'flex justify-center' : 'flex justify-end'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {isCollapsed ? (
          // Modo colapsado - apenas ícones com tooltips
          <TooltipProvider>
            {menuItems.map(item => (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.url}
                    onClick={onNavigate}
                    className={`
                      flex items-center justify-center px-3 py-3 rounded-md transition-colors
                      ${isActive(item.url) ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                    `}
                  >
                    <item.icon className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        ) : (
          // Modo expandido - ícones com texto
          menuItems.map(item => (
            <Link
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${isActive(item.url) ? 'bg-primary/10 text-primary font-semibold' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                ${item.bold ? 'font-bold' : 'font-medium'}
              `}
            >
              <item.icon className="h-6 w-6" />
              {item.title}
            </Link>
          ))
        )}
      </nav>

      {/* Clinic Info */}
      {!isCollapsed && (config?.clinicLogoUrl || config?.clinicName || fullAddress) && (
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
        {isCollapsed ? (
          <TooltipProvider>
            <div className="flex flex-col items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{displayName}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>;
}