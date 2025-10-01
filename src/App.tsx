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
import TechnicalReports from "./pages/TechnicalReports";
import { Patients } from "./pages/Patients";
import { Budgets } from "./pages/Budgets";
import CRM from "./pages/CRM";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/config" element={<Config />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/orcamentos" element={<Budgets />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/relatorios" element={<TechnicalReports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
