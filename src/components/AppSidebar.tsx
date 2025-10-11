import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Image, Settings, LogOut, FileText, Users, DollarSign, Kanban, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import trusmileLogo from "@/assets/trusmile-logo.png";
import logoDenteAI from "@/assets/logo-dente-ai.png";
import { useConfig } from "@/contexts/ConfigContext";

const menuItems = [
  { title: "Painel", url: "/dashboard", icon: BarChart3 },
  { title: "Simulador", url: "/", icon: Image, highlight: true },
  { title: "CRM", url: "/crm", icon: Kanban, highlight: true },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Orçamentos", url: "/budgets", icon: FileText },
  { title: "Serviços", url: "/services", icon: DollarSign },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const { config, loading: configLoading } = useConfig();
  const collapsed = state === "collapsed";
  
  // Filtrar items baseado em crmEnabled
  const filteredMenuItems = menuItems.filter(item => {
    if (item.title === "CRM") {
      return config?.crmEnabled !== false;
    }
    return true;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        // Extract name from email (part before @)
        const name = session.user.email.split('@')[0];
        setUserName(name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        const name = session.user.email.split('@')[0];
        setUserName(name);
      } else {
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Logo Section */}
        <div className={`flex items-center justify-center py-6 ${collapsed ? 'px-2' : 'px-4'}`}>
          <img 
            src={collapsed ? logoDenteAI : trusmileLogo} 
            alt="TruSmile" 
            className={collapsed ? "h-12" : "h-20 w-auto"}
          />
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className={item.highlight ? "font-bold text-[15px]" : ""}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Info & Logout */}
      <SidebarFooter>
        <SidebarMenu>
          {/* Configurações */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/config")}>
              <Link to="/config">
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Configurações</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* User Info */}
          <SidebarMenuItem>
            <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              {!collapsed && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{userName}</span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
          
          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sair</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
