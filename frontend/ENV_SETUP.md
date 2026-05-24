# Environment Setup Guide

## 📋 Quick Setup

You need to fill in the values in `frontend/.env.local` file.

---

## 🔑 Getting Your API Keys

### 1. Supabase Configuration (REQUIRED)

**Where to get:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your StudentLMS project
3. Navigate to **Settings** → **API**

**Copy these values:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

**⚠️ Important:**

- Project URL format: `https://YOUR_PROJECT_ID.supabase.co`
- The anon/public key is the only key needed for the application

---

### 2. Google OAuth (OPTIONAL - for "Continue with Google" signup)

**What it does:**

- Allows faculty/staff to sign up using their Google account
- Students are redirected to paid registration (no Google signup for students)

**Where to set it up:**

🔗 **See Complete Guide**: [`../GOOGLE_OAUTH_SETUP.md`](../GOOGLE_OAUTH_SETUP.md)

**Quick Summary:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Configure OAuth Consent Screen
5. Create OAuth Client ID (Web application)
6. Get Client ID and Client Secret
7. **Paste credentials in Supabase Dashboard:**
   - Navigate to: **Authentication** → **Providers** → **Google**
   - Toggle **ON**
   - Paste Client ID and Client Secret
   - Click **Save**

**⚠️ Note:** Google OAuth keys are NOT stored in `.env.local`. They go directly in your Supabase Dashboard.

**Important for Redirect URIs:**
When creating OAuth Client ID, add these authorized redirect URIs:

```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

---

## 📝 Step-by-Step Instructions

### Step 1: Open the .env.local file

```bash
cd frontend
# Open .env.local in your code editor
```

### Step 2: Fill in Supabase credentials

1. **Get Project URL:**
   - Supabase Dashboard → Settings → API
   - Copy "Project URL"
   - Paste into: `NEXT_PUBLIC_SUPABASE_URL=`

2. **Get Anon Key:**
   - Same page, under "Project API keys"
   - Copy "anon" key (the public one)
   - Paste into: `NEXT_PUBLIC_SUPABASE_ANON_KEY=`

### Step 3: Save and restart

```bash
# Save the .env.local file
# Stop your dev server (Ctrl+C)
# Start it again
npm run dev
```

---

## ✅ Verification

Your `.env.local` should look like this (with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.ACTUAL_LONG_TOKEN_HERE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

**📝 Note:** Google OAuth credentials are NOT in `.env.local`. They're configured in your **Supabase Dashboard** → **Authentication** → **Providers** → **Google**. See [`../GOOGLE_OAUTH_SETUP.md`](../GOOGLE_OAUTH_SETUP.md) for details.

---

## 🧪 Testing the Connection

### Test 1: Supabase Connection

```bash
# Start dev server
npm run dev

# Open browser console (F12)
# Visit http://localhost:3000
# You should NOT see any Supabase connection errors
```

### Test 2: Admin Login

```bash
# Visit: http://localhost:3000/login
# Login with:
#   Email: StudentLMSofficial@gmail.com
#   Password: StudentLMS@304
# Should successfully log in and redirect to dashboard
```

### Test 3: Check Environment Variables

Open browser console and check:

```javascript
// Should show your Supabase URL
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

---

## ❌ Common Issues

### Issue: "Invalid Supabase URL"

- Check URL format: `https://xxxxx.supabase.co`
- No trailing slash
- Must include `https://`

### Issue: "Invalid API key"

- Make sure you copied the **anon** key (not service_role)
- Key should start with `eyJ...`
- No extra spaces or line breaks

### Issue: "Module not found" after adding env

- Restart your dev server
- Environment variables only load on server start

### Issue: Variables showing as undefined

- Make sure variable names start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after adding variables
- Check for typos in variable names

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** (already in .gitignore)
2. **Use Test keys** for development
3. **Rotate keys** if accidentally exposed
4. **Different keys** for dev/staging/production
5. **Service role key** should NEVER be in frontend

---

## 🚀 Production Environment

When deploying to Vercel, Netlify, or other platforms:

1. **Add environment variables** in hosting platform dashboard
2. **Use production Supabase keys** (from production project)
3. **Update NEXT_PUBLIC_SITE_URL** to your domain
4. **Set NODE_ENV=production**

### Example Production Values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_key_here
NEXT_PUBLIC_SITE_URL=https://StudentLMS.online
NODE_ENV=production
```

---

## 📞 Need Help?

- **Supabase Setup**: See `docs/SETUP_GUIDE.md`
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **Supabase Docs**: https://supabase.com/docs

---

**Ready?** Fill in your `.env.local` file and start your dev server! 🚀
