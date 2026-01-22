# Deployment & Server Setup Guide

This guide explains how to push your code to GitHub, deploy it to a live server, and set up a real database.

## Phase 1: Push to GitHub

Your code is already initialized as a Git repository. Follow these steps to push it to the cloud.

1.  **Create a New Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new)
    *   Name it `cinetracker`
    *   **Do not** check "Initialize with README" or ".gitignore" (we already have them).
    *   Click **Create repository**.

2.  **Link and Push**
    *   Run these commands in your terminal (replace `YOUR_USERNAME` with your actual GitHub username):
    ```bash
    git remote add origin https://github.com/kaushik-reddy/CineTracker.git
    git branch -M main
    git push -u origin main
    ```

---

## Phase 2: Deploy to Server (Hosting)

We recommend **Vercel** or **Netlify** for hosting. They are free, fast, and connect directly to GitHub.

### Deploy with Vercel (Recommended)
1.  Go to [vercel.com](https://vercel.com) and Sign Up/Login with GitHub.
2.  Click **"Add New Project"**.
3.  Select your `cinetracker` repository from the list.
4.  **Framework Preset**: It should auto-detect `Vite`.
5.  **Build Command**: `npm run build`
6.  **Output Directory**: `dist`
7.  Click **Deploy**.

**Result:** Your app is now live on the internet (e.g., `https://cinemate.vercel.app`)!
*Note: It will currently run in "Offline Mode" (each user sees their own private data).*

---

## Phase 3: Setup Real Server Database (Shared Data)

To allow users to share data (like a real streaming platform), you need to replace the `localStorage` mock with a real backend. We recommend **Supabase** (Postgres Database + Auth).

### 1. Create Supabase Project
1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  Go to **Project Settings -> API** and copy:
    *   `Project URL`
    *   `anon` (public) key

### 2. Connect App to Supabase
1.  Install the Supabase client:
    ```bash
    npm install @supabase/supabase-js
    ```
2.  Create a new file `src/api/supabaseClient.js`:
    ```javascript
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    export const supabase = createClient(supabaseUrl, supabaseKey)
    ```
3.  Update your `.env` file (and Vercel Environment Variables):
    ```
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

### 3. Update Integration
You will need to replace the calls in `base44Client.js` to use `supabase` instead of `localBase44`.
*   **Example Migration:**
    *   Old (Offline): `await base44.entities.Media.create({...})`
    *   New (Supabase): `await supabase.from('media').insert({...})`

> [!TIP]
> The current "Offline Mode" is great for development and personal use. Only upgrade to Supabase when you are ready to manage a real database!

---

## Phase 4: Connect Custom Domain (CineTracker.in)

Since you own `CineTracker.in`, here is how to verify it on Vercel:

1.  **Go to Vercel Dashboard**
    *   Open your project -> **Settings** -> **Domains**.
2.  **Add Domain**
    *   Enter `cinetracker.in` and click **Add**.
3.  **Configure DNS (at your Registrar)**
    *   Vercel will show you a **A Record** (IP Address) and **CNAME**.
    *   Login to where you bought the domain (GoDaddy, Namecheap, etc.).
    *   Add/Update the **A Record** (`@`) to point to Vercel's IP: `76.76.21.21` (Example, check Vercel for exact IP).
    *   Add/Update the **CNAME Record** (`www`) to point to `cname.vercel-dns.com`.
4.  **Wait for Propagation**
    *   It may take 1-24 hours for the domain to work globally. Vercel will show a "Success" green checkmark when ready.
