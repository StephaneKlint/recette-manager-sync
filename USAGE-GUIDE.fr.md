# 📋 Guide d'Utilisation - Recette Manager

## 🚀 Accès à l'Application

L'application est en ligne et prête à l'emploi:

### URLs principales:
- **Application web:** https://recette-manager-sync.vercel.app/
- **Version complète:** https://recette-manager-sync.vercel.app/app.html
- **Panel d'administration:** https://recette-manager-sync.vercel.app/admin.html

---

## 📚 Guide Complet

### 1. **Accueil - Gestion des Cahiers**

Dès votre arrivée sur l'application:

**Vue:** Cahiers de recette avec liste complète

**Actions disponibles:**
- 🔍 **Voir les cahiers** - Liste tous les cahiers disponibles
- ➕ **Créer un cahier** - Cliquez sur "+ Cahier"
- 🔄 **Sync** - Synchronise avec le serveur

**Structure d'un Cahier:**
```javascript
{
  id: "cahier-uuid",
  numero: "CAH-001",
  nom: "Cahier Dynamics",
  type: "Unitaire|Modulaire|Métier|Flux",
  runs: [],          // Campagnes de test
  modules: [],       // Groupements
  cases: []          // Cas de test
}
```

---

### 2. **Créer un Cahier**

Étapes:
1. Cliquez sur **+ Cahier** dans le header
2. Remplissez:
   - **Numéro:** CAH-001
   - **Nom:** Cahier Dynamics
   - **Type:** Sélectionnez (Unitaire/Modulaire/Métier/Flux)
3. Cliquez **Créer**

✅ Le cahier apparaît immédiatement dans la liste
📡 Les données sont synchronisées avec PostgreSQL

---

### 3. **Gestion des Lots**

**Accédez:** Cliquez l'onglet "Lots" en haut

**Actions:**
- 📋 Voir tous les lots
- ➕ Créer un lot
- 🔗 Associer des cahiers aux lots

**Structure d'un Lot:**
```javascript
{
  id: "lot-uuid",
  numero: "LOT-4.3.12",
  nom: "Lot 4.3.12 - Release Module",
  cahierIds: ["cahier-001", "cahier-002"]
}
```

---

### 4. **Testeurs et Ressources**

Les testeurs sont gérés dans le panel d'administration.

**Données de testeurs:**
```javascript
{
  id: "test-uuid",
  nom: "Alice Dupont",
  email: "alice@example.com"
}
```

---

### 5. **Panel d'Administration**

**Accédez:** https://recette-manager-sync.vercel.app/admin.html

**Fonctionnalités:**

#### 📊 **État de la Base**
- Voir le nombre de cahiers, lots, testeurs, anomalies
- Statistiques en temps réel
- Bouton "Rafraîchir" pour mettre à jour

#### 📤 **Importer des Données**
1. Préparez un fichier JSON:
```json
{
  "cahiers": [
    {"id":"cah-1","numero":"CAH-001","nom":"Test","type":"Unitaire"}
  ],
  "lots": [...],
  "testeurs": [...],
  "anomalies": [...]
}
```
2. Collez dans la textarea
3. Cliquez **Importer JSON**

#### 📥 **Exporter les Données**
- Cliquez **Télécharger JSON**
- Récupère toutes les données au format JSON
- Sauvegardable pour backup

#### 🌱 **Créer Données de Test**
- Cliquez **Créer Données Test**
- Génère 3 cahiers, 1 lot, 3 testeurs pour testing

#### 🗑️ **Vider la Base**
⚠️ **Attention:** Supprime TOUTES les données!

---

## 🔌 Utilisation de l'API

### **Récupérer les Cahiers**
```bash
curl https://recette-manager-sync.vercel.app/api/cahiers
```

### **Créer un Cahier**
```bash
curl -X POST https://recette-manager-sync.vercel.app/api/cahiers \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "CAH-002",
    "nom": "Mon Cahier",
    "type": "Unitaire"
  }'
```

### **Exporter Toutes les Données**
```bash
curl https://recette-manager-sync.vercel.app/api/export-data > backup.json
```

### **Importer des Données**
```bash
curl -X POST https://recette-manager-sync.vercel.app/api/import-data \
  -H "Content-Type: application/json" \
  -d @backup.json
```

---

## 🗄️ Base de Données

### **Schéma PostgreSQL**

