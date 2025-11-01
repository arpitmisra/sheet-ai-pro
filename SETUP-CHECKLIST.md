# 🔧 SETUP CHECKLIST - Manual Configuration Required

This document lists **ALL** files and configurations that need manual updates to make the app fully functional.

---

## ✅ Current Status

**Already Configured:**
- ✅ `.env` - Supabase credentials are set up
- ✅ Dependencies installed (`npm install` completed)

**Needs Configuration:**
- ❌ Supabase Database (SQL schema)
- ❌ Google OAuth Provider
- ❌ Supabase Auth Settings
- ❌ Production Environment Variables (when deploying)

---

## 📋 STEP-BY-STEP CHECKLIST

### 1️⃣ SUPABASE DATABASE SETUP (REQUIRED)

**Status:** ❌ **NOT DONE** - Database tables don't exist yet

**Action Required:**
1. Go to your Supabase project: https://supabase.com/dashboard/project/syubohbjikkajtiysmvw
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy **ALL** contents from: `supabase-setup.sql`
5. Paste into SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`
7. Wait for success message: ✅ Success. No rows returned

**What This Does:**
- Creates `sheets` table (stores user spreadsheets)
- Creates `cells` table (stores cell data)
- Sets up Row Level Security (RLS) policies
- Creates triggers for auto-updating timestamps
- Adds performance indexes

**File:** `c:\Users\Arpit Mishra\OneDrive\Desktop\clueLessCoders\sheet-ai-pro\supabase-setup.sql`

**Verification:**
After running SQL, check:
1. Go to **Table Editor** in Supabase
2. You should see two tables: `sheets` and `cells`
3. Click on each table to verify columns exist

---

### 2️⃣ GOOGLE OAUTH SETUP (REQUIRED FOR GOOGLE SIGN-IN)

**Status:** ❌ **NOT CONFIGURED** - Google sign-in won't work yet

**Why It's Not Working:**
Your `.env` file is configured, but Supabase doesn't have Google OAuth enabled yet.

#### Step 2A: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **"Create Credentials"** > **"OAuth client ID"**
5. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **SheetAI Pro**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** (skip scopes, test users)
6. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: **SheetAI Pro - Supabase**
   - Authorized redirect URIs: Add this EXACT URL:
     ```
     https://syubohbjikkajtiysmvw.supabase.co/auth/v1/callback
     ```
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

#### Step 2B: Configure Supabase

1. Go to Supabase: https://supabase.com/dashboard/project/syubohbjikkajtiysmvw
2. Navigate to **Authentication** > **Providers** (left sidebar)
3. Find **Google** in the list
4. Toggle it **ON** (enable)
5. Paste your **Client ID** from Google
6. Paste your **Client Secret** from Google
7. Click **Save**

#### Step 2C: Update Google Cloud Console (After First Login)

After enabling in Supabase, add these to **Authorized redirect URIs** in Google Cloud Console:
```
https://syubohbjikkajtiysmvw.supabase.co/auth/v1/callback
http://localhost:3000/dashboard
```

**Files Using Google OAuth:**
- `app/(auth)/login/page.jsx` - Line 34-38 (handleGoogleSignIn function)
- `app/(auth)/register/page.jsx` - Line 49-53 (handleGoogleSignIn function)
- `lib/supabase/client.js` - Line 52-59 (signInWithGoogle function)

**No Code Changes Needed** - Just enable in Supabase dashboard!

---

### 3️⃣ SUPABASE AUTH CONFIGURATION

**Status:** ⚠️ **CHECK REQUIRED**

**Action Required:**
1. Go to: https://supabase.com/dashboard/project/syubohbjikkajtiysmvw
2. Navigate to **Authentication** > **URL Configuration**
3. Verify/Update these settings:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:** Add these URLs (one per line):
```
http://localhost:3000
http://localhost:3000/dashboard
http://localhost:3000/auth/callback
https://syubohbjikkajtiysmvw.supabase.co/auth/v1/callback
```

4. Navigate to **Authentication** > **Email Templates**
5. Optional: Customize confirmation email template

**What This Fixes:**
- Proper redirects after login
- Email confirmation links work correctly
- OAuth redirects function properly

---

### 4️⃣ ENVIRONMENT VARIABLES FOR PRODUCTION

**Status:** ✅ **Local Environment OK** | ❌ **Production Not Set**

**Current `.env` File (Local Development):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://syubohbjikkajtiysmvw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**✅ These are correct for local development!**

#### When Deploying to Vercel:

**Action Required:**
1. After deploying to Vercel, copy your production URL (e.g., `https://sheet-ai-pro.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. Add all three environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` (same as local)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as local)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)

