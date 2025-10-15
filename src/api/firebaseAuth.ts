import { auth, handleFirebaseError, isFirebaseOnline } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  sendPasswordResetEmail,
  getAuth
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp
} from 'firebase/firestore'
import { getDoc, doc } from 'firebase/firestore'
import { retryWithBackoff, isRetryableError } from '@/lib/utils'

const db = getFirestore()

const wrapFirebaseError = (error: unknown, handled: ReturnType<typeof handleFirebaseError>) => {
  const wrappedError = new Error(handled.message)

  if (error && typeof error === 'object') {
    const firebaseError = error as { code?: string }
    if (firebaseError.code) {
      ;(wrappedError as typeof wrappedError & { code?: string }).code = firebaseError.code
    }
  }

  ;(wrappedError as typeof wrappedError & { handledType?: string }).handledType = handled.type
  ;(wrappedError as typeof wrappedError & { originalError?: unknown }).originalError = error

  return wrappedError
}

// 🔐 Firebase Authentication Functions
export const firebaseRegister = async (email: string, password: string): Promise<UserCredential> => {
  try {
    console.log('📝 Attempting Firebase registration for:', email);
    
    // Check network connectivity first
    if (!isFirebaseOnline()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    
    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user metadata in Firestore
    try {
      await addDoc(collection(db, 'users'), {
        uid: result.user.uid,
        email: email,
        role: 'user',
        plan: 'free',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });
      console.log('✅ User metadata created in Firestore');
    } catch (metadataError) {
      console.warn('⚠️ Failed to create user metadata:', metadataError);
      // Don't throw here as the user account was created successfully
    }
    
    console.log('✅ Firebase registration successful for:', email);
    return result;
  } catch (error: any) {
    console.error('❌ Firebase registration error:', error);
    
    // Enhanced error handling for specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please try logging in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password accounts are not enabled. Please contact support.');
    }
    
    const handledError = handleFirebaseError(error, 'Firebase registration');
    throw wrapFirebaseError(error, handledError);
  }
}

export const firebaseLogin = async (email: string, password: string): Promise<UserCredential> => {
  try {
    console.log('🔐 Attempting Firebase login for:', email);
    
    // Check network connectivity first
    if (!isFirebaseOnline()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    
    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    
    const result = await retryWithBackoff(async () => {
      return await signInWithEmailAndPassword(auth, email, password);
    }, 2, 1000);
    
    console.log('✅ Firebase login successful for:', email);
    return result;
  } catch (error: any) {
    console.error('❌ Firebase login error:', error);
    
    // Enhanced error handling for specific Firebase auth errors
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address. Please check your email or create a new account.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email format. Please enter a valid email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    const handledError = handleFirebaseError(error, 'Firebase login');
    throw wrapFirebaseError(error, handledError);
  }
}

export const getUserMetadata = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId))
  if (userDoc.exists()) {
    return userDoc.data() // Contains role, plan, etc.
  } else {
    throw new Error('User metadata not found')
  }
}

export const firebaseLogout = async (): Promise<void> => {
  try {
    return await signOut(auth)
  } catch (error) {
    const handledError = handleFirebaseError(error, 'Firebase logout');
    throw wrapFirebaseError(error, handledError);
  }
}

export const firebaseForgotPassword = async (email: string): Promise<void> => {
  try {
    // Check network connectivity first
    if (!isFirebaseOnline()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    return await sendPasswordResetEmail(auth, email)
  } catch (error) {
    const handledError = handleFirebaseError(error, 'Firebase password reset');
    throw wrapFirebaseError(error, handledError);
  }
}

// 💬 Save user-submitted questions to Firestore
export const saveUserQuestion = async (question: string, userId: string): Promise<void> => {
  await addDoc(collection(db, 'user_questions'), {
    userId,
    question,
    createdAt: Timestamp.now()
  })
}
const getPublicIP = async () => {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();
  return data.ip;
};


export const saveUserQnA = async (question: string, answer: string, userId: string,email: string) => {
  const ip = await getPublicIP();
  await addDoc(collection(db, "user_qna"), {
    userId,
    email: email,
    question,
    answer,
    ipAddress: ip,
    createdAt: Timestamp.now(),
  });
};

// 📡 Get Firebase Auth Status (for login session setup)
export interface AuthStatusResponse {
  auth_configured: boolean
  auth_mode: 'firebase'
  access_token: string | null
  core_version: string
  api_version: string
  webui_title?: string
  webui_description?: string
  role?: string | null
  plan?: string | null
}

export const getAuthStatus = async (): Promise<AuthStatusResponse> => {
  const currentUser = getAuth().currentUser
  if (currentUser) {
    const token = await currentUser.getIdToken()
    const metadata = await getUserMetadata(currentUser.uid);
    return {
      auth_configured: true,
      auth_mode: 'firebase',
      access_token: token,
      core_version: 'firebase',
      api_version: 'v1',
      webui_title: 'Firebase Web UI',
      webui_description: 'App powered by Firebase only',
      role: metadata.role,
      plan: metadata.plan
    }
  }

  return {
    auth_configured: false,
    auth_mode: 'firebase',
    access_token: null,
    core_version: 'firebase',
    api_version: 'v1',
    webui_title: 'Firebase Web UI',
    webui_description: 'User not authenticated',
    role: null,
    plan: null
  }
}

// import { auth } from '@/lib/firebase';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   UserCredential,
//   sendPasswordResetEmail
// } from 'firebase/auth';

// export const firebaseRegister = async (email: string, password: string): Promise<UserCredential> => {
//   return await createUserWithEmailAndPassword(auth, email, password);
// };

// export const firebaseLogin = async (email: string, password: string): Promise<UserCredential> => {
//   return await signInWithEmailAndPassword(auth, email, password);
// };

// export const firebaseLogout = async (): Promise<void> => {
//   return await signOut(auth);
// };

// export const firebaseForgotPassword = async (email: string): Promise<void> => {
//   return await sendPasswordResetEmail(auth, email);
// };


// import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

// const db = getFirestore(); // This connects to your Firestore instance

// export const saveUserQuestion = async (question: string, userId: string) => {
//   await addDoc(collection(db, "user_questions"), {
//     userId,
//     question,
//     createdAt: Timestamp.now(),
//   });
// };


// import { getDatabase, ref, push, set } from 'firebase/database';
// import { app } from '@/lib/firebase'; // assuming you initialize `app` elsewhere

// const db = getDatabase(app);

// export const saveQuestionRealtime = async (question: string, userId?: string) => {
//   const questionRef = ref(db, 'questions');
//   const newQuestionRef = push(questionRef);
//   await set(newQuestionRef, {
//     question,
//     userId: userId || 'anonymous',
//     createdAt: Date.now()
//   });
// };
