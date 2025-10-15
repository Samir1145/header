import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'; 

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug Firebase configuration
console.log('🔧 Firebase Configuration Check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Check if Firebase configuration is complete
const isFirebaseConfigComplete = Object.values(firebaseConfig).every(value => value && value !== 'undefined');
if (!isFirebaseConfigComplete) {
  console.error('❌ Firebase configuration is incomplete. Please check your environment variables.');
  console.error('Missing configuration:', Object.entries(firebaseConfig)
    .filter(([key, value]) => !value || value === 'undefined')
    .map(([key]) => key)
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase connection status management
let isOnline = navigator.onLine;

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  console.log('Firebase: Network connection restored');
  // Re-enable Firestore network when connection is restored
  enableNetwork(db).catch(console.error);
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Firebase: Network connection lost');
  // Disable Firestore network when connection is lost
  disableNetwork(db).catch(console.error);
});

// Export connection status check
export const isFirebaseOnline = () => isOnline;

// Enhanced error handler for Firebase operations
export const handleFirebaseError = (error: any, operation: string = 'Firebase operation') => {
  console.error(`${operation} error:`, error);
  
  // Check for network-related errors
  if (error.code === 'unavailable' || 
      error.message?.includes('network') || 
      error.message?.includes('connection') ||
      !isOnline) {
    return {
      type: 'network',
      message: 'Network connection error. Please check your internet connection and try again.',
      originalError: error
    };
  }
  
  // Check for authentication errors
  if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
    return {
      type: 'auth',
      message: 'Authentication error. Please log in again.',
      originalError: error
    };
  }
  
  // Check for quota exceeded errors
  if (error.code === 'resource-exhausted' || error.code === 'quota-exceeded') {
    return {
      type: 'quota',
      message: 'Service quota exceeded. Please try again later.',
      originalError: error
    };
  }
  
  // Default error handling
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred.',
    originalError: error
  };
};
