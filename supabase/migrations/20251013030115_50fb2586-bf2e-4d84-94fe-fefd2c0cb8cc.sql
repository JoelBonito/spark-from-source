-- =====================================================
-- ETAPA 1: Adicionar Primary Keys (se não existirem)
-- =====================================================

-- Verificar e adicionar PK em patients
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_pkey' AND conrelid = 'public.patients'::regclass
  ) THEN
    ALTER TABLE public.patients ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Verificar e adicionar PK em leads
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_pkey' AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Verificar e adicionar PK em budgets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'budgets_pkey' AND conrelid = 'public.budgets'::regclass
  ) THEN
    ALTER TABLE public.budgets ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Verificar e adicionar PK em simulations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'simulations_pkey' AND conrelid = 'public.simulations'::regclass
  ) THEN
    ALTER TABLE public.simulations ADD PRIMARY KEY (id);
  END IF;
END $$;

-- =====================================================
-- ETAPA 2: Criar Foreign Keys (NOT VALID)
-- =====================================================

-- FK: leads.patient_id -> patients.id
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_patient_id_fkey;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE SET NULL 
NOT VALID;

-- FK: budgets.patient_id -> patients.id
ALTER TABLE public.budgets 
DROP CONSTRAINT IF EXISTS budgets_patient_id_fkey;

ALTER TABLE public.budgets 
ADD CONSTRAINT budgets_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE SET NULL 
NOT VALID;

-- FK: simulations.patient_id -> patients.id
ALTER TABLE public.simulations 
DROP CONSTRAINT IF EXISTS simulations_patient_id_fkey;

ALTER TABLE public.simulations 
ADD CONSTRAINT simulations_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE SET NULL 
NOT VALID;

-- FK: budgets.simulation_id -> simulations.id
ALTER TABLE public.budgets 
DROP CONSTRAINT IF EXISTS budgets_simulation_id_fkey;

ALTER TABLE public.budgets 
ADD CONSTRAINT budgets_simulation_id_fkey 
FOREIGN KEY (simulation_id) 
REFERENCES public.simulations(id) 
ON DELETE SET NULL 
NOT VALID;

-- FK: crm_leads.patient_id -> patients.id
ALTER TABLE public.crm_leads
DROP CONSTRAINT IF EXISTS crm_leads_patient_id_fkey;

ALTER TABLE public.crm_leads
ADD CONSTRAINT crm_leads_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES public.patients(id)
ON DELETE SET NULL
NOT VALID;

-- FK: crm_leads.simulation_id -> simulations.id
ALTER TABLE public.crm_leads
DROP CONSTRAINT IF EXISTS crm_leads_simulation_id_fkey;

ALTER TABLE public.crm_leads
ADD CONSTRAINT crm_leads_simulation_id_fkey
FOREIGN KEY (simulation_id)
REFERENCES public.simulations(id)
ON DELETE SET NULL
NOT VALID;

-- FK: reports.patient_id -> patients.id
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_patient_id_fkey;

ALTER TABLE public.reports
ADD CONSTRAINT reports_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES public.patients(id)
ON DELETE SET NULL
NOT VALID;

-- FK: reports.simulation_id -> simulations.id
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_simulation_id_fkey;

ALTER TABLE public.reports
ADD CONSTRAINT reports_simulation_id_fkey
FOREIGN KEY (simulation_id)
REFERENCES public.simulations(id)
ON DELETE SET NULL
NOT VALID;

-- FK: activities.lead_id -> leads.id
ALTER TABLE public.activities
DROP CONSTRAINT IF EXISTS activities_lead_id_fkey;

ALTER TABLE public.activities
ADD CONSTRAINT activities_lead_id_fkey
FOREIGN KEY (lead_id)
REFERENCES public.leads(id)
ON DELETE CASCADE
NOT VALID;

-- =====================================================
-- ETAPA 3: Validar Foreign Keys
-- =====================================================

-- Validar leads.patient_id
ALTER TABLE public.leads VALIDATE CONSTRAINT leads_patient_id_fkey;

-- Validar budgets.patient_id
ALTER TABLE public.budgets VALIDATE CONSTRAINT budgets_patient_id_fkey;

-- Validar simulations.patient_id
ALTER TABLE public.simulations VALIDATE CONSTRAINT simulations_patient_id_fkey;

-- Validar budgets.simulation_id
ALTER TABLE public.budgets VALIDATE CONSTRAINT budgets_simulation_id_fkey;

-- Validar crm_leads.patient_id
ALTER TABLE public.crm_leads VALIDATE CONSTRAINT crm_leads_patient_id_fkey;

-- Validar crm_leads.simulation_id
ALTER TABLE public.crm_leads VALIDATE CONSTRAINT crm_leads_simulation_id_fkey;

-- Validar reports.patient_id
ALTER TABLE public.reports VALIDATE CONSTRAINT reports_patient_id_fkey;

-- Validar reports.simulation_id
ALTER TABLE public.reports VALIDATE CONSTRAINT reports_simulation_id_fkey;

-- Validar activities.lead_id
ALTER TABLE public.activities VALIDATE CONSTRAINT activities_lead_id_fkey;

-- =====================================================
-- ETAPA 4: Verificar registros órfãos
-- =====================================================

-- Verificar leads órfãos
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.leads l
  WHERE l.patient_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.patients p WHERE p.id = l.patient_id);
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: % leads com patient_id órfão encontrados', orphan_count;
  ELSE
    RAISE NOTICE '✓ Nenhum lead órfão encontrado';
  END IF;
END $$;

-- Verificar budgets órfãos
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.budgets b
  WHERE b.patient_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.patients p WHERE p.id = b.patient_id);
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: % budgets com patient_id órfão encontrados', orphan_count;
  ELSE
    RAISE NOTICE '✓ Nenhum budget órfão encontrado';
  END IF;
END $$;