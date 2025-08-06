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

// 🔐 Firebase Authentication Functions
export const firebaseRegister = async (email: string, password: string): Promise<UserCredential> => {
  try {
    // Check network connectivity first
    if (!isFirebaseOnline()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    return await createUserWithEmailAndPassword(auth, email, password)
  } catch (error) {
    const handledError = handleFirebaseError(error, 'Firebase registration');
    throw new Error(handledError.message);
  }
}

export const firebaseLogin = async (email: string, password: string): Promise<UserCredential> => {
  try {
    // Check network connectivity first
    if (!isFirebaseOnline()) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    return await retryWithBackoff(async () => {
      return await signInWithEmailAndPassword(auth, email, password);
    }, 2, 1000);
  } catch (error) {
    const handledError = handleFirebaseError(error, 'Firebase login');
    throw new Error(handledError.message);
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
    throw new Error(handledError.message);
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
    throw new Error(handledError.message);
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

