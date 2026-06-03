# 🚀 Recette Manager - Application de Production

## 🎯 Accès à l'Application

L'application est en ligne et prête à l'emploi:

**URL:** https://recette-manager-sync.vercel.app/

## ✨ Fonctionnalités

### 📋 Gestion des Cahiers de Recette
- **Créer** un nouveau cahier avec numéro, nom et type (Unitaire, Modulaire, Métier, Flux)
- **Lister** tous les cahiers
- **Voir** les détails de chaque cahier
- **Synchroniser** automatiquement avec la base de données

### 📦 Gestion des Lots
- **Créer** des lots pour regrouper les cahiers
- **Lister** tous les lots
- **Associer** des cahiers aux lots

### 🧪 Exécutions de Tests
- **Enregistrer** les exécutions de cas de test
- **Tracker** les statuts (Passé, Échoué, Bloqué, En cours)
- **Voir** l'historique des exécutions par cahier

## 🔌 API REST

### Health Check
```bash
curl https://recette-manager-sync.vercel.app/api/health
```

Réponse:
```json
{
  "status": "ok",
  "timestamp": "2026-06-03T22:34:32.682Z",
  "database": "configured"
}
```

### Créer un Cahier
```bash
curl -X POST https://recette-manager-sync.vercel.app/api/cahiers \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "CAH-001",
    "nom": "Cahier Dynamics",
    "type": "Unitaire",
    "runs": [],
    "modules": [],
    "cases": []
  }'
```

### Lister les Cahiers
```bash
curl https://recette-manager-sync.vercel.app/api/cahiers
```

### Créer un Lot
```bash
curl -X POST https://recette-manager-sync.vercel.app/api/lots \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "LOT-4.3.12",
    "nom": "Lot 4.3.12 - Release Module"
  }'
```

### Enregistrer une Exécution
```bash
curl -X POST https://recette-manager-sync.vercel.app/api/executions \
  -H "Content-Type: application/json" \
  -d '{
    "cahier_id": "uuid-du-cahier",
    "run_id": "uuid-du-run",
    "case_id": "uuid-du-cas",
    "testeur_id": "uuid-du-testeur",
    "status": "Passé"
  }'
```

## 🗄️ Base de Données

- **Type:** PostgreSQL (Neon serverless)
- **Schéma:** Initialisé automatiquement
- **Tables:** cahiers, lots, executions

### Structure des Données

**Cahier:**
```javascript
{
  id: String (UUID),
  numero: String,
  nom: String,
  type: String (Unitaire|Modulaire|Métier|Flux),
  status: String (default: "À faire"),
  runs: Array,
  modules: Array,
  cases: Array,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Lot:**
```javascript
{
  id: String (UUID),
  numero: String,
  nom: String,
  cahierIds: Array[String],
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**Exécution:**
```javascript
{
  id: String (UUID),
  cahier_id: String,
  run_id: String,
  case_id: String,
  testeur_id: String,
  status: String,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

## 🛠️ Stack Technique

- **Frontend:** HTML5 + Vanilla JavaScript
- **Backend:** Express.js
- **Database:** PostgreSQL (Neon)
- **Hosting:** Vercel (serverless)
- **Repository:** GitHub

## 📝 Utilisation Recommandée

1. **Accueil:** Ouvrez https://recette-manager-sync.vercel.app/
2. **Créer un cahier:** Cliquez sur "+ Cahier" dans le header
3. **Remplir les détails:**
   - Numéro: CAH-001
   - Nom: Cahier Dynamics
   - Type: Unitaire
4. **Cliquer "Créer":** Le cahier est sauvegardé en base de données
5. **Voir dans la liste:** Le cahier apparaît immédiatement

## 🔄 Synchronisation

Les données sont synchronisées en temps réel:
- Créer un cahier → Immédiatement en base
- Charger la page → Récupère les données du serveur
- Cliquer "🔄 Sync" → Force la synchronisation

## ⚡ Performance

- **API Response Time:** < 200ms
- **Page Load Time:** < 1s
- **Database:** Neon serverless (scaled automatically)

## 📞 Support

- **GitHub Issues:** https://github.com/StephaneKlint/recette-manager-sync/issues
- **API Status:** Accessible via /api/health endpoint

## 🚀 Déploiement

Application déployée automatiquement sur Vercel:
- Chaque push à `main` déclenche un déploiement
- CD/CI automatique via GitHub
- Zéro downtime deployments

---

**Créé le:** 2026-06-04  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
