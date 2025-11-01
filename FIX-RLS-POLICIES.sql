-- ================================================
-- SIMPLIFIED FIX - Better RLS Policies
-- Run this to fix the 500 errors
-- ================================================

-- Drop all existing sheet policies
DROP POLICY IF EXISTS "Users can view own sheets" ON sheets;
DROP POLICY IF EXISTS "Users can view shared sheets" ON sheets;
DROP POLICY IF EXISTS "Users can create own sheets" ON sheets;
DROP POLICY IF EXISTS "Owners can update own sheets" ON sheets;
DROP POLICY IF EXISTS "Owners can delete own sheets" ON sheets;

-- Drop all existing cell policies
DROP POLICY IF EXISTS "Users can view cells of accessible sheets" ON cells;
DROP POLICY IF EXISTS "Editors can insert cells" ON cells;
DROP POLICY IF EXISTS "Editors can update cells" ON cells;
DROP POLICY IF EXISTS "Editors can delete cells" ON cells;

-- ================================================
-- BETTER SHEET POLICIES (handles all cases)
-- ================================================

-- View: Users can see sheets they own OR are collaborators on
CREATE POLICY "Users can view accessible sheets"
  ON sheets FOR SELECT
  USING (
    auth.uid() = user_id  -- Owner
    OR
    EXISTS (  -- Or collaborator
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
    )
  );

-- Insert: Users can create their own sheets
CREATE POLICY "Users can create sheets"
  ON sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update: Only owners can update (via sheet_collaborators)
CREATE POLICY "Owners and editors can update sheets"
  ON sheets FOR UPDATE
  USING (
    auth.uid() = user_id  -- Original owner
    OR
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role IN ('owner', 'editor')
    )
  );

-- Delete: Only owners can delete
CREATE POLICY "Owners can delete sheets"
  ON sheets FOR DELETE
  USING (
    auth.uid() = user_id  -- Original owner
    OR
    EXISTS (
      SELECT 1 FROM sheet_collaborators
      WHERE sheet_collaborators.sheet_id = sheets.id
      AND sheet_collaborators.user_id = auth.uid()
      AND sheet_collaborators.role = 'owner'
    )
  );

-- ================================================
-- BETTER CELL POLICIES (handles all cases)
-- ================================================

-- View: Users can see cells if they can see the sheet
CREATE POLICY "Users can view accessible cells"
  ON cells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND (
        sheets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM sheet_collaborators
          WHERE sheet_collaborators.sheet_id = sheets.id
          AND sheet_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- Insert: Owners and editors can add cells
CREATE POLICY "Owners and editors can insert cells"
  ON cells FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND (
        sheets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM sheet_collaborators
          WHERE sheet_collaborators.sheet_id = sheets.id
          AND sheet_collaborators.user_id = auth.uid()
          AND sheet_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

-- Update: Owners and editors can update cells
CREATE POLICY "Owners and editors can update cells"
  ON cells FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND (
        sheets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM sheet_collaborators
          WHERE sheet_collaborators.sheet_id = sheets.id
          AND sheet_collaborators.user_id = auth.uid()
          AND sheet_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

-- Delete: Owners and editors can delete cells
CREATE POLICY "Owners and editors can delete cells"
  ON cells FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      WHERE sheets.id = cells.sheet_id
      AND (
        sheets.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM sheet_collaborators
          WHERE sheet_collaborators.sheet_id = sheets.id
          AND sheet_collaborators.user_id = auth.uid()
          AND sheet_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

-- ================================================
-- VERIFICATION
-- ================================================

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('sheets', 'cells')
ORDER BY tablename, cmd;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ RLS POLICIES UPDATED!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ New policies handle both:';
  RAISE NOTICE '   • Direct ownership (user_id)';
  RAISE NOTICE '   • Shared access (sheet_collaborators)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next: Refresh browser and try creating a sheet!';
  RAISE NOTICE '';
END $$;
