-- ================================================
-- SHEETAI PRO - DATABASE FIX
-- Run this SQL in your Supabase SQL Editor to fix the 500 error
-- ================================================

-- ================================================
-- STEP 1: Remove problematic trigger causing "Database error saving new user"
-- ================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Also remove any profile-related triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;

-- ================================================
-- STEP 2: Verify and fix sheets table
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own sheets" ON sheets;
DROP POLICY IF EXISTS "Users can create own sheets" ON sheets;
DROP POLICY IF EXISTS "Users can update own sheets" ON sheets;
DROP POLICY IF EXISTS "Users can delete own sheets" ON sheets;

-- Recreate sheets table if needed
CREATE TABLE IF NOT EXISTS sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Sheet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheets_updated_at ON sheets(updated_at DESC);

-- Enable RLS
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for sheets
CREATE POLICY "Users can view own sheets"
  ON sheets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sheets"
  ON sheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheets"
  ON sheets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheets"
  ON sheets
  FOR DELETE
  USING (auth.uid() = user_id);

RAISE NOTICE '✅ Sheets table and policies fixed';

-- ================================================
-- STEP 3: Verify and fix cells table
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own cells" ON cells;
DROP POLICY IF EXISTS "Users can insert own cells" ON cells;
DROP POLICY IF EXISTS "Users can update own cells" ON cells;
DROP POLICY IF EXISTS "Users can delete own cells" ON cells;

-- Recreate cells table if needed
CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row INTEGER NOT NULL CHECK (row >= 0 AND row < 1000),
  col INTEGER NOT NULL CHECK (col >= 0 AND col < 100),
  value TEXT,
  formula TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_cell_position UNIQUE (sheet_id, row, col)
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_cells_sheet_id ON cells(sheet_id);
CREATE INDEX IF NOT EXISTS idx_cells_position ON cells(sheet_id, row, col);

-- Enable RLS
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for cells
CREATE POLICY "Users can view own cells"
  ON cells
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own cells"
  ON cells
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cells"
  ON cells
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own cells"
  ON cells
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND sheets.user_id = auth.uid()
    )
  );

RAISE NOTICE '✅ Cells table and policies fixed';

-- ================================================
-- STEP 4: Verify setup
-- ================================================

-- Count existing sheets
DO $$
DECLARE
  sheet_count INTEGER;
  cell_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sheet_count FROM sheets;
  SELECT COUNT(*) INTO cell_count FROM cells;
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename IN ('sheets', 'cells');
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ DATABASE FIX COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 Sheets in database: %', sheet_count;
  RAISE NOTICE '📝 Cells in database: %', cell_count;
  RAISE NOTICE '🔒 RLS Policies active: %', policy_count;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '   1. Clear your browser cookies/cache';
  RAISE NOTICE '   2. Try Google sign-in again';
  RAISE NOTICE '   3. Create a new sheet from dashboard';
  RAISE NOTICE '';
END $$;
