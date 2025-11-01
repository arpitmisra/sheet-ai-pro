-- ================================================
-- PHASE 2: REAL-TIME COLLABORATION FEATURES
-- Run this SQL in Supabase SQL Editor AFTER supabase-setup.sql
-- ================================================

-- ================================================
-- SHEET COLLABORATORS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS sheet_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'owner')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  cursor_position JSONB, -- {row, col, cellRef}
  CONSTRAINT unique_collaborator UNIQUE (sheet_id, user_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_collaborators_sheet_id ON sheet_collaborators(sheet_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON sheet_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_online ON sheet_collaborators(sheet_id, is_online);

-- ================================================
-- CHAT MESSAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_sheet_id ON chat_messages(sheet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- ================================================
-- SHEET SETTINGS TABLE (for permissions)
-- ================================================
CREATE TABLE IF NOT EXISTS sheet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE UNIQUE,
  is_public BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  allow_chat BOOLEAN DEFAULT true,
  allow_voice BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS
ALTER TABLE sheet_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_settings ENABLE ROW LEVEL SECURITY;

-- Sheet Collaborators Policies
CREATE POLICY "Users can view collaborators of sheets they have access to"
  ON sheet_collaborators FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM sheet_collaborators WHERE sheet_id = sheet_collaborators.sheet_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_collaborators.sheet_id
    )
  );

CREATE POLICY "Sheet owners can add collaborators"
  ON sheet_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM sheet_collaborators 
      WHERE sheet_id = sheet_collaborators.sheet_id 
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can update their own presence"
  ON sheet_collaborators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sheet owners can delete collaborators"
  ON sheet_collaborators FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_id
    )
  );

-- Chat Messages Policies
CREATE POLICY "Users can view chat messages of their sheets"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM sheet_collaborators WHERE sheet_id = chat_messages.sheet_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = chat_messages.sheet_id
    )
  );

CREATE POLICY "Collaborators can send chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM sheet_collaborators 
      WHERE sheet_id = chat_messages.sheet_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = chat_messages.sheet_id
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sheet Settings Policies
CREATE POLICY "Users can view settings of their sheets"
  ON sheet_settings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM sheet_collaborators WHERE sheet_id = sheet_settings.sheet_id
    )
  );

CREATE POLICY "Sheet owners can manage settings"
  ON sheet_settings FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM sheets WHERE id = sheet_id
    )
  );

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-update updated_at for sheet_settings
CREATE OR REPLACE FUNCTION update_sheet_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sheet_settings_timestamp
  BEFORE UPDATE ON sheet_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_sheet_settings_timestamp();

-- Function to add owner as collaborator when sheet is created
CREATE OR REPLACE FUNCTION add_owner_as_collaborator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sheet_collaborators (sheet_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  
  INSERT INTO sheet_settings (sheet_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_owner_as_collaborator
  AFTER INSERT ON sheets
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_collaborator();

-- ================================================
-- REALTIME PUBLICATION
-- ================================================

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE sheet_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE cells;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check if tables exist
SELECT 
  'sheet_collaborators' as table_name,
  COUNT(*) as row_count
FROM sheet_collaborators
UNION ALL
SELECT 
  'chat_messages',
  COUNT(*)
FROM chat_messages
UNION ALL
SELECT 
  'sheet_settings',
  COUNT(*)
FROM sheet_settings;

-- ✅ Success! Collaboration features database setup complete!
