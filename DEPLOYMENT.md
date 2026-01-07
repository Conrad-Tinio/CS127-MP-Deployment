# Deployment Guide - Loan Tracking System

This guide walks you through deploying the Loan Tracking System using:
- **Frontend**: Vercel (React/Vite)
- **Backend**: Render (Spring Boot/Java 21)
- **Database**: Supabase (PostgreSQL) - already configured

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Vercel      │      │     Render      │      │    Supabase     │
│   (Frontend)    │ ───► │  (Spring Boot)  │ ───► │   PostgreSQL    │
│   React/Vite    │ API  │    Backend      │ JDBC │    Database     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Free at [vercel.com](https://vercel.com)
3. **Render Account** - Free at [render.com](https://render.com)
4. **Supabase Project** - You already have this set up

---

## Step 1: Push Your Code to GitHub

If your code isn't already on GitHub:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

### Option A: Using the Render Dashboard (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   | Setting | Value |
   |---------|-------|
   | **Name** | `loan-tracking-api` (or your preferred name) |
   | **Region** | Singapore (or closest to your users) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Docker` |
   | **Instance Type** | `Free` |

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `PORT` | `8080` |
   | `DATABASE_URL` | `jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `DATABASE_USERNAME` | Your Supabase username (e.g., `postgres.pkmcmbnrxioxwtprlgyk`) |
   | `DATABASE_PASSWORD` | Your Supabase password |
   | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` (update after frontend deployment) |
   | `SHOW_SQL` | `false` |
   | `HIKARI_MAX_POOL_SIZE` | `3` |
   | `HIKARI_MIN_IDLE` | `1` |

6. **Click "Create Web Service"**

7. **Wait for deployment** (first build takes ~5-10 minutes)

8. **Note your backend URL** - It will be something like:
   ```
   https://loan-tracking-api.onrender.com
   ```

### Option B: Using render.yaml Blueprint

1. Push the code with `render.yaml` to GitHub
2. Go to Render Dashboard → "Blueprints"
3. Connect your repository
4. Render will auto-detect `render.yaml` and create services
5. Fill in the environment variables when prompted

---

## Step 3: Deploy Frontend on Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**

4. **Configure the project:**
   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. **Add Environment Variable:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://YOUR-RENDER-BACKEND.onrender.com/api` |

   ⚠️ **Important**: Replace `YOUR-RENDER-BACKEND` with your actual Render backend URL from Step 2.

6. **Click "Deploy"**

7. **Note your frontend URL** - It will be something like:
   ```
   https://your-project.vercel.app
   ```

---

## Step 4: Update Backend CORS Settings

Now that you have your Vercel frontend URL, update the backend:

1. **Go to Render Dashboard → Your Web Service → Environment**

2. **Update `CORS_ALLOWED_ORIGINS`:**
   ```
   https://your-project.vercel.app,http://localhost:5173
   ```
   (Include localhost for local development)

3. **Click "Save Changes"** - Render will auto-redeploy

---

## Step 5: Test Your Deployment

1. **Visit your Vercel frontend URL**
2. **Test the application:**
   - Create a person
   - Create an entry
   - View the data

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Render) | `8080` |
| `DATABASE_URL` | Supabase JDBC URL | `jdbc:postgresql://...` |
| `DATABASE_USERNAME` | Supabase username | `postgres.xxxxx` |
| `DATABASE_PASSWORD` | Supabase password | `your-password` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend URLs (comma-separated) | `https://app.vercel.app,http://localhost:5173` |
| `SHOW_SQL` | Log SQL queries | `false` |
| `HIKARI_MAX_POOL_SIZE` | Max DB connections | `3` |
| `HIKARI_MIN_IDLE` | Min idle connections | `1` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.onrender.com/api` |

---

## Troubleshooting

### Backend Issues

**1. "Application failed to start"**
- Check the Render logs for specific errors
- Verify all environment variables are set correctly
- Ensure DATABASE_URL has `?sslmode=require`

**2. "Connection refused" or "Database connection failed"**
- Verify Supabase credentials
- Check if Supabase project is active
- Ensure using the Session Pooler URL (IPv4 compatible)

**3. "CORS error"**
- Update `CORS_ALLOWED_ORIGINS` to include your exact frontend URL
- Make sure there are no trailing slashes

### Frontend Issues

**1. "Network Error" or "Failed to fetch"**
- Verify `VITE_API_BASE_URL` is correct
- Check that backend is running (visit the Render URL directly)
- Check browser console for specific errors

**2. "Build failed"**
- Check Vercel build logs
- Ensure `package.json` is in the `frontend` directory

### Cold Start Delays

The free tier on Render spins down after 15 minutes of inactivity. The first request after being idle will take **30-60 seconds** while the container starts up. This is normal for free tier.

---

## Custom Domain (Optional)

### Vercel Frontend
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Render Backend
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `CORS_ALLOWED_ORIGINS` to include the new domain

---

## Local Development

After deployment, you can still develop locally:

### Backend
```bash
cd backend
# Create .env file with your credentials (see env.example)
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
# Use local backend
npm run dev
```

Or test against production:
```bash
cd frontend
# Create .env.local with production API URL
VITE_API_BASE_URL=https://your-backend.onrender.com/api
npm run dev
```

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit credentials** - Use environment variables
2. **Keep Supabase password secure** - Only add to Render dashboard
3. **Review CORS settings** - Only allow your frontend domains
4. **Consider upgrading** - Free tiers have limitations for production use

---

## Cost Summary (Free Tier)

| Service | Free Tier Limits |
|---------|------------------|
| **Vercel** | 100GB bandwidth/month, unlimited deployments |
| **Render** | 750 hours/month, spins down after inactivity |
| **Supabase** | 500MB database, 2GB bandwidth |

This setup costs **$0/month** for development and light production use.

