# 🚀 SheetAI Pro - Phase 1 MVP

A modern, collaborative online spreadsheet platform built with Next.js 14 and Supabase.

## ✨ Features (Phase 1)

### Core Functionality
- ✅ **Interactive Spreadsheet Grid** - 100 rows × 26 columns
- ✅ **Cell Editing** - Click to select, double-click to edit
- ✅ **Formula Engine** - Support for:
  - Mathematical operators: `+`, `-`, `*`, `/`, `%`
  - Functions: `SUM()`, `AVERAGE()`, `COUNT()`, `MIN()`, `MAX()`, `IF()`
  - Cell references: `A1`, `B2`, etc.
  - Range operations: `A1:A10`

### Data Management
- ✅ **Auto-save** - Debounced saves to Supabase (500ms)
- ✅ **PostgreSQL Database** - Reliable data persistence
- ✅ **Sheet Management** - Create, read, update, delete sheets

### Authentication
- ✅ **Email/Password Login** - Standard authentication
- ✅ **Google OAuth** - One-click sign-in
- ✅ **Session Management** - Secure user sessions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (ES6+)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)

### Setup Steps

1. **Clone the repository**
```bash
cd sheet-ai-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Run the SQL in `supabase-setup.sql` in the SQL Editor
   
   c. Enable Google Auth (optional):
      - Go to Authentication > Providers
      - Enable Google provider
      - Add your Google OAuth credentials

4. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

## 📊 Database Schema

### Tables

**users** (managed by Supabase Auth)
- Automatic user management

**sheets**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**cells**
- `id` (uuid, primary key)
- `sheet_id` (uuid, foreign key)
- `row` (integer)
- `col` (integer)
- `value` (text, nullable)
- `formula` (text, nullable)
- `updated_at` (timestamp)
- Unique constraint on `(sheet_id, row, col)`

## 🎯 Usage

### Creating a Spreadsheet
1. Sign up or log in
2. Click "New Sheet" on the dashboard
3. Start editing cells!

### Using Formulas
- Click on a cell
- Type `=` to start a formula
- Example: `=SUM(A1:A10)`
- Press Enter

### Supported Formula Examples
```
=A1+B1
=SUM(A1:A10)
=AVERAGE(B1:B5)
=COUNT(C1:C20)
=MIN(D1:D10)
=MAX(E1:E10)
=IF(A1>100, "High", "Low")
=SUM(A1:A5)*2
=(A1+B1)/2
```

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - Click Deploy

3. **Update Supabase**
   - Add your Vercel URL to Supabase Authentication > URL Configuration
   - Add to "Redirect URLs"

## 📝 Project Structure

```
sheet-ai-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.jsx
│   │   └── sheets/[sheetId]/page.jsx
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   └── spreadsheet/
│       ├── Spreadsheet.jsx
│       └── FormulaBar.jsx
├── lib/
│   ├── supabase/
│   │   └── client.js
│   ├── spreadsheet/
│   │   └── formulaEngine.js
│   └── utils.js
├── store/
│   └── spreadsheetStore.js
└── public/
```

## 🔧 Key Features Explained

### Formula Engine
The formula engine (`lib/spreadsheet/formulaEngine.js`) parses and evaluates formulas:
- Replaces cell references with values
- Evaluates functions
- Handles range operations
- Returns computed results

### Auto-save
Uses debounced saves (500ms delay) to minimize database writes while ensuring data safety.

### State Management
Zustand store manages:
- Cell data
- Selected cell
- Sheet metadata
- Real-time updates

## 🐛 Troubleshooting

### "Invalid Supabase credentials"
- Check your `.env.local` file
- Ensure variables start with `NEXT_PUBLIC_`
- Restart the dev server

### "Sheet not loading"
- Verify Supabase SQL has been run
- Check browser console for errors
- Ensure you're logged in

### "Formulas not working"
- Ensure formula starts with `=`
- Check cell references are valid (A1, B2, etc.)
- Verify syntax: `=SUM(A1:A10)` not `=SUM A1:A10`

## 📚 Next Steps (Future Phases)

- Phase 2: Real-time collaboration
- Phase 3: AI integration
- Phase 4: Advanced features (charts, pivot tables, etc.)

## 🤝 Contributing

This is a hackathon project. Feel free to fork and improve!

## 📄 License

MIT License - feel free to use this project for learning and development.

---

Built with ❤️ using Next.js 14 and Supabase