**Tables disponibles:**

1. **cahiers** - Cahiers de recette
   - Champs: id, numero, nom, type, status, data (JSONB), timestamps

2. **lots** - Lots de développement
   - Champs: id, numero, nom, data (JSONB), timestamps

3. **testeurs** - Testeurs/recetteurs
   - Champs: id, nom, email, data (JSONB)

4. **executions** - Exécutions de tests
   - Champs: id, cahier_id, run_id, case_id, testeur_id, status, data (JSONB)

5. **anomalies** - Défauts et problèmes
   - Champs: id, cahier_id, description, statut, data (JSONB), timestamps

---

## 💡 Cas d'Usage Courants

### Cas 1: **Importer les données depuis l'ancienne version**

1. Ouvrez `/admin.html`
2. Cliquez **Télécharger JSON** sur l'ancienne app
3. Collez le JSON dans l'import
4. Cliquez **Importer JSON**
5. ✅ Les données sont en base de données

### Cas 2: **Créer une campagne de test**

1. Créez un **Lot** pour regrouper les cahiers
2. Créez 3-4 **Cahiers** (Unitaire, Modulaire, Métier, Flux)
3. Associez les cahiers au lot
4. Les testeurs exécutent les cas
5. Exportez les résultats via `/api/export-data`

### Cas 3: **Sauvegarder les données**

1. Accédez `/admin.html`
2. Cliquez **Télécharger JSON**
3. Le fichier `recette-manager-export-YYYY-MM-DD.json` est téléchargé
4. Conservez le backup localement

### Cas 4: **Restaurer depuis backup**

1. Ouvrez `/admin.html`
2. Collez le contenu du backup JSON
3. Cliquez **Importer JSON**
4. ✅ Les données sont restaurées

---

## 🔧 Maintenance et Support

### **Vérifier l'État du Serveur**
```bash
curl https://recette-manager-sync.vercel.app/api/health
```

Réponse:
```json
{
  "status": "ok",
  "database": "configured",
  "timestamp": "2026-06-04T..."
}
```

### **Problèmes Courants**

**Q: Les données ne s'affichent pas?**
- A: Cliquez "🔄 Sync" pour forcer la synchronisation
- Attendez 2-3 secondes après une création
- Rafraîchissez la page (F5)

**Q: Comment importer mes anciennes données?**
- A: Utilisez le `/admin.html` → "Importer JSON"
- Ou appelez directement l'API `/api/import-data`

**Q: La base de données est pleine?**
- A: Videz les anciennes données via `/admin.html`
- Exportez d'abord pour backup (`/api/export-data`)

**Q: Comment mettre à jour l'application?**
- A: Les mises à jour se déploient automatiquement sur Vercel
- Rafraîchissez votre navigateur pour voir les changements

---

## 📱 Accès Mobile

L'application est **responsive** et fonctionne sur mobile:

**URL mobile:**
```
https://recette-manager-sync.vercel.app/
```

Fonctionne avec:
- ✅ iPhone/iPad (Safari)
- ✅ Android (Chrome)
- ✅ Desktop (tous navigateurs)

---

## 🔐 Sécurité

- ✅ **HTTPS automatique** - Toutes les connexions sont chiffrées
- ✅ **CORS** - Accès sécurisé pour les applications externes
- ✅ **JSONB PostgreSQL** - Données complexes et flexibles
- ✅ **Validation** - Toutes les données sont validées

---

## 📞 Support et Ressources

**GitHub Repository:**
```
https://github.com/StephaneKlint/recette-manager-sync
```

**Documentation:**
- `README-PRODUCTION.md` - Guide de production
- `DEPLOYMENT-SUMMARY.fr.md` - Résumé technique
- `USAGE-GUIDE.fr.md` - Ce guide

---

## 🎯 Prochaines Étapes

1. ✅ **Maintenant:** Utilisez l'application pour gérer vos cahiers
2. 📊 **Étape 1:** Importez vos données existantes
3. 🔄 **Étape 2:** Synchronisez avec votre équipe
4. 📈 **Étape 3:** Collectez les résultats de test
5. 📤 **Étape 4:** Exportez les rapports

---

## ✨ Succès!

Votre application Recette Manager est maintenant en production.

**Bon usage!** 🚀

---

**Créé le:** 2026-06-04  
**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Dernière mise à jour:** 2026-06-04
