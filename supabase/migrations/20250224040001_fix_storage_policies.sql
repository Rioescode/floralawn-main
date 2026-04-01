-- Enable storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job photos
CREATE POLICY "Anyone can view job photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job-photos' AND owner = auth.uid())
WITH CHECK (bucket_id = 'job-photos' AND owner = auth.uid());

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-photos' AND owner = auth.uid()); 