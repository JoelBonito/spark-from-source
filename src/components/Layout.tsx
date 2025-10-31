import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useNotifications } from "@/hooks/useNotifications";
import { useSidebar } from '@/contexts/SidebarContext';

export default function Layout({ children }: { children?: React.ReactNode }) {
  // Enable real-time notifications
  useNotifications();

  const location = useLocation();
  const isAuthRoute = location.pathname === '/auth';
  const { isCollapsed } = useSidebar();

  // Para rotas de auth, retornar apenas os children sem layout
  if (isAuthRoute && children) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      {/* Sidebar fixa apenas em desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full z-40">
        <AppSidebar />
      </aside>

      {/* Main content com largura completa e padding dinâmico baseado no estado da sidebar */}
      <div className={`flex-1 w-full min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <AppHeader />
        <main className="p-4 sm:p-6 lg:p-8 w-full">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
