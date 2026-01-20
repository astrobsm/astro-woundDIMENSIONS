# AstroWound-MEASURE Deployment Guide

## Deploying to Vercel with Custom Domain (bonnesantemedicals.com)

### Step 1: Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click **"Add New Project"**
   - Import your `astro-woundDIMENSIONS` repository
   - Vercel will auto-detect the Vite framework

3. **Build Settings** (should be auto-detected):
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Click **"Deploy"**

---

### Step 2: Configure Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Domains**
   - Add `bonnesantemedicals.com`
   - Add `www.bonnesantemedicals.com`

2. **DNS Configuration:**
   
   Add these DNS records at your domain registrar:

   | Type  | Name | Value                    |
   |-------|------|--------------------------|
   | A     | @    | 76.76.21.21             |
   | CNAME | www  | cname.vercel-dns.com    |

   **Or if using Vercel nameservers:**
   - Change nameservers to Vercel's nameservers (shown in Vercel dashboard)

3. **Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)

4. **Enable HTTPS:**
   - Vercel automatically provisions SSL certificates
   - Once DNS is configured, HTTPS will be enabled automatically

---

### Step 3: Verify PWA Installation

After deployment, verify the PWA works correctly:

1. **Open Chrome DevTools** → **Application** tab
2. Check **Service Workers** → Should show "activated and is running"
3. Check **Manifest** → Should show app details
4. Check **Storage** → IndexedDB should show `astrowound-measure`

**Test Offline Mode:**
1. In DevTools, go to **Network** tab
2. Check **"Offline"** checkbox
3. Refresh the page - app should still work
4. Add a patient offline and verify data persists

---

## PWA Features

### Offline Functionality
- ✅ Full app works offline after first load
- ✅ All patient and wound data stored in IndexedDB
- ✅ AI model cached for offline wound analysis
- ✅ Images stored locally on device

### Install as App
Users can install the app on their device:

**On Mobile (Android/iOS):**
1. Open `bonnesantemedicals.com` in browser
2. Tap browser menu (⋮ or Share)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. App icon appears on home screen

**On Desktop (Chrome/Edge):**
1. Open `bonnesantemedicals.com`
2. Click the install icon in the address bar
3. Click **"Install"**

### Data Storage
All data is stored locally using IndexedDB:
- **Location:** Browser's internal storage (managed by the browser)
- **Persistence:** Requested via `navigator.storage.persist()`
- **Size:** Limited by device storage (typically several GB)

---

## Environment Variables (Optional)

If you need environment variables, add them in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add any required variables

Currently the app works fully client-side with no environment variables required.

---

## Updating the App

To deploy updates:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Vercel automatically deploys on push

Users will see "New version available" prompt and can update.

---

## Monitoring

### Vercel Analytics (Optional)
Enable in Vercel Dashboard → **Analytics** for:
- Page views
- Performance metrics
- User geography

### Error Tracking (Optional)
Consider adding Sentry or similar for error tracking.

---

## Troubleshooting

### App not installing as PWA
- Ensure HTTPS is enabled
- Check manifest.webmanifest is accessible
- Verify service worker is registered

### Offline not working
- Clear browser cache and reload
- Check service worker status in DevTools
- Ensure all assets are cached

### Data not persisting
- Check IndexedDB in DevTools → Application → Storage
- Ensure storage persistence is granted
- Check for browser storage limits

---

## Domain Verification

After DNS setup, verify at:
- https://bonnesantemedicals.com
- https://www.bonnesantemedicals.com

Both should:
1. Load the app with HTTPS
2. Show as "installable" PWA
3. Work offline after first load

---

**Bonne Santé Medicals**  
*AstroWound-MEASURE - Clinical Wound Assessment Made Simple*
