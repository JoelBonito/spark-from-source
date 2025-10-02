-- Criar buckets de storage para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('original-images', 'original-images', true),
  ('processed-images', 'processed-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para original-images bucket
CREATE POLICY "Allow authenticated uploads to original-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'original-images');

CREATE POLICY "Allow public reads from original-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'original-images');

CREATE POLICY "Allow authenticated updates to original-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'original-images');

CREATE POLICY "Allow authenticated deletes from original-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'original-images');

-- Policies para processed-images bucket
CREATE POLICY "Allow authenticated uploads to processed-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'processed-images');

CREATE POLICY "Allow public reads from processed-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'processed-images');

CREATE POLICY "Allow authenticated updates to processed-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'processed-images');

CREATE POLICY "Allow authenticated deletes from processed-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'processed-images');