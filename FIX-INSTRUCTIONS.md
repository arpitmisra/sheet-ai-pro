# 🔧 Database Fix Instructions

## Problem
Getting **500 Internal Server Error** when trying to access sheets, and **"Database error saving new user"** during Google OAuth sign-in.

## Root Cause
A problematic database trigger `handle_new_user()` is causing failures when new users try to sign in.

---

## ✅ Solution - Follow These Steps:

### Step 1: Run the Fix SQL
1. Open your Supabase project: **https://supabase.com/dashboard/project/syubohbjikkajtiysmvw**
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy **ALL** the contents from `supabase-fix.sql` file
5. Paste into the SQL Editor
6. Click **"Run"** (or press F5)
7. Wait for the success messages

You should see:
```
✅ Removed problematic auth trigger
✅ Sheets table and policies fixed
✅ Cells table and policies fixed
✅ DATABASE FIX COMPLETE!
```

### Step 2: Clear Browser Data
1. Press **Ctrl + Shift + Delete** (Chrome/Edge) or **Ctrl + Shift + Del** (Firefox)
2. Select **"Cookies and other site data"**
3. Select **"Cached images and files"**
4. Click **"Clear data"**

OR simply open an **Incognito/Private window**

### Step 3: Test the Application
1. Go to **http://localhost:3000**
2. Click **"Sign in with Google"**
3. Complete Google OAuth
4. You should now land on the **Dashboard**
5. Click **"New Sheet"** to create your first spreadsheet

---

## 🧪 Verification

After running the fix, verify in Supabase:

### Check Tables Exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sheets', 'cells');
```

Should return:
- sheets
- cells

### Check RLS Policies:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('sheets', 'cells');
```

Should show 8 policies (4 for sheets, 4 for cells)

---

## 🚨 If Still Not Working

### Check Authentication:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any errors
4. Share the error messages

### Check Database Connection:
```sql
SELECT current_user, session_user;
```

### Check User Session:
Open DevTools → Application → Local Storage → Check for `supabase.auth.token`

---

## 📝 What the Fix Does

1. **Removes the problematic trigger** that was blocking user sign-ups
2. **Recreates sheets and cells tables** with proper structure
3. **Sets up Row Level Security (RLS)** so users can only access their own data
4. **Creates proper indexes** for faster queries
5. **Verifies everything is working** with diagnostic queries

---

## ✅ Expected Result

After fix:
- ✅ Google OAuth works without errors
- ✅ Redirects to dashboard after sign-in
- ✅ Can create new sheets
- ✅ Can edit cells in spreadsheet
- ✅ Auto-save works
- ✅ No more 500 errors

---

## 🆘 Need More Help?

If you still see errors:
1. Share the **exact error message** from browser console
2. Share the **result** of running the fix SQL
3. Check **Supabase Logs**: Dashboard → Logs → select "Database" and "API"
