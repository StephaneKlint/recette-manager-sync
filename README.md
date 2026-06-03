# 📋 Recette Manager Sync

**Real-time collaborative QA test case management application**

**Status:** 🚀 Ready for deployment  
**Live:** TBD (Vercel)  
**Database:** PostgreSQL (Neon)

---

## 🎯 Overview

Recette Manager Sync is a web-based QA/testing application that allows teams to:
- ✅ Create and manage test cahiers (test suites)
- ✅ Organize tests into lots (releases/sprints)
- ✅ Execute test cases with real-time collaboration
- ✅ Track test results and anomalies
- ✅ Backup and restore test data

**Key Features:**
- 🔄 Real-time sync via WebSockets (< 100ms)
- 💾 Persistent storage (PostgreSQL)
- 👥 Multi-user collaboration
- 📊 Execution tracking and reporting
- 🔐 User roles and permissions

---

## 🛠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Node.js 24.x + Express | HTTP server & REST API |
| **Real-time** | Socket.IO | WebSocket synchronization |
| **Database** | PostgreSQL (Neon) | Data persistence |
| **Hosting** | Vercel | Serverless deployment |
| **Frontend** | Vanilla JS + HTML5 | Single-page application |
| **VCS** | GitHub | Version control & CI/CD |

---

## 📦 Installation

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/[username]/recette-manager-sync.git
cd recette-manager-sync

# 2. Install dependencies
npm install

# 3. Setup .env file
cp .env.example .env
# Edit .env and add DATABASE_URL from Neon

# 4. Start server
npm run dev
# Server runs on http://localhost:3000
```

### Docker (Optional)

```bash
docker build -t recette-manager .
docker run -p 3000:3000 -e DATABASE_URL="..." recette-manager
```

---

## 🗄️ Database Schema

### Tables

**cahiers** - Test case collections
```sql
id (TEXT) | nom | type | lotId | status | owner | data (JSONB) | timestamps
```

**lots** - Test release/sprint groupings
```sql
id (TEXT) | numero | nom | cahierIds[] | status | data (JSONB) | timestamps
```

**testeurs** - Users/testers
```sql
id (TEXT) | nom | email | roles[] | data (JSONB) | timestamps
```

**executions** - Test case execution results
```sql
id (TEXT) | cahier_id | case_id | testeur_id | statut | result | data (JSONB) | timestamps
```

**anomalies** - Bugs/issues found during testing
```sql
id (TEXT) | cahier_id | titre | severite | status | data (JSONB) | timestamps
```

**backups** - Point-in-time backups
```sql
id (SERIAL) | cahier_id | version | device | data (JSONB) | created_at
```

**collaborators** - Active collaborators per cahier
```sql
id (SERIAL) | cahier_id | testeur_id | device_id | last_seen
```

---

## 🔌 API Endpoints

### Cahiers
- `GET /api/cahiers` - List all cahiers
- `GET /api/cahiers/:id` - Get single cahier
- `POST /api/cahiers` - Create/update cahier
- `DELETE /api/cahiers/:id` - Delete cahier

### Lots
- `GET /api/lots` - List all lots
- `POST /api/lots` - Create/update lot

### Executions
- `POST /api/executions` - Record test execution
- `GET /api/cahiers/:cahierId/executions/:testeurId` - Get testeur's executions

### Health
- `GET /health` - Server status

---

## 🔌 WebSocket Events

**Client → Server:**
- `join-cahier` - Join a cahier room
- `cahier-modified` - Notify of changes

**Server → Client:**
- `cahier-updated` - Cahier changed
- `cahier-deleted` - Cahier deleted
- `user-joined` - Testeur joined cahier
- `user-left` - Testeur left cahier
- `execution-recorded` - Test result recorded

---

## 🚀 Deployment

### Vercel

```bash
# 1. Connect GitHub repo to Vercel
# https://vercel.com/new

# 2. Add environment variables
# DATABASE_URL = your Neon PostgreSQL URL
# NODE_ENV = production

# 3. Deploy
# Automatic on every push to main
```

### Neon Database Setup

1. Create Neon project: https://console.neon.tech
2. Copy connection string
3. Add to `.env` and Vercel environment variables

---

## 📝 Configuration

### .env Variables

```env
# Required
DATABASE_URL=postgresql://...

# Optional
NODE_ENV=development|production
PORT=3000
VITE_API_URL=https://recette-manager-sync.vercel.app
```

---

## 🧪 Testing

```bash
# Run development server with hot-reload
npm run dev

# Test API
curl http://localhost:3000/health

# Test WebSocket
# Use browser DevTools to connect to http://localhost:3000
```

---

## 📚 Documentation

- `Architecture_recette.md` - System architecture details
- `API.md` - Detailed API documentation
- `DATABASE.md` - Database schema & queries

---

## 👥 Contributors

- **Stephane @ KLINT** - Project lead, architecture
- **Team KLINT** - QA testing

---

## 📄 License

MIT

---

## 📞 Support

For issues, create a GitHub issue or contact Stephane.

---

**Last Updated:** June 2026  
**Version:** 1.0.0
