# TrustCar Frontend Deployment Guide

## Vercel Deployment Steps

### 1. Project Structure
The frontend is located in: `trust-car/projects/trust-car-frontend/`

### 2. Vercel Configuration
The `vercel.json` file has been configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA routing support (rewrites all routes to index.html)

### 3. Deployment Steps

#### Option A: Vercel CLI (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend directory: `cd trust-car/projects/trust-car-frontend`
3. Run: `vercel`
4. Follow the prompts
5. For production deployment: `vercel --prod`

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Important**: Set the root directory to `trust-car/projects/trust-car-frontend`
4. Vercel should auto-detect the settings from `vercel.json`
5. Deploy

### 4. Environment Variables
If you need to set environment variables:
1. Copy from `.env.template` to `.env`
2. Add variables to Vercel dashboard under Project Settings > Environment Variables

### 5. Custom Domain (Optional)
1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS as instructed

### 6. Build Verification
To verify the build works locally:
```bash
cd trust-car/projects/trust-car-frontend
npm run build
npm run preview
```

## Troubleshooting

### 404 Errors
- Ensure root directory is set to `trust-car/projects/trust-car-frontend`
- Check that `vercel.json` exists and is properly configured
- Verify the build output directory is `dist`

### Build Failures
- Check that all dependencies are installed: `npm install`
- Verify Node.js version (requires >=20.0)
- Check for TypeScript errors: `npm run build`

### Environment Issues
- Ensure `.env` file exists (copy from `.env.template`)
- Check that all required environment variables are set in Vercel

## Production Checklist
- [ ] Frontend builds successfully
- [ ] All environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics configured (if desired)
- [ ] Performance monitoring setup
