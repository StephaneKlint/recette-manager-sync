#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Chemin du fichier HTML source
const HTML_FILE = path.join(__dirname, '../public/app.html');
const API_URL = process.env.API_URL || 'https://recette-manager-sync.vercel.app/api';

async function extractDataFromHTML() {
  console.log('📖 Lecture du fichier HTML...');
  const html = fs.readFileSync(HTML_FILE, 'utf8');

  // Extraire les données localStorage du HTML
  // Les données sont définies dans un script au début du HTML
  const dataMatch = html.match(/localStorage\.setItem\('([^']+)',\s*JSON\.stringify\(\s*({[\s\S]*?})\s*\)\);?/g);

  const data = {
    cahiers: [],
    lots: [],
    testeurs: [],
    anomalies: []
  };

  // Parser les données localStorage
  console.log('🔍 Extraction des données...');

  // Chercher les patterns de données
  if (html.includes('recette-cahiers')) {
    const cahiersMatch = html.match(/localStorage\.setItem\('recette-cahiers',\s*JSON\.stringify\(\s*(\[[\s\S]*?\])\s*\)\);/);
    if (cahiersMatch) {
      try {
        const cahiers = eval(cahiersMatch[1]);
        data.cahiers = Array.isArray(cahiers) ? cahiers : [];
        console.log(`  ✅ ${data.cahiers.length} cahiers trouvés`);
      } catch (e) {
        console.log('  ⚠️  Impossible de parser les cahiers');
      }
    }
  }

  if (html.includes('recette-testeurs')) {
    const testursMatch = html.match(/localStorage\.setItem\('recette-testeurs',\s*JSON\.stringify\(\s*(\[[\s\S]*?\])\s*\)\);/);
    if (testursMatch) {
      try {
        const testeurs = eval(testursMatch[1]);
        data.testeurs = Array.isArray(testeurs) ? testeurs : [];
        console.log(`  ✅ ${data.testeurs.length} testeurs trouvés`);
      } catch (e) {
        console.log('  ⚠️  Impossible de parser les testeurs');
      }
    }
  }

  if (html.includes('recette-anomalies')) {
    const anomaliesMatch = html.match(/localStorage\.setItem\('recette-anomalies',\s*JSON\.stringify\(\s*(\[[\s\S]*?\])\s*\)\);/);
    if (anomaliesMatch) {
      try {
        const anomalies = eval(anomaliesMatch[1]);
        data.anomalies = Array.isArray(anomalies) ? anomalies : [];
        console.log(`  ✅ ${data.anomalies.length} anomalies trouvées`);
      } catch (e) {
        console.log('  ⚠️  Impossible de parser les anomalies');
      }
    }
  }

  // Chercher les patterns de données d'une autre manière
  // En regardant le script d'initialisation
  const initScriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (initScriptMatch) {
    const script = initScriptMatch[1];
    // Chercher les appels de loadCahiers, loadLots, etc.
    console.log('  📊 Données partielles trouvées dans le script');
  }

  return data;
}

async function importDataToAPI(data) {
  console.log('\n📤 Envoi des données à l\'API...');

  try {
    const response = await fetch(`${API_URL}/import-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ${result.imported} objets importés avec succès!`);
      return true;
    } else {
      console.log(`❌ Erreur: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
    console.log(`💡 Assurez-vous que l'API est accessible: ${API_URL}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('  Import de Données - Recette Manager');
  console.log('========================================\n');

  try {
    const data = await extractDataFromHTML();
    const imported = await importDataToAPI(data);

    console.log('\n========================================');
    if (imported) {
      console.log('✅ IMPORT RÉUSSI!');
    } else {
      console.log('❌ IMPORT ÉCHOUÉ');
    }
    console.log('========================================');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
