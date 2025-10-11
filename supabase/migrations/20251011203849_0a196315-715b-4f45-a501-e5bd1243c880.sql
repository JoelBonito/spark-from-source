-- Correção das políticas RLS de INSERT
-- Padronizar sintaxe e nomenclatura para evitar erros

-- Activities
DROP POLICY IF EXISTS "Users create own activities" ON public.activities;
CREATE POLICY "Users can insert own activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "Users create own budgets" ON public.budgets;
CREATE POLICY "Users can insert own budgets"
ON public.budgets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- CRM Leads
DROP POLICY IF EXISTS "Users insert own leads" ON public.crm_leads;
CREATE POLICY "Users can insert own crm_leads"
ON public.crm_leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Leads
DROP POLICY IF EXISTS "Users create own leads" ON public.leads;
CREATE POLICY "Users can insert own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Patients
DROP POLICY IF EXISTS "Users can create own patients" ON public.patients;
CREATE POLICY "Users can insert own patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Reports
DROP POLICY IF EXISTS "Users insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Services
DROP POLICY IF EXISTS "Users create own services" ON public.services;
CREATE POLICY "Users can insert own services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Simulations
DROP POLICY IF EXISTS "Users can insert their own simulations" ON public.simulations;
CREATE POLICY "Users can insert own simulations"
ON public.simulations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User Configs
DROP POLICY IF EXISTS "Users can insert their own config" ON public.user_configs;
CREATE POLICY "Users can insert own config"
ON public.user_configs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User Roles (admin only)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));