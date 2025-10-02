-- Add service_prices column to user_configs table
ALTER TABLE public.user_configs 
ADD COLUMN IF NOT EXISTS service_prices JSONB NOT NULL DEFAULT '[
  {"name": "Faceta de Cerâmica Padrão", "price": 700.00, "base": true},
  {"name": "Clareamento Dental Prévio", "price": 800.00, "base": false},
  {"name": "Gengivoplastia", "price": 1200.00, "base": false}
]'::jsonb;