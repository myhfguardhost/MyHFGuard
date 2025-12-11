# Quick Fix: Render Using Wrong Repository

## The Problem
Render is pulling from a different GitHub repo, so it's running old code that references `date_of_birth`.

## Immediate Fix (5 minutes)

### Step 1: Push Current Code to GitHub
```bash
cd C:\Users\acyp2\OneDrive\Desktop\MyHFGuard-1

# If git not initialized
git init
git add .
git commit -m "Fix: Use dob instead of date_of_birth"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Update Render Repository
1. Go to **https://dashboard.render.com**
2. Click your service (vitalink server)
3. Go to **Settings** → **Repository**
4. Click **"Connect a different repository"**
5. Select your **new/correct repository**
6. Set **Root Directory** to: `vitalink/server`
7. Click **Save**

### Step 3: Force Redeploy
1. Go to **Manual Deploy** tab
2. Click **"Clear build cache & deploy"**
3. Wait 5-10 minutes

### Step 4: Test
```bash
curl https://vitalink-n78f.onrender.com/health
```

Should return: `ok`

## Verify Fix

After deployment, check Render logs. You should see:
- ✅ Server started
- ✅ No errors about `date_of_birth`
- ✅ Connected to Supabase

Then try registration in the app again.

