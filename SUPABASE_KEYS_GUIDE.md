# Supabase API Keys Setup Guide

## 🔑 Getting Your Real Supabase API Keys

### Step 1: Access Supabase Dashboard
1. Go to **https://supabase.com/dashboard**
2. Sign in to your account
3. Look for your project: **`dvydbgjoagrzgpqdhqoq`** or **FADDL Match**

### Step 2: Navigate to API Settings
1. Click on your project to open it
2. Go to **Settings** (gear icon in sidebar)
3. Click on **API** in the left menu

### Step 3: Copy the Required Keys
You'll need these **2 keys**:

```bash
# Public Key (Safe to expose in frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# This starts with "eyJ" and is several hundred characters long

# Service Role Key (Secret - for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# This also starts with "eyJ" and is several hundred characters long
```

### Step 4: Update Environment File
Once you have the keys, I'll update your `.env.local` file with:

```bash
# Replace these placeholder values:
NEXT_PUBLIC_SUPABASE_ANON_KEY=development_key  → Your real anon key
SUPABASE_SERVICE_ROLE_KEY=development_key      → Your real service role key
```

## 🗄️ What Happens Next

Once you provide the keys, I'll:

1. ✅ Update your environment variables
2. ✅ Apply all 8 database migrations to create tables
3. ✅ Deploy the 5 edge functions
4. ✅ Test the API integration
5. ✅ Verify everything works end-to-end

## 🚨 Security Notes

- **NEVER** commit real API keys to version control
- The **anon key** is safe for frontend use
- The **service role key** must be kept secret
- Both keys are project-specific and cannot be guessed

## 📋 Current Project Details
- **Project ID**: `dvydbgjoagrzgpqdhqoq`
- **Project URL**: `https://dvydbgjoagrzgpqdhqoq.supabase.co`
- **Status**: Project exists, needs database setup

---

**Please get these 2 keys from your Supabase dashboard and share them with me so I can complete the database setup!**