# Fix Supabase Auth Title - "Sign in to continue to..."

## Problem
When users sign in with Google OAuth, they see:
"Sign in to continue to gkfyapscbtcvrvtrvfus.supabase.co"

Instead of:
"Sign in to continue to Flora Lawn and Landscaping"

## Solution
This is controlled by Supabase Dashboard settings. Follow these steps:

### Step 1: Update Site URL in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your actual domain:
   - Production: `https://floralawn-and-landscaping.com` (or your actual domain)
   - Development: `http://localhost:3000`
5. Click **Save**

### Step 2: Add Redirect URLs

In the same **URL Configuration** section:

1. Add your redirect URLs to **Redirect URLs**:
   - `https://floralawn-and-landscaping.com/auth/callback`
   - `https://floralawn-and-landscaping.com/**` (wildcard for all paths)
   - `http://localhost:3000/auth/callback` (for development)

2. Click **Save**

### Step 3: Update Google OAuth Settings (Optional)

If you want to customize the Google OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Update **Application name** to "Flora Lawn and Landscaping"
5. Update **Application home page** to your domain
6. Save changes

### Step 4: Verify

After making these changes:
1. Clear your browser cache
2. Try signing in again
3. The OAuth page should now show your domain name instead of the Supabase project URL

## Note
The title change may take a few minutes to propagate. If it doesn't update immediately, wait 5-10 minutes and try again.

