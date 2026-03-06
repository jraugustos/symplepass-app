-- Tabela de parceiros do Clube de Benefícios
CREATE TABLE club_partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_club_partners_active ON club_partners(is_active, sort_order);

-- RLS
ALTER TABLE club_partners ENABLE ROW LEVEL SECURITY;

-- SELECT público (para exibir na página do clube)
CREATE POLICY "Anyone can view active club partners"
  ON club_partners FOR SELECT
  USING (is_active = true);

-- Admins podem ver todos (inclusive inativos)
CREATE POLICY "Admins can view all club partners"
  ON club_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem inserir
CREATE POLICY "Admins can insert club partners"
  ON club_partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem atualizar
CREATE POLICY "Admins can update club partners"
  ON club_partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem deletar
CREATE POLICY "Admins can delete club partners"
  ON club_partners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_club_partners_updated_at_trigger
  BEFORE UPDATE ON club_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket para logos dos parceiros
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-partners', 'club-partners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: qualquer um pode ver logos
CREATE POLICY "Anyone can view club partner logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-partners');

-- Storage policy: admins podem fazer upload de logos
CREATE POLICY "Admins can upload club partner logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'club-partners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Storage policy: admins podem atualizar logos
CREATE POLICY "Admins can update club partner logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'club-partners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Storage policy: admins podem deletar logos
CREATE POLICY "Admins can delete club partner logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'club-partners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE club_partners IS 'Parceiros do Clube de Benefícios Symplepass';
COMMENT ON COLUMN club_partners.logo_url IS 'URL da logo do parceiro no Supabase Storage';
COMMENT ON COLUMN club_partners.is_active IS 'Se true, o parceiro aparece na página pública do clube';
COMMENT ON COLUMN club_partners.sort_order IS 'Ordem de exibição (menor = primeiro)';
