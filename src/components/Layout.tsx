import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useNotifications } from "@/hooks/useNotifications";

export default function Layout({ children }: { children?: React.ReactNode }) {
  // Enable real-time notifications
  useNotifications();
  
  const location = useLocation();
  const isAuthRoute = location.pathname === '/auth';
  
  // Para rotas de auth, retornar apenas os children sem layout
  if (isAuthRoute && children) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fixa em desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 z-40">
        <AppSidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        <AppHeader />
        <main className="p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
