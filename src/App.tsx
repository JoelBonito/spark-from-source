import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/use-auth';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { useNotifications } from '@/hooks/useNotifications';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Index'));
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));
const SimulatorPage = lazy(() => import('@/pages/simulator/SimulatorPage'));
const PatientsPage = lazy(() => import('@/pages/Patients'));
const NewPatientPage = lazy(() => import('@/pages/patients/NewPatientPage'));
const PatientDetailPage = lazy(() => import('@/pages/patients/PatientDetailPage'));
const SimulationsHistoryPage = lazy(() => import('@/pages/simulations/SimulationsHistoryPage'));
const SimulationDetailPage = lazy(() => import('@/pages/simulations/SimulationDetailPage'));
const BudgetsPage = lazy(() => import('@/pages/Budgets').then(m => ({ default: m.Budgets })));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const CrmPage = lazy(() => import('@/pages/CRM'));
const NewLeadPage = lazy(() => import('@/pages/crm/NewLeadPage'));
const LeadDetailPage = lazy(() => import('@/pages/crm/LeadDetailPage'));
const EditLeadPage = lazy(() => import('@/pages/crm/EditLeadPage'));
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'));
const ConfigPage = lazy(() => import('@/pages/config/ConfigPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/auth',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'simulator',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SimulatorPage />
          </Suspense>
        ),
      },
      {
        path: 'patients',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PatientsPage />
          </Suspense>
        ),
      },
      {
        path: 'patients/new',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NewPatientPage />
          </Suspense>
        ),
      },
      {
        path: 'patients/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PatientDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'simulations',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SimulationsHistoryPage />
          </Suspense>
        ),
      },
      {
        path: 'simulations/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SimulationDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'budgets',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BudgetsPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'crm',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CrmPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/new',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NewLeadPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LeadDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'crm/:id/edit',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EditLeadPage />
          </Suspense>
        ),
      },
      {
        path: 'services',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ServicesPage />
          </Suspense>
        ),
      },
      {
        path: 'config',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ConfigPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

function AppContent() {
  useNotifications();
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfigProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </ConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