4. Update Supabase **Site URL** to your production URL
5. Add production URL to Supabase **Redirect URLs**
6. Add production URL to Google Cloud Console **Authorized redirect URIs**

**Files That Use These:**
- `lib/supabase/client.js` - All Supabase operations
- All authentication pages
- All dashboard pages

---

### 5️⃣ OPTIONAL: IMAGE DOMAIN CONFIGURATION

**Status:** ✅ **Pre-configured** (No action needed)

**Already Set in `next.config.mjs`:**
```javascript
images: {
  domains: ['lh3.googleusercontent.com'],
}
```

This allows Google profile pictures to display. No changes needed.

---

## 🧪 TESTING CHECKLIST

After completing steps 1-3, test these features:

### Test 1: Email/Password Authentication
```
1. Run: npm run dev
2. Go to: http://localhost:3000
3. Click "Sign Up"
4. Register with email/password
5. Check Supabase > Authentication > Users
6. ✅ User should appear in list
7. Login with same credentials
8. ✅ Should redirect to /dashboard
```

### Test 2: Google OAuth
```
1. On login page, click "Continue with Google"
2. Select Google account
3. ✅ Should redirect to /dashboard
4. Check Supabase > Authentication > Users
5. ✅ User should appear with Google provider
```

### Test 3: Spreadsheet Creation
```
1. On dashboard, click "New Sheet"
2. ✅ New sheet should appear in list
3. Click on sheet to open
4. ✅ Should see 100x26 grid
```

### Test 4: Cell Editing & Formulas
```
1. Click cell A1, type "10", press Enter
2. Click cell A2, type "20", press Enter
3. Click cell A3, type "=SUM(A1:A2)", press Enter
4. ✅ Cell A3 should show "30"
5. Refresh page
6. ✅ Values should persist (auto-save working)
```

### Test 5: Sheet Management
```
1. Create 2-3 sheets
2. Click rename button, change title
3. ✅ Title should update
4. Click delete button
5. ✅ Sheet should be removed
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Invalid API credentials"
**Fix:** Check that `.env` file exists with correct Supabase URL and key

### Issue: Google sign-in button doesn't work
**Fix:** Complete Step 2 (Google OAuth Setup)

### Issue: Can't create sheets / "User not found"
**Fix:** Complete Step 1 (Supabase Database Setup)

### Issue: Changes don't save
**Fix:** 
1. Check browser console for errors
2. Verify database setup (Step 1)
3. Check RLS policies in Supabase

### Issue: After login, stuck on login page
**Fix:** 
1. Check Step 3 (Supabase Auth Configuration)
2. Verify redirect URLs are correct
3. Check browser console for redirect errors

### Issue: Formulas show "#ERROR"
**Fix:** 
1. Check formula syntax (must start with `=`)
2. Verify cell references are valid (A1, B2, etc.)
3. Check browser console for calculation errors

---

## 📊 CONFIGURATION STATUS SUMMARY

| Component | Status | Required For | Estimated Time |
|-----------|--------|--------------|----------------|
| `.env` file | ✅ Done | All features | - |
| Database Schema | ❌ TODO | All features | 2 minutes |
| Google OAuth | ❌ TODO | Google sign-in | 10 minutes |
| Auth URLs | ⚠️ Check | Redirects | 2 minutes |
| Vercel Deploy | ⏳ Later | Production | 5 minutes |

**Total Setup Time:** ~20 minutes

---

## ✅ FINAL VERIFICATION

Before deploying to production, verify:

- [ ] Step 1: Database tables created (sheets, cells)
- [ ] Step 2: Google OAuth enabled in Supabase
- [ ] Step 3: Auth redirect URLs configured
- [ ] Test 1: Email registration works
- [ ] Test 2: Google login works
- [ ] Test 3: Can create sheets
- [ ] Test 4: Formulas calculate correctly
- [ ] Test 5: Auto-save persists data

**When all checked, you're ready to deploy!** 🚀

---

## 📞 NEXT STEPS

1. **Complete Step 1 (Database)** - 2 minutes - **REQUIRED**
2. **Complete Step 2 (Google OAuth)** - 10 minutes - **REQUIRED for Google sign-in**
3. **Verify Step 3 (Auth URLs)** - 2 minutes - **REQUIRED**
4. **Test locally** - 5 minutes
5. **Deploy to Vercel** - Follow `DEPLOYMENT.md`

**Most Critical:** Step 1 (Database Setup) - Nothing will work without this!

Good luck! 🎉
