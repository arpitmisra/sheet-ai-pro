# 🔍 How to Debug the 500 Errors

## Step 1: Run Diagnostic SQL

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/syubohbjikkajtiysmvw/sql/new

2. Copy and run **`DIAGNOSE-ERRORS.sql`**

3. Share the full output with me (copy everything from the Results panel)

## Step 2: Check Supabase Logs

1. In Supabase Dashboard, go to **Logs** (left sidebar)

2. Click on **API** tab

3. Look for recent 500 errors

4. Click on an error to see details

5. Share the error message and stack trace

## Step 3: Check Browser Network Tab

1. Open browser DevTools (F12)

2. Go to **Network** tab

3. Filter by "sheets"

4. Click on a failed request (red, 500 status)

5. Go to **Response** tab

6. Share the error message

---

## Common Causes of 500 Errors

### 1. Trigger Function Failing
**Problem:** The `add_sheet_owner()` function tries to insert into `sheet_collaborators` but fails

**Check:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'auto_add_sheet_owner';
```

**Fix:** Disable the trigger temporarily
```sql
DROP TRIGGER IF EXISTS auto_add_sheet_owner ON sheets;
```

### 2. RLS Policy Too Restrictive
**Problem:** The policy blocks even the owner from seeing their own data

**Check:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'sheets';
```

**Fix:** Temporarily disable RLS
```sql
ALTER TABLE sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;
```

### 3. Missing Function
**Problem:** A trigger calls a function that doesn't exist

**Check:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### 4. Circular Dependency
**Problem:** Trigger on sheets calls function that queries sheet_collaborators, which has RLS requiring sheets

---

## Quick Emergency Fix

If you just want to get it working RIGHT NOW:

```sql
-- Disable all RLS temporarily
ALTER TABLE sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_settings DISABLE ROW LEVEL SECURITY;

-- Drop all triggers
DROP TRIGGER IF EXISTS auto_add_sheet_owner ON sheets;
DROP TRIGGER IF EXISTS update_sheets_updated_at ON sheets;
DROP TRIGGER IF EXISTS update_cells_updated_at ON cells;
DROP TRIGGER IF EXISTS update_sheet_on_cell_change ON cells;
DROP TRIGGER IF EXISTS update_activity_on_chat ON chat_messages;
```

This will make everything work (but without security). Then we can re-enable RLS properly.

---

## Let's Debug Together

**Run `DIAGNOSE-ERRORS.sql` and share the output!**

I'll analyze it and give you the exact fix needed.
