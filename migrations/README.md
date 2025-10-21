# Firebase Database Migration Guide

This directory contains scripts to migrate your Firebase database from the current project to a new Firebase project.

## Overview

The migration process involves:
1. **Export** data from the current Firebase project
2. **Import** data into the new Firebase project
3. **Update** environment variables in your application

## Prerequisites

1. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Admin SDK**: Install dependencies
   ```bash
   cd migrations
   npm install
   ```

3. **Service Account Keys**: Download from Firebase Console
   - Current project: `serviceAccountKey.json`
   - New project: `serviceAccountKey-new.json`

## Step 1: Export Data from Current Project

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Set current project**:
   ```bash
   firebase use resolution-18119
   ```

3. **Download service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `migrations/serviceAccountKey.json`

4. **Run export script**:
   ```bash
   cd migrations
   npm run export
   ```

This will create:
- `firebase-export-[timestamp].json` - Complete migration data
- `[collection]-export.json` - Individual collection files
- `firebase-import.js` - Import script for new project

## Step 2: Import Data to New Project

1. **Set new project**:
   ```bash
   firebase use investorwatch-5edfa
   ```

2. **Download new service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `migrations/serviceAccountKey-new.json`

3. **Run import script**:
   ```bash
   cd migrations
   npm run import
   ```

## Step 3: Update Environment Variables

Update your `.env` file with the new Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyAqICjtbdIyddCTBfZEoBBuJ2rAuffvhXs
VITE_FIREBASE_AUTH_DOMAIN=investorwatch-5edfa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=investorwatch-5edfa
VITE_FIREBASE_STORAGE_BUCKET=investorwatch-5edfa.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=90177866667
VITE_FIREBASE_APP_ID=1:90177866667:web:37024e58c55068ef3c20ee
```

## Collections Migrated

The following Firebase collections will be migrated:

- **users** - User profiles and authentication data
- **user_questions** - User submitted questions
- **user_qna** - Q&A session data
- **form_schemas** - Form definitions and configurations
- **form_submissions** - Form submission data
- **form_categories** - Form category organization
- **resources** - Resource and document data

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure service account has proper permissions
2. **Collection Not Found**: Some collections might be empty in current project
3. **Batch Size Exceeded**: Script handles Firestore's 500 document batch limit

### Verification

After migration, verify data integrity:
1. Check collection counts in Firebase Console
2. Test form submissions
3. Verify user authentication
4. Check resource access

## Security Notes

- **Never commit** service account keys to version control
- **Delete** service account keys after migration
- **Rotate** keys if accidentally exposed
- **Use** environment variables for sensitive data

## Support

If you encounter issues during migration:
1. Check Firebase Console for error logs
2. Verify service account permissions
3. Ensure Firestore rules allow read/write operations
4. Check network connectivity and Firebase service status
