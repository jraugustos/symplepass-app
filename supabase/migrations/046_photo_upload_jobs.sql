-- Migration: Photo Upload Jobs
-- Description: Create table to track bulk photo upload jobs for background processing
-- Created: 2025-01-XX

-- ============================================================
-- TABLE: photo_upload_jobs
-- Description: Tracks bulk photo upload jobs for background processing
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values:
  -- pending: aguardando upload do ZIP
  -- uploading: ZIP sendo enviado
  -- extracting: extraindo arquivos do ZIP
  -- processing: processando fotos
  -- completed: finalizado com sucesso
  -- failed: falhou
  -- cancelled: cancelado pelo usuário

  zip_path TEXT,                          -- caminho do ZIP no bucket temp
  zip_size_bytes BIGINT,                  -- tamanho do ZIP em bytes
  zip_file_name TEXT,                     -- nome original do arquivo ZIP

  total_photos INTEGER DEFAULT 0,         -- total de fotos encontradas no ZIP
  processed_photos INTEGER DEFAULT 0,     -- fotos processadas com sucesso
  failed_photos INTEGER DEFAULT 0,        -- fotos que falharam

  file_list JSONB,                        -- lista ordenada de arquivos de imagem no ZIP (persistida para evitar re-download)

  error_message TEXT,                     -- mensagem de erro principal (se falhou)
  errors JSONB DEFAULT '[]',              -- lista de erros por foto [{fileName, error}]

  started_at TIMESTAMPTZ,                 -- quando começou o processamento
  completed_at TIMESTAMPTZ,               -- quando terminou
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT photo_upload_jobs_status_check CHECK (
    status IN ('pending', 'uploading', 'extracting', 'processing', 'completed', 'failed', 'cancelled')
  )
);

COMMENT ON TABLE photo_upload_jobs IS 'Tracks bulk photo upload jobs for background processing via Edge Functions';
COMMENT ON COLUMN photo_upload_jobs.status IS 'Job status: pending, uploading, extracting, processing, completed, failed, cancelled';
COMMENT ON COLUMN photo_upload_jobs.zip_path IS 'Path to ZIP file in photo-uploads-temp bucket';
COMMENT ON COLUMN photo_upload_jobs.total_photos IS 'Total number of valid image files found in ZIP';
COMMENT ON COLUMN photo_upload_jobs.processed_photos IS 'Number of photos successfully processed';
COMMENT ON COLUMN photo_upload_jobs.failed_photos IS 'Number of photos that failed to process';
COMMENT ON COLUMN photo_upload_jobs.file_list IS 'Ordered JSON array of image file paths in the ZIP, persisted to avoid re-downloading';
COMMENT ON COLUMN photo_upload_jobs.errors IS 'JSON array of errors: [{fileName: string, error: string}]';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_photo_upload_jobs_event_id ON photo_upload_jobs(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_upload_jobs_user_id ON photo_upload_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_upload_jobs_status ON photo_upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_photo_upload_jobs_created_at ON photo_upload_jobs(created_at DESC);
-- Comment 1: Composite index for event listing queries (event_id + created_at desc)
CREATE INDEX IF NOT EXISTS idx_photo_upload_jobs_event_created ON photo_upload_jobs(event_id, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE photo_upload_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see their own jobs, admins see all, organizers see jobs for their events
-- Comment 3: Added organizer access to see jobs for events they organize
CREATE POLICY "photo_upload_jobs_select_policy" ON photo_upload_jobs
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_upload_jobs.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create jobs for themselves
CREATE POLICY "photo_upload_jobs_insert_policy" ON photo_upload_jobs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND
    (
      -- Must be admin or organizer of the event
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = photo_upload_jobs.event_id
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- UPDATE: Users can update their own jobs, admins can update any
CREATE POLICY "photo_upload_jobs_update_policy" ON photo_upload_jobs
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Users can delete their own pending/failed jobs, admins can delete any
CREATE POLICY "photo_upload_jobs_delete_policy" ON photo_upload_jobs
  FOR DELETE USING (
    (user_id = auth.uid() AND status IN ('pending', 'failed', 'cancelled'))
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
CREATE TRIGGER photo_upload_jobs_updated_at
  BEFORE UPDATE ON photo_upload_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_tables_updated_at();
