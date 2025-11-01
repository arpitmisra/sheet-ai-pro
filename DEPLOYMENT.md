# 🚀 DEPLOYMENT GUIDE - PHASE 1

This guide will help you deploy **SheetAI Pro Phase 1** to production in under 15 minutes.

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier)
- [ ] Supabase account (free tier)
- [ ] Code pushed to GitHub

---

## 🗄️ STEP 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: `sheetai-pro`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 1.2 Run Database Setup

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content of `supabase-setup.sql`
4. Paste and click "Run"
5. You should see: ✅ Database setup complete!

### 1.3 Get API Credentials

1. Go to **Settings** > **API**
2. Copy and save:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 1.4 Enable Google OAuth (Optional)

1. Go to **Authentication** > **Providers**
2. Find **Google** and enable it
3. Follow instructions to:
   - Create Google OAuth app
   - Add Client ID and Client Secret
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`

---

## 🚀 STEP 2: Deploy to Vercel

### 2.1 Push Code to GitHub

```bash
# Navigate to project
cd sheet-ai-pro

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Phase 1: Initial deployment"

# Create GitHub repo and push
# (Follow GitHub's instructions to create a new repo)
git remote add origin https://github.com/YOUR_USERNAME/sheet-ai-pro.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables** (click "Environment Variables"):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

6. Click "Deploy"
7. Wait 2-3 minutes ☕

### 2.3 Update Supabase with Vercel URL

1. After deployment, copy your Vercel URL (e.g., `https://sheet-ai-pro.vercel.app`)
2. Go back to **Supabase** > **Authentication** > **URL Configuration**
3. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`

---

## ✅ STEP 3: Test Your Deployment

### 3.1 Basic Testing

1. Open your deployed URL
2. Click **"Get Started"** or **"Sign Up"**
3. Create an account with email/password
4. You should be redirected to the dashboard

### 3.2 Spreadsheet Testing

1. Click **"New Sheet"**
2. Try these actions:
   - ✅ Click cells to select
   - ✅ Double-click to edit
   - ✅ Type values and press Enter
   - ✅ Type formulas like `=SUM(A1:A5)`
   - ✅ Changes auto-save (check by refreshing page)

### 3.3 Formula Testing

Try these formulas in different cells:

```
Cell A1: 10
Cell A2: 20
Cell A3: 30
Cell B1: =SUM(A1:A3)     → Should show 60
Cell B2: =AVERAGE(A1:A3) → Should show 20
Cell B3: =MAX(A1:A3)     → Should show 30
Cell C1: =A1+A2          → Should show 30
Cell C2: =IF(A1>15,"High","Low") → Should show "Low"
```

---

## 🐛 Troubleshooting

### Issue: "Invalid API credentials"

**Solution**:
1. Check environment variables in Vercel dashboard
2. Ensure they start with `NEXT_PUBLIC_`
3. Re-deploy after updating

### Issue: "User not found" after login

**Solution**:
1. Check Supabase > Authentication > Users
2. Verify user was created
3. Try signing out and back in

### Issue: Formulas showing "#ERROR"

**Solution**:
1. Check formula syntax starts with `=`
2. Verify cell references are valid (A1, B2, etc.)
3. Check browser console for errors

### Issue: Changes not saving

**Solution**:
1. Check Supabase connection (green indicator in dashboard)
2. Verify RLS policies are set up correctly
3. Check browser network tab for failed requests

### Issue: Can't create new sheets

**Solution**:
1. Verify you're logged in
2. Check Supabase > Table Editor > sheets table
3. Ensure RLS policies allow INSERT

---

## 📊 Monitoring Your App

### Vercel Analytics

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. Monitor:
   - Page views
   - User sessions
   - Performance metrics

### Supabase Monitoring

1. Go to Supabase dashboard
2. Check **"Database"** > **"Reports"**
3. Monitor:
   - Active connections
   - Query performance
   - Storage usage

---

## 🔐 Security Checklist

- [x] Row Level Security (RLS) enabled
- [x] API keys stored in environment variables
- [x] HTTPS enforced (automatic with Vercel)
- [x] User authentication required
- [x] Database access restricted by user

---

## 🎯 Performance Optimization

### Enable Vercel Edge Functions (Optional)

1. In Vercel dashboard, go to project settings
2. Enable "Edge Functions"
3. This deploys your app closer to users globally

### Configure Caching

Already configured in `next.config.mjs`:
- Image optimization
- Static page caching
- API route caching

---

## 📈 Next Steps After Deployment

1. **Share with users**: Send them your Vercel URL
2. **Gather feedback**: What features do they want?
3. **Monitor usage**: Check Vercel analytics
4. **Plan Phase 2**: Real-time collaboration
5. **Plan Phase 3**: AI features

---

## 🆘 Getting Help

### Common Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

### Community Support

- Vercel Discord
- Supabase Discord
- Stack Overflow (tag: next.js, supabase)

---

## 🎉 Congratulations!

Your **SheetAI Pro Phase 1** is now live! 

**URL**: `https://your-app.vercel.app`

You now have a fully functional spreadsheet application with:
- ✅ User authentication
- ✅ Spreadsheet grid (100x26)
- ✅ Formula engine (6 functions)
- ✅ Auto-save
- ✅ Multiple sheets per user
- ✅ Production-ready deployment

**Ready for the hackathon demo!** 🏆

---

## 🔄 Continuous Deployment

Every time you push to GitHub:
1. Vercel automatically detects changes
2. Builds and deploys new version
3. Zero downtime deployment
4. Automatic rollback on errors

To update:
```bash
git add .
git commit -m "Add new feature"
git push
```

Vercel will deploy automatically! 🚀
