# 🏗 Architecture Recette Manager Sync - Documentation Complète

**Date:** 3 Juin 2026  
**Version:** 1.0 (Foundation - Ready for deployment)  
**Status:** ✅ **LOCAL REPO READY - AWAITING GITHUB/NEON/VERCEL SETUP**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack Technique](#stack-technique)
3. [Architecture Générale](#architecture-générale)
4. [Structure du Projet](#structure-du-projet)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [WebSocket Events](#websocket-events)
8. [Déploiement](#déploiement)
9. [Migration from localStorage](#migration-from-localstorage)

---

## 🎯 Vue d'ensemble

**Objectif:** Transformer recette-manager d'une app localStorage vers une application collaborative temps réel avec:
- ✅ Synchronisation WebSocket < 100ms (multipl testeurs simultanés)
- ✅ Persistence PostgreSQL (Neon serverless)
- ✅ Support multi-utilisateurs (10+ collaborateurs par cahier)
- ✅ Device ID tracking pour audit trail
- ✅ Déploiement serverless sur Vercel
- ✅ Data integrity & backup/restore

**Users:**
- MOA/AMOA (Stéphane @ KLINT) - créateur cahiers
- QA Testers (~30 personnes) - exécuteurs tests
- Responsables projets - visualisation suivi

---

## 🛠 Stack Technique

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| **Backend** | Node.js 24.x + Express.js | Serverless compatible, léger, rapide |
| **WebSocket** | Socket.IO | Real-time sync, fallback à polling |
| **Database** | PostgreSQL (Neon Serverless) | ✅ **À configurer** |
| **Hosting** | Vercel | Serverless, CI/CD automatique, free tier |
| **Frontend** | Vanilla JS + HTML5 | Pas de dépendances, lightweight |
| **Version Control** | GitHub | Intégration CI/CD avec Vercel |
| **Env Config** | dotenv | Gestion sécurisée des credentials |

**Dépendances NPM:**
```json
{
  "express": "^4.18.2",        // Framework HTTP
  "socket.io": "^4.7.2",        // WebSocket real-time
  "pg": "^8.11.3",              // PostgreSQL client
  "cors": "^2.8.5",             // Cross-Origin Resource Sharing
  "compression": "^1.7.4",      // Compression HTTP
  "dotenv": "^16.3.1",          // Environment variables
  "uuid": "^9.0.1"              // ID generation
}
```

---

## 🏗 Architecture Générale

```
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Node.js 24.x Runtime (app.js)                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Express.js Server                                │  │  │
│  │  │ ├─ Middleware: CORS, compression, JSON           │  │  │
│  │  │ ├─ Routes API: /api/cahiers, /api/lots, etc.     │  │  │
│  │  │ └─ Static: /health, /                            │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Socket.IO Server (WebSocket)                      │  │  │
│  │  │ ├─ Events: join-cahier                            │  │  │
│  │  │ ├─ Events: cahier-modified                        │  │  │
│  │  │ ├─ Events: user-joined / user-left                │  │  │
│  │  │ └─ Real-time sync < 100ms                        │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ PostgreSQL Client (pg Pool)                       │  │  │
│  │  │ ├─ Tables: cahiers, lots, testeurs, executions  │  │  │
│  │  │ ├─ Tables: anomalies, backups, collaborators    │  │  │
│  │  │ └─ Connection pooling & SSL                      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↓ HTTPS                    ↓ PostgreSQL (SSL)
┌──────────────────────┐    ┌──────────────────────┐
│   Browser/Client     │    │   Neon Database      │
│  (recette-manager)   │    │  (PostgreSQL)        │
│                      │    │                      │
│ ├─ Socket.IO client  │    │ ├─ Cahiers table    │
│ ├─ Fetch API         │    │ ├─ Executions table │
│ ├─ Vanilla JS        │    │ ├─ Anomalies table  │
│ └─ HTML5 UI          │    │ ├─ Backups table    │
└──────────────────────┘    └──────────────────────┘
         ↑                             ↑
    30+ Testeurs              Persistent data
   (10+ simultanés)          (24/7 availability)
```

---

## 📁 Structure du Projet

```
recette-manager-sync/
├── app.js                           (Express + Socket.IO server - 12KB)
├── package.json                     (Dependencies: Express, Socket.IO, pg)
├── .env.example                     (Configuration template)
├── .env                             (LOCAL ONLY - not in git)
├── vercel.json                      (Vercel serverless config)
├── .gitignore                       (Exclude: node_modules, .env, logs)
├── README.md                        (User documentation)
├── Architecture_recette.md          (This file)
├── .git/                            (Git repository)
│   └── HEAD, refs/, objects/, etc.
│
└── public/                          (Static frontend files - Vercel serves these)
    ├── index.html                   (Minimal test page with Socket.IO client)
    ├── recette-manager.html         (MIGRATION: Full app UI - localStorage → API)
    └── assets/                      (Images, icons, etc. - TBD)
```

---

## 🗄️ Database Schema

### Tables Structure

**cahiers** - Test case collections (test suites)
```sql
CREATE TABLE cahiers (
  id TEXT PRIMARY KEY,              -- UUID
  nom TEXT NOT NULL,                -- "Cahier Unitaire - Module Dynamics"
  type TEXT,                        -- "Unitaire", "Modulaire", "Métier", "Flux"
  lotId TEXT,                       -- Foreign key to lots table
  status TEXT DEFAULT 'En cours',   -- "À faire", "En cours", "Complété"
  owner TEXT,                       -- User ID who created it
  data JSONB NOT NULL,              -- Full cahier data (runs, modules, cases)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**lots** - Test release groupings
```sql
CREATE TABLE lots (
  id TEXT PRIMARY KEY,              -- UUID
  numero TEXT NOT NULL,             -- "4.3.12"
  nom TEXT NOT NULL,                -- "Lot 4.3.12 - Module Dynamics"
  cahierIds TEXT[] DEFAULT '{}',    -- Array of cahier IDs in this lot
  status TEXT DEFAULT 'En cours',   -- "À faire", "En cours", "Complété"
  data JSONB NOT NULL,              -- Lot metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**testeurs** - Users/QA testers
```sql
CREATE TABLE testeurs (
  id TEXT PRIMARY KEY,              -- UUID
  nom TEXT NOT NULL,                -- "Alice Tester"
  email TEXT,                       -- "alice@klint.fr"
  roles TEXT[] DEFAULT '{}',        -- ["Testeur", "Lead", "Manager", "Admin"]
  data JSONB NOT NULL,              -- User profile data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**executions** - Test case execution results
```sql
CREATE TABLE executions (
  id TEXT PRIMARY KEY,              -- UUID
  cahier_id TEXT NOT NULL,          -- Which cahier
  case_id TEXT NOT NULL,            -- Which test case
  testeur_id TEXT NOT NULL,         -- Who executed it
  statut TEXT,                      -- "Passé", "Échoué", "Bloqué", "En cours"
  result TEXT,                      -- Detailed result
  data JSONB,                       -- Full execution data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(cahier_id) REFERENCES cahiers(id) ON DELETE CASCADE
);
CREATE INDEX idx_executions_cahier ON executions(cahier_id, testeur_id);
```

**anomalies** - Bugs/issues found
```sql
CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,              -- UUID
  cahier_id TEXT NOT NULL,          -- Which cahier
  titre TEXT,                       -- Bug title
  severite TEXT,                    -- "Bloquant", "Majeur", "Mineur", "Cosmétique"
  status TEXT DEFAULT 'Ouvert',     -- "Ouvert", "En cours", "Fermé"
  data JSONB,                       -- Full anomaly data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(cahier_id) REFERENCES cahiers(id) ON DELETE CASCADE
);
CREATE INDEX idx_anomalies_cahier ON anomalies(cahier_id);
```

**backups** - Point-in-time backups
```sql
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,            -- Auto-increment
  cahier_id TEXT REFERENCES cahiers(id) ON DELETE CASCADE,
  version INT NOT NULL,             -- Version number
  device TEXT,                      -- Device that created backup
  data JSONB NOT NULL,              -- Full cahier snapshot
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_backups_cahier ON backups(cahier_id, version);
```

**collaborators** - Track active collaborators per cahier
```sql
CREATE TABLE collaborators (
  id SERIAL PRIMARY KEY,            -- Auto-increment
  cahier_id TEXT REFERENCES cahiers(id),
  testeur_id TEXT,                  -- User viewing cahier
  device_id TEXT,                   -- Browser/device identifier
  last_seen TIMESTAMP DEFAULT NOW(), -- When they last interacted
  UNIQUE(cahier_id, device_id)      -- One row per device per cahier
);
```

---

## 🔌 API Endpoints

### Cahiers Management

**GET /api/cahiers**
```
List all cahiers
Response: [{id, nom, type, lotId, status, created_at, updated_at}, ...]
```

**GET /api/cahiers/:id**
```
Get single cahier with full data
Response: {id, nom, type, lotId, status, data, ...}
```

**POST /api/cahiers**
```
Create or update cahier (upsert)
Body: {id?, nom, type, lotId, status, data, owner}
Response: {id, ...}
```

**DELETE /api/cahiers/:id**
```
Delete cahier (cascades to executions, anomalies, backups)
Response: {success: true}
```

### Lots Management

**GET /api/lots**
```
List all lots
Response: [{id, numero, nom, cahierIds, status, ...}, ...]
```

**POST /api/lots**
```
Create or update lot
Body: {id?, numero, nom, cahierIds, status, data}
Response: {id, ...}
```

### Test Executions

**POST /api/executions**
```
Record a test execution
Body: {id?, cahier_id, case_id, testeur_id, statut, result, data}
Response: {id, ...}
Broadcasts to WebSocket: execution-recorded
```

**GET /api/cahiers/:cahierId/executions/:testeurId**
```
Get all executions for a testeur in a cahier
Response: [{id, case_id, statut, result, ...}, ...]
```

### Health Check

**GET /health**
```
Server status
Response: {
  status: "ok",
  environment: "production|development",
  database: "configured|not-configured",
  websocket: "ready",
  timestamp: "2026-06-03T..."
}
```

---

## 🔌 WebSocket Events

### Client → Server

**join-cahier**
```javascript
socket.emit('join-cahier', {
  cahierId: 'uuid',
  testeurId: 'uuid',
  deviceId: 'browser-fingerprint'
});
// Join a real-time room for this cahier
// Subscribe to updates from other testeurs
```

**cahier-modified**
```javascript
socket.emit('cahier-modified', {
  cahierId: 'uuid',
  modification: {
    type: 'execution-recorded|anomaly-declared|status-changed',
    data: {...}
  }
});
// Notify other collaborators of a change
```

### Server → Client

**cahier-updated**
```javascript
socket.on('cahier-updated', ({cahierId, nom, type, status}) => {
  // Another testeur updated this cahier
  // Refresh UI
});
```

**cahier-deleted**
```javascript
socket.on('cahier-deleted', ({cahierId}) => {
  // Cahier was deleted, remove from UI
});
```

**user-joined**
```javascript
socket.on('user-joined', ({testeurId, usersInRoom}) => {
  // Another testeur joined this cahier
  // Show "2 people viewing this cahier"
});
```

**user-left**
```javascript
socket.on('user-left', ({testeurId, usersInRoom}) => {
  // Testeur left, update collaborator count
});
```

**execution-recorded**
```javascript
socket.on('execution-recorded', ({
  executionId, cahier_id, case_id, testeur_id, statut, result
}) => {
  // Another testeur recorded a test result
  // Update case status in real-time
});
```

---

## 🚀 Déploiement

### Prerequisites
- GitHub account (stephanedurand)
- Neon account for PostgreSQL
- Vercel account for hosting

### Step 1: Push to GitHub

```bash
# Locally (in /Users/stephanedurand/recette-manager-sync)

# Add remote
git remote add origin https://github.com/stephanedurand/recette-manager-sync.git

# Push
git push -u origin main
```

### Step 2: Setup Neon Database

```
1. Go to https://console.neon.tech
2. Create new project: "recette-manager-prod"
3. Copy PostgreSQL connection string
4. Add to local .env: DATABASE_URL=postgresql://...
5. App auto-creates tables on first run
```

### Step 3: Deploy to Vercel

```
1. Go to https://vercel.com/new
2. Import from GitHub: stephanedurand/recette-manager-sync
3. Environment variables:
   - DATABASE_URL = from Neon
   - NODE_ENV = production
4. Deploy
5. App runs at: recette-manager-sync.vercel.app
```

### Step 4: Verify Deployment

```bash
# Check server
curl https://recette-manager-sync.vercel.app/health

# Should return:
# {
#   "status": "ok",
#   "database": "configured",
#   "websocket": "ready"
# }
```

---

## 🔄 Migration from localStorage

### Current State (V1)
- All data in browser localStorage
- Keys: `recette-cahiers`, `recette-lots`, `recette-testeurs`, etc.
- Synced manually via IndexedDB backups

### New State (V2)
- All data in PostgreSQL (Neon)
- Real-time sync via WebSockets
- localStorage only for UI state (current tab, theme, etc.)

### Migration Path

**Phase 1: Backend Ready** ✅ (This document)
- Express + Socket.IO running
- PostgreSQL schema ready
- API endpoints implemented

**Phase 2: Frontend Migration** (TBD - next step)
- Adapt recette-manager.html
- Replace localStorage calls → API fetch()
- Connect Socket.IO client
- Load data from /api/cahiers instead of localStorage
- Push execution results via /api/executions

**Phase 3: Data Import** (TBD)
- Export localStorage data to JSON
- Load into PostgreSQL via API
- Verify integrity
- Perform final tests

**Phase 4: Live Migration** (TBD)
- Run both V1 (localStorage) and V2 (API) in parallel
- Gradually migrate testeurs to V2
- Monitor for issues
- Shutdown V1 after all testeurs migrated

---

## 📊 Performance Expectations

| Operation | Latency | Throughput |
|-----------|---------|-----------|
| GET /api/cahiers | < 100ms | 1000/sec |
| POST /api/executions | < 50ms | 500/sec |
| WebSocket sync | < 50ms | Real-time |
| Database query | < 20ms | 10,000/sec |

---

## 🔐 Security Notes

- SSL/TLS for all connections (Vercel + Neon)
- CORS enabled for localhost development
- .env not committed to git (.gitignore)
- PostgreSQL credentials in Neon secure vault
- No sensitive data in browser localStorage
- Device ID tracking for audit trail

---

## 📝 Next Steps

1. ✅ Local repo ready: `/Users/stephanedurand/recette-manager-sync`
2. → **Push to GitHub** (requires GitHub setup)
3. → **Create Neon project** (requires Neon account)
4. → **Deploy to Vercel** (requires Vercel account)
5. → **Migrate frontend** (recette-manager.html → API calls)
6. → **Test with testeurs** (live collaboration)

---

**Status:** 🚀 READY FOR GITHUB/NEON/VERCEL SETUP

**Next Step:** Push this repo to GitHub, setup Neon project with DATABASE_URL, deploy to Vercel.

---

*Last Updated: 2026-06-03*  
*Version: 1.0.0 (Foundation)*
