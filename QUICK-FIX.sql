-- ================================================
-- QUICK FIX - Run this FIRST in Supabase SQL Editor
-- This will remove all problematic triggers and tables
-- ================================================

-- Step 1: Remove ALL problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;

-- Step 2: Drop and recreate all tables (clean slate)
DROP TABLE IF EXISTS sheets CASCADE;
DROP TABLE IF EXISTS cells CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS sheet_collaborators CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS sheet_settings CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create sheets table
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Sheet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sheets_user_id ON sheets(user_id);
CREATE INDEX idx_sheets_updated_at ON sheets(updated_at DESC);

-- Step 4: Create cells table
CREATE TABLE cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row INTEGER NOT NULL CHECK (row >= 0 AND row < 1000),
  col INTEGER NOT NULL CHECK (col >= 0 AND col < 100),
  value TEXT,
  formula TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_cell_position UNIQUE (sheet_id, row, col)
);

-- Create indexes
CREATE INDEX idx_cells_sheet_id ON cells(sheet_id);
CREATE INDEX idx_cells_position ON cells(sheet_id, row, col);

-- ================================================
-- STEP 5: Create collaboration tables FIRST (before policies)
-- ================================================

-- Sheet collaborators table (for sharing & permissions)
CREATE TABLE sheet_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  cursor_position JSONB,
  CONSTRAINT unique_collaborator UNIQUE (sheet_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sheet settings table
CREATE TABLE sheet_settings (
  sheet_id UUID PRIMARY KEY REFERENCES sheets(id) ON DELETE CASCADE,
  chat_enabled BOOLEAN DEFAULT true,
  voice_enabled BOOLEAN DEFAULT false,
  allow_anonymous_view BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for collaboration tables
CREATE INDEX idx_collaborators_sheet_id ON sheet_collaborators(sheet_id);
CREATE INDEX idx_collaborators_user_id ON sheet_collaborators(user_id);
CREATE INDEX idx_chat_sheet_id ON chat_messages(sheet_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at DESC);

-- Step 6: Enable RLS and create policies
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_settings ENABLE ROW LEVEL SECURITY;

-- Sheets policies
CREATE POLICY "Users can view own sheets"
  ON sheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared sheets"
  ON sheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own sheets"
  ON sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own sheets"
  ON sheets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete own sheets"
  ON sheets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role = 'owner'
    )
  );

-- Cells policies
CREATE POLICY "Users can view cells of accessible sheets"
  ON cells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = cells.sheet_id
      AND sheet_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can insert cells"
  ON cells FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = cells.sheet_id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can update cells"
  ON cells FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = cells.sheet_id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can delete cells"
  ON cells FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = cells.sheet_id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role IN ('owner', 'editor')
    )
  );

-- Step 7: Create triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sheets_updated_at
  BEFORE UPDATE ON sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update sheet timestamp when cells change
CREATE OR REPLACE FUNCTION update_sheet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sheets
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.sheet_id, OLD.sheet_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sheet_on_cell_change
  AFTER INSERT OR UPDATE OR DELETE ON cells
  FOR EACH ROW
  EXECUTE FUNCTION update_sheet_timestamp();

-- ================================================
-- STEP 8: Collaborators policies
-- ================================================

-- Collaborators policies
CREATE POLICY "Users can view collaborators of their sheets"
  ON sheet_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_collaborators.sheet_id
      AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Sheet owners and editors can add collaborators"
  ON sheet_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_collaborators.sheet_id
      AND sc.user_id = auth.uid()
      AND sc.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Sheet owners can update collaborators"
  ON sheet_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_collaborators.sheet_id
      AND sc.user_id = auth.uid()
      AND sc.role = 'owner'
    )
  );

CREATE POLICY "Sheet owners can remove collaborators"
  ON sheet_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_collaborators.sheet_id
      AND sc.user_id = auth.uid()
      AND sc.role = 'owner'
    )
  );

CREATE POLICY "Users can update their own presence"
  ON sheet_collaborators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chat policies
CREATE POLICY "Collaborators can view chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = chat_messages.sheet_id
      AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can send chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = chat_messages.sheet_id
      AND sc.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Settings policies
CREATE POLICY "Collaborators can view settings"
  ON sheet_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_settings.sheet_id
      AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage settings"
  ON sheet_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sheet_collaborators sc
      WHERE sc.sheet_id = sheet_settings.sheet_id
      AND sc.user_id = auth.uid()
      AND sc.role = 'owner'
    )
  );

-- ================================================
-- STEP 9: Create triggers for collaboration
-- ================================================

-- Auto-add sheet creator as owner
CREATE OR REPLACE FUNCTION add_sheet_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sheet_collaborators (sheet_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  
  INSERT INTO sheet_settings (sheet_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_add_sheet_owner
  AFTER INSERT ON sheets
  FOR EACH ROW
  EXECUTE FUNCTION add_sheet_owner();

-- Update collaborator last_active on chat
CREATE OR REPLACE FUNCTION update_collaborator_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sheet_collaborators
  SET last_active = NOW()
  WHERE sheet_id = NEW.sheet_id
  AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_on_chat
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborator_activity();

-- ================================================
-- STEP 10: Enable Realtime for collaboration tables
-- ================================================

-- Enable realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE sheet_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE cells;

-- ================================================
-- DONE! Test by running these verification queries:
-- ================================================

-- Should return 5 rows (sheets, cells, sheet_collaborators, chat_messages, sheet_settings)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings')
ORDER BY table_name;

-- Should return 12+ policies
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE tablename IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings');

-- Check realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ DATABASE FIX COMPLETE WITH COLLABORATION!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '   1. Clear browser cache/cookies (Ctrl+Shift+Delete)';
  RAISE NOTICE '   2. Refresh your app at http://localhost:3000';
  RAISE NOTICE '   3. Login with email: test10@gmail.com';
  RAISE NOTICE '   4. Click "New Sheet" to create your first sheet';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created:';
  RAISE NOTICE '   • sheets (main spreadsheet data)';
  RAISE NOTICE '   • cells (cell values and formulas)';
  RAISE NOTICE '   • sheet_collaborators (sharing & permissions)';
  RAISE NOTICE '   • chat_messages (team chat)';
  RAISE NOTICE '   • sheet_settings (feature toggles)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Features enabled:';
  RAISE NOTICE '   • Real-time collaboration';
  RAISE NOTICE '   • Team chat';
  RAISE NOTICE '   • Online user presence';
  RAISE NOTICE '   • Share with viewer/editor roles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Try these features:';
  RAISE NOTICE '   1. Create a new sheet';
  RAISE NOTICE '   2. Click "Share" to invite collaborators';
  RAISE NOTICE '   3. Click chat icon to open team chat';
  RAISE NOTICE '   4. See who is online in top-right corner';
  RAISE NOTICE '';
END $$;
