-- ================================================
-- FIX EXISTING SHEETS - Run this AFTER QUICK-FIX.sql
-- This will fix any sheets created before the collaboration system
-- ================================================

-- Step 1: Check what we have
DO $$
DECLARE
  sheet_count INTEGER;
  collab_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sheet_count FROM sheets;
  SELECT COUNT(*) INTO collab_count FROM sheet_collaborators;
  
  RAISE NOTICE '📊 Current state:';
  RAISE NOTICE '   Sheets: %', sheet_count;
  RAISE NOTICE '   Collaborators: %', collab_count;
  RAISE NOTICE '';
END $$;

-- Step 2: Add missing collaborator entries for existing sheets
-- This will make existing sheets accessible again
INSERT INTO sheet_collaborators (sheet_id, user_id, role, invited_by)
SELECT 
  s.id,
  s.user_id,
  'owner',
  s.user_id
FROM sheets s
WHERE NOT EXISTS (
  SELECT 1 FROM sheet_collaborators sc
  WHERE sc.sheet_id = s.id AND sc.user_id = s.user_id
)
ON CONFLICT (sheet_id, user_id) DO NOTHING;

-- Step 3: Add missing sheet settings for existing sheets
INSERT INTO sheet_settings (sheet_id)
SELECT s.id
FROM sheets s
WHERE NOT EXISTS (
  SELECT 1 FROM sheet_settings ss
  WHERE ss.sheet_id = s.id
)
ON CONFLICT (sheet_id) DO NOTHING;

-- Step 4: Verify the fix
DO $$
DECLARE
  sheet_count INTEGER;
  collab_count INTEGER;
  settings_count INTEGER;
  orphaned_sheets INTEGER;
BEGIN
  SELECT COUNT(*) INTO sheet_count FROM sheets;
  SELECT COUNT(*) INTO collab_count FROM sheet_collaborators;
  SELECT COUNT(*) INTO settings_count FROM sheet_settings;
  
  -- Count sheets without collaborators (should be 0)
  SELECT COUNT(*) INTO orphaned_sheets
  FROM sheets s
  WHERE NOT EXISTS (
    SELECT 1 FROM sheet_collaborators sc
    WHERE sc.sheet_id = s.id
  );
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ EXISTING SHEETS FIXED!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Updated state:';
  RAISE NOTICE '   Sheets: %', sheet_count;
  RAISE NOTICE '   Collaborators: %', collab_count;
  RAISE NOTICE '   Settings: %', settings_count;
  RAISE NOTICE '   Orphaned sheets: %', orphaned_sheets;
  RAISE NOTICE '';
  
  IF orphaned_sheets = 0 THEN
    RAISE NOTICE '✅ All sheets have owners - RLS will work!';
  ELSE
    RAISE NOTICE '⚠️  Some sheets still missing owners';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next: Refresh your browser and try again!';
  RAISE NOTICE '';
END $$;
