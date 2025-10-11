import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Config from "./pages/Config";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Patients } from "./pages/Patients";
import CRM from "./pages/CRM";
import Dashboard from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { Budgets } from "./pages/Budgets";
import { ConfigProvider, useConfig } from "./contexts/ConfigContext";

const queryClient = new QueryClient();

function AppRoutes() {
  const { config, loading } = useConfig();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/services" element={<Services />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="/config" element={<Config />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/pacientes" element={<Patients />} />
      {config?.crmEnabled !== false && (
        <Route path="/crm" element={<CRM />} />
      )}
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
