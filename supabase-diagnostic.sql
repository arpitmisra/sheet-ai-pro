-- ================================================
-- DIAGNOSTIC QUERIES - Run these to identify issues
-- Copy results and share if you need help debugging
-- ================================================

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sheets', 'cells')
ORDER BY table_name;

-- 2. Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sheets', 'cells');

-- 3. List all RLS policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename IN ('sheets', 'cells')
ORDER BY tablename, cmd;

-- 4. Check for problematic triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '❌ PROBLEMATIC - SHOULD BE REMOVED'
    ELSE '✅ OK'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'auth' OR event_object_table IN ('sheets', 'cells')
ORDER BY event_object_table;

-- 5. Count sheets per user
SELECT 
  user_id,
  COUNT(*) as sheet_count,
  MAX(updated_at) as last_updated
FROM sheets
GROUP BY user_id;

-- 6. Check for any orphaned cells (cells without sheets)
SELECT 
  COUNT(*) as orphaned_cells
FROM cells c
WHERE NOT EXISTS (
  SELECT 1 FROM sheets s WHERE s.id = c.sheet_id
);

-- 7. Show sample of recent sheets (if any)
SELECT 
  id,
  LEFT(user_id::text, 8) || '...' as user_id_short,
  title,
  created_at,
  updated_at
FROM sheets
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check current database user and permissions
SELECT 
  current_user as db_user,
  session_user,
  current_database() as database,
  version() as postgres_version;

-- ================================================
-- SUMMARY
-- ================================================
DO $$
DECLARE
  sheet_table_exists BOOLEAN;
  cell_table_exists BOOLEAN;
  total_policies INTEGER;
  bad_triggers INTEGER;
BEGIN
  -- Check tables
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sheets'
  ) INTO sheet_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cells'
  ) INTO cell_table_exists;
  
  -- Check policies
  SELECT COUNT(*) INTO total_policies 
  FROM pg_policies 
  WHERE tablename IN ('sheets', 'cells');
  
  -- Check for bad triggers
  SELECT COUNT(*) INTO bad_triggers
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 DIAGNOSTIC SUMMARY';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF sheet_table_exists THEN
    RAISE NOTICE '✅ sheets table exists';
  ELSE
    RAISE NOTICE '❌ sheets table MISSING - run supabase-fix.sql';
  END IF;
  
  IF cell_table_exists THEN
    RAISE NOTICE '✅ cells table exists';
  ELSE
    RAISE NOTICE '❌ cells table MISSING - run supabase-fix.sql';
  END IF;
  
  IF total_policies >= 8 THEN
    RAISE NOTICE '✅ RLS policies configured (% policies)', total_policies;
  ELSE
    RAISE NOTICE '⚠️  Only % RLS policies found (expected 8+) - run supabase-fix.sql', total_policies;
  END IF;
  
  IF bad_triggers > 0 THEN
    RAISE NOTICE '❌ Problematic auth trigger found - run supabase-fix.sql';
  ELSE
    RAISE NOTICE '✅ No problematic triggers';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF sheet_table_exists AND cell_table_exists AND total_policies >= 8 AND bad_triggers = 0 THEN
    RAISE NOTICE '🎉 Database looks good! If still having issues:';
    RAISE NOTICE '   1. Clear browser cache/cookies';
    RAISE NOTICE '   2. Check browser console for errors';
    RAISE NOTICE '   3. Verify .env file has correct credentials';
  ELSE
    RAISE NOTICE '🔧 Issues found! Run supabase-fix.sql to repair';
  END IF;
  
  RAISE NOTICE '';
END $$;
