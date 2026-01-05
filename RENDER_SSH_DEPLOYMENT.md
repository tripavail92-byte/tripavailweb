# Render Deployment with SSH & CLI

## Prerequisites
- SSH key: ~/.ssh/id_ed25519 (generated)
- Render API Key: rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy
- GitHub Repo: https://github.com/tripavailweb/trip
- Email: tripavail92@gmail.com

## Step 1: Add SSH Key to Render Dashboard

1. Visit: https://dashboard.render.com/account/ssh-keys
2. Click "New SSH Key"
3. Paste this public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINUqsfOqHpThefHVJXWIe4vQC568JkRersEXMqXWUe7+ hp@DESKTOP-6RNPSMF
```
4. Name: "TripAvail Deploy Key"
5. Click "Add SSH Key"

## Step 2: Add GitHub Deploy Key (SSH)

1. Visit: https://github.com/tripavailweb/trip/settings/keys
2. Click "New deploy key"
3. Paste the SAME SSH public key
4. Title: "Render Deploy Key"
5. Check "Allow write access" (optional)
6. Click "Add key"

## Step 3: Create Web Service on Render

### Backend Service
- Name: tripavail-backend
- Runtime: Node
- Build Command: npm ci && npm run build
- Start Command: npm run start:prod
- Root Directory: backend
- Plan: Free

### PostgreSQL Database
- Name: tripavail-db
- Plan: Free

### Frontend Service
- Name: tripavail-web
- Runtime: Node
- Build Command: npm ci && npm run build
- Start Command: npm start
- Root Directory: web
- Plan: Free

## Step 4: Environment Variables

### Backend Service
```
NODE_ENV=production
PORT=4100
DATABASE_URL=${{tripavail-db.DATABASE_URL}}
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
JWT_SECRET=your-secure-key-here
CORS_ORIGINS=https://${{tripavail-web.RENDER_EXTERNAL_URL}}
```

### Frontend Service
```
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=${{tripavail-backend.RENDER_EXTERNAL_URL}}
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ
```

## Step 5: Deploy & Migrate

1. Services will auto-build and deploy
2. Once backend is live:
   - Backend Service → Shell
   - Run: `npm run migration:run`
3. Check frontend loads at generated URL
4. Visit: `/traveler/discovery`

## Using Render CLI (Optional)

```bash
# Install Render CLI
npm install -g @render/cli

# Login (uses your browser)
render login

# Create service from CLI
render create-service \
  --name tripavail-backend \
  --type web_service \
  --runtime node \
  --repo https://github.com/tripavailweb/trip.git \
  --branch main \
  --build-command "npm ci && npm run build" \
  --start-command "npm run start:prod"
```

## GitHub Repository
- HTTP: https://github.com/tripavailweb/trip
- SSH: git@github.com:tripavailweb/trip.git

## Dashboard
- Render: https://dashboard.render.com
- GitHub: https://github.com/tripavailweb/trip
