-- Add technical report columns to simulations table
ALTER TABLE public.simulations
ADD COLUMN IF NOT EXISTS technical_report_url text,
ADD COLUMN IF NOT EXISTS technical_notes text;

-- Create storage bucket for technical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-reports', 'technical-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for technical-reports bucket
CREATE POLICY "Technical reports are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'technical-reports');

CREATE POLICY "Users can upload their own technical reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'technical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own technical reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'technical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own technical reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'technical-reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);