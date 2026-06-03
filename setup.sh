#!/bin/bash

echo "🚀 RECETTE MANAGER SYNC - VERCEL DEPLOYMENT SETUP"
echo ""
echo "=================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel 2>&1 | tail -2
fi

echo ""
echo "🔐 Vercel Authentication"
echo "============================"
echo ""
echo "You need to authenticate with Vercel (one time only)"
echo ""
echo "Run this command and follow the prompts:"
echo ""
echo "  vercel login"
echo ""
echo "Then come back and run this script again."
echo ""

# Try to login
vercel login

echo ""
echo "🚀 Deploying to Vercel..."
echo "============================"
echo ""

# Deploy with environment variables
vercel --prod \
  --env DATABASE_URL="postgresql://neondb_owner:npg_nPtxcyzS6pK3@ep-wandering-cake-a27attan-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  --env NODE_ENV="production"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Check your app at: https://recette-manager-sync.vercel.app/health"
echo ""
