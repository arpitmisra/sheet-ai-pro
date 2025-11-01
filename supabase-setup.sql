-- ================================================
-- SHEETAI PRO - DATABASE SETUP
-- Run this SQL in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- SHEETS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Sheet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_sheets_updated_at ON sheets(updated_at DESC);

-- ================================================
-- CELLS TABLE
-- ================================================
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

-- Indexes for faster cell queries
CREATE INDEX IF NOT EXISTS idx_cells_sheet_id ON cells(sheet_id);
CREATE INDEX IF NOT EXISTS idx_cells_position ON cells(sheet_id, row, col);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on sheets table
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sheets
CREATE POLICY "Users can view own sheets"
  ON sheets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own sheets
CREATE POLICY "Users can create own sheets"
  ON sheets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sheets
CREATE POLICY "Users can update own sheets"
  ON sheets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own sheets
CREATE POLICY "Users can delete own sheets"
  ON sheets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on cells table
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view cells of their own sheets
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

-- Policy: Users can insert cells in their own sheets
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

-- Policy: Users can update cells in their own sheets
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

-- Policy: Users can delete cells in their own sheets
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

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sheets table
DROP TRIGGER IF EXISTS update_sheets_updated_at ON sheets;
CREATE TRIGGER update_sheets_updated_at
  BEFORE UPDATE ON sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cells table
DROP TRIGGER IF EXISTS update_cells_updated_at ON cells;
CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update sheet's updated_at when a cell is modified
CREATE OR REPLACE FUNCTION update_sheet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sheets
  SET updated_at = NOW()
  WHERE id = NEW.sheet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update sheet timestamp on cell changes
DROP TRIGGER IF EXISTS update_sheet_on_cell_change ON cells;
CREATE TRIGGER update_sheet_on_cell_change
  AFTER INSERT OR UPDATE OR DELETE ON cells
  FOR EACH ROW
  EXECUTE FUNCTION update_sheet_timestamp();

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Uncomment below to create sample data for testing
-- Note: You need to replace 'YOUR_USER_ID' with an actual user ID from auth.users

/*
-- Create a sample sheet
INSERT INTO sheets (user_id, title) VALUES
  ('YOUR_USER_ID', 'Sample Budget Sheet'),
  ('YOUR_USER_ID', 'Sales Report 2024');

-- Create some sample cells (assuming first sheet ID)
-- You'll need to replace 'SHEET_ID' with actual sheet ID
INSERT INTO cells (sheet_id, row, col, value) VALUES
  ('SHEET_ID', 0, 0, 'Item'),
  ('SHEET_ID', 0, 1, 'Price'),
  ('SHEET_ID', 0, 2, 'Quantity'),
  ('SHEET_ID', 0, 3, 'Total'),
  ('SHEET_ID', 1, 0, 'Laptop'),
  ('SHEET_ID', 1, 1, '999'),
  ('SHEET_ID', 1, 2, '3'),
  ('SHEET_ID', 1, 3, NULL, '=B2*C2'),
  ('SHEET_ID', 2, 0, 'Mouse'),
  ('SHEET_ID', 2, 1, '25'),
  ('SHEET_ID', 2, 2, '10'),
  ('SHEET_ID', 2, 3, NULL, '=B3*C3');
*/

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sheets', 'cells');

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('sheets', 'cells');

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📊 Tables created: sheets, cells';
  RAISE NOTICE '🔒 Row Level Security enabled';
  RAISE NOTICE '🚀 Ready to use!';
END $$;
