# TrustCar Frontend Deployment Guide

## Quick Start

The TrustCar frontend is located in `projects/trust-car-frontend/` and ready for deployment.

## Deployment Options

### Option 1: Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Important**: Set Root Directory to `projects/trust-car-frontend`
4. Vercel will auto-detect Vite framework
5. Deploy!

### Option 2: Netlify
1. Build locally: `npm run build` (in the frontend directory)
2. Drag and drop the `dist` folder to [netlify.com](https://netlify.com)
3. Done!

### Option 3: GitHub Pages
1. Enable GitHub Pages in your repo settings
2. Build and push the `dist` folder to a `gh-pages` branch

## Build Commands
- **Development**: `npm run dev`
- **Production**: `npm run build`
- **Preview**: `npm run preview`

## Configuration
- Build output: `dist/`
- Framework: Vite + React + TypeScript
- SPA routing: Configured for React Router

## Features
- ✅ Beautiful lavender-themed UI
- ✅ Irish vehicle registry functionality
- ✅ Blockchain integration (Algorand)
- ✅ Responsive design
- ✅ Modern React components

## Notes
- The frontend contains pre-built smart contract clients
- No AlgoKit required for deployment
- All TypeScript compilation errors have been resolved
