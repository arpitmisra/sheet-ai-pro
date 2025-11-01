-- ================================================
-- COMPREHENSIVE DIAGNOSTIC - Find the exact problem
-- ================================================

-- 1. Check if all tables exist
DO $$
DECLARE
  tables_exist TEXT[];
  tables_missing TEXT[];
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '1️⃣  CHECKING TABLES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  SELECT ARRAY_AGG(table_name::TEXT) INTO tables_exist
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings');
  
  RAISE NOTICE 'Tables found: %', COALESCE(array_to_string(tables_exist, ', '), 'NONE');
  RAISE NOTICE '';
END $$;

-- 2. Check RLS status
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings')
ORDER BY tablename;

-- 3. List all RLS policies
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '2️⃣  RLS POLICIES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ PERMISSIVE'
    ELSE '⚠️ RESTRICTIVE'
  END as type
FROM pg_policies 
WHERE tablename IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings')
ORDER BY tablename, cmd;

-- 4. Count data in each table
DO $$
DECLARE
  sheet_count INTEGER;
  cell_count INTEGER;
  collab_count INTEGER;
  chat_count INTEGER;
  settings_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '3️⃣  DATA COUNTS (as superuser)';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  SELECT COUNT(*) INTO sheet_count FROM sheets;
  SELECT COUNT(*) INTO cell_count FROM cells;
  SELECT COUNT(*) INTO collab_count FROM sheet_collaborators;
  SELECT COUNT(*) INTO chat_count FROM chat_messages;
  SELECT COUNT(*) INTO settings_count FROM sheet_settings;
  
  RAISE NOTICE 'Sheets: %', sheet_count;
  RAISE NOTICE 'Cells: %', cell_count;
  RAISE NOTICE 'Collaborators: %', collab_count;
  RAISE NOTICE 'Chat messages: %', chat_count;
  RAISE NOTICE 'Sheet settings: %', settings_count;
  RAISE NOTICE '';
END $$;

-- 5. Check for orphaned data
DO $$
DECLARE
  orphaned_cells INTEGER;
  orphaned_collabs INTEGER;
  orphaned_chats INTEGER;
  sheets_without_owner INTEGER;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '4️⃣  ORPHANED DATA CHECK';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Cells without sheets
  SELECT COUNT(*) INTO orphaned_cells
  FROM cells c
  WHERE NOT EXISTS (SELECT 1 FROM sheets s WHERE s.id = c.sheet_id);
  
  -- Collaborators without sheets
  SELECT COUNT(*) INTO orphaned_collabs
  FROM sheet_collaborators sc
  WHERE NOT EXISTS (SELECT 1 FROM sheets s WHERE s.id = sc.sheet_id);
  
  -- Chat without sheets
  SELECT COUNT(*) INTO orphaned_chats
  FROM chat_messages cm
  WHERE NOT EXISTS (SELECT 1 FROM sheets s WHERE s.id = cm.sheet_id);
  
  -- Sheets without owner in collaborators
  SELECT COUNT(*) INTO sheets_without_owner
  FROM sheets s
  WHERE NOT EXISTS (
    SELECT 1 FROM sheet_collaborators sc
    WHERE sc.sheet_id = s.id AND sc.role = 'owner'
  );
  
  RAISE NOTICE 'Orphaned cells: %', orphaned_cells;
  RAISE NOTICE 'Orphaned collaborators: %', orphaned_collabs;
  RAISE NOTICE 'Orphaned chat messages: %', orphaned_chats;
  RAISE NOTICE 'Sheets without owner: % ⚠️', sheets_without_owner;
  RAISE NOTICE '';
END $$;

-- 6. Check triggers
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '5️⃣  TRIGGERS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

SELECT 
  trigger_name,
  event_object_table as "table",
  action_timing as "when",
  event_manipulation as event,
  action_statement as function
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages')
ORDER BY event_object_table, trigger_name;

-- 7. Check functions that might be failing
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '6️⃣  FUNCTIONS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️ DEFINER'
    ELSE '✅ INVOKER'
  END as security
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_sheet_owner', 'update_sheet_timestamp', 'update_collaborator_activity', 'update_updated_at_column')
ORDER BY routine_name;

-- 8. Test insert permission as authenticated user
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '7️⃣  TESTING PERMISSIONS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'Note: This runs as superuser, so we can see everything';
  RAISE NOTICE 'The actual API calls run as authenticated user';
  RAISE NOTICE '';
END $$;

-- 9. Check if there are any problematic constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('sheets', 'cells', 'sheet_collaborators', 'chat_messages', 'sheet_settings')
ORDER BY tc.table_name, tc.constraint_type;

-- 10. Summary and recommendations
DO $$
DECLARE
  sheet_policies INTEGER;
  cell_policies INTEGER;
  has_auto_owner_trigger BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '8️⃣  SUMMARY';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  SELECT COUNT(*) INTO sheet_policies FROM pg_policies WHERE tablename = 'sheets';
  SELECT COUNT(*) INTO cell_policies FROM pg_policies WHERE tablename = 'cells';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'auto_add_sheet_owner'
  ) INTO has_auto_owner_trigger;
  
  RAISE NOTICE 'Sheet policies: %', sheet_policies;
  RAISE NOTICE 'Cell policies: %', cell_policies;
  RAISE NOTICE 'Auto-add owner trigger: %', CASE WHEN has_auto_owner_trigger THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '';
  
  -- Recommendations
  RAISE NOTICE '💡 RECOMMENDATIONS:';
  
  IF sheet_policies = 0 THEN
    RAISE NOTICE '   ❌ No policies on sheets table - run FIX-RLS-POLICIES.sql';
  END IF;
  
  IF NOT has_auto_owner_trigger THEN
    RAISE NOTICE '   ❌ Missing auto_add_sheet_owner trigger - run QUICK-FIX.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
