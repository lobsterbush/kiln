-- Create a public storage bucket for instructor-uploaded activity media
-- (images, PDFs, documents shown to students alongside prompts).
INSERT INTO storage.buckets (id, name, public)
  VALUES ('activity-media', 'activity-media', true)
  ON CONFLICT (id) DO NOTHING;

-- Allow authenticated instructors to upload files
CREATE POLICY "Instructors can upload activity media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'activity-media');

-- Allow authenticated instructors to update/delete their own uploads
CREATE POLICY "Instructors can manage own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'activity-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read access (students need to see uploaded media)
CREATE POLICY "Anyone can view activity media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'activity-media');
