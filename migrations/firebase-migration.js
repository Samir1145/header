#!/usr/bin/env node

/**
 * Firebase Database Migration Script
 * 
 * This script exports data from the current Firebase project and creates
 * migration files that can be used to restore data in a new Firebase project.
 * 
 * Usage:
 * 1. Set up Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Set project: firebase use <project-id>
 * 4. Run migration: node migrations/firebase-migration.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();

// Collections to migrate
const COLLECTIONS = [
  'users',
  'user_questions', 
  'user_qna',
  'form_schemas',
  'form_submissions',
  'form_categories',
  'resources'
];

/**
 * Export all documents from a collection
 */
async function exportCollection(collectionName) {
  console.log(`📦 Exporting collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`✅ Exported ${documents.length} documents from ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error);
    return [];
  }
}

/**
 * Export all collections and create migration files
 */
async function exportAllCollections() {
  console.log('🚀 Starting Firebase migration export...');
  
  const migrationData = {
    exportedAt: new Date().toISOString(),
    projectId: serviceAccount.project_id,
    collections: {}
  };
  
  // Export each collection
  for (const collectionName of COLLECTIONS) {
    migrationData.collections[collectionName] = await exportCollection(collectionName);
  }
  
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname);
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Save migration data
  const migrationFile = path.join(migrationsDir, `firebase-export-${Date.now()}.json`);
  fs.writeFileSync(migrationFile, JSON.stringify(migrationData, null, 2));
  
  console.log(`💾 Migration data saved to: ${migrationFile}`);
  
  // Create individual collection files for easier management
  for (const [collectionName, documents] of Object.entries(migrationData.collections)) {
    const collectionFile = path.join(migrationsDir, `${collectionName}-export.json`);
    fs.writeFileSync(collectionFile, JSON.stringify(documents, null, 2));
    console.log(`📄 Collection ${collectionName} saved to: ${collectionFile}`);
  }
  
  // Create import script
  createImportScript(migrationsDir);
  
  console.log('🎉 Migration export completed successfully!');
}

/**
 * Create an import script for the new Firebase project
 */
function createImportScript(migrationsDir) {
  const importScript = `#!/usr/bin/env node

/**
 * Firebase Database Import Script
 * 
 * This script imports data from migration files into a new Firebase project.
 * 
 * Usage:
 * 1. Set up Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Set new project: firebase use <new-project-id>
 * 4. Run import: node migrations/firebase-import.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK with NEW project credentials
const serviceAccount = require('../serviceAccountKey-new.json'); // Download from new Firebase project

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: \`https://\${serviceAccount.project_id}-default-rtdb.firebaseio.com\`
});

const db = admin.firestore();

/**
 * Import documents to a collection
 */
async function importCollection(collectionName, documents) {
  console.log(\`📥 Importing \${documents.length} documents to \${collectionName}\`);
  
  if (documents.length === 0) {
    console.log(\`⏭️  Skipping empty collection: \${collectionName}\`);
    return;
  }
  
  const batch = db.batch();
  let batchCount = 0;
  
  for (const docData of documents) {
    const docRef = db.collection(collectionName).doc(docData.id);
    batch.set(docRef, docData.data);
    batchCount++;
    
    // Firestore batch limit is 500 operations
    if (batchCount >= 500) {
      await batch.commit();
      console.log(\`✅ Committed batch of \${batchCount} documents to \${collectionName}\`);
      batchCount = 0;
    }
  }
  
  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
    console.log(\`✅ Committed final batch of \${batchCount} documents to \${collectionName}\`);
  }
  
  console.log(\`🎉 Successfully imported \${documents.length} documents to \${collectionName}\`);
}

/**
 * Import all collections from migration files
 */
async function importAllCollections() {
  console.log('🚀 Starting Firebase migration import...');
  
  const collections = [
    'users',
    'user_questions', 
    'user_qna',
    'form_schemas',
    'form_submissions',
    'form_categories',
    'resources'
  ];
  
  for (const collectionName of collections) {
    const filePath = path.join(__dirname, \`\${collectionName}-export.json\`);
    
    if (fs.existsSync(filePath)) {
      const documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await importCollection(collectionName, documents);
    } else {
      console.log(\`⚠️  Migration file not found: \${filePath}\`);
    }
  }
  
  console.log('🎉 Migration import completed successfully!');
}

// Run the import
importAllCollections().catch(console.error);
`;

  const importFile = path.join(migrationsDir, 'firebase-import.js');
  fs.writeFileSync(importFile, importScript);
  console.log(`📝 Import script created: ${importFile}`);
}

// Run the export
exportAllCollections().catch(console.error);
