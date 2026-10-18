import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Task, StudySession, TimeAttribution, DailyRecord, MonthlyGoal, UserSettings } from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyANVO7HC1TUOhClok6UeKyC9X6iOifYdOY",
  authDomain: "dayzero-e40a9.firebaseapp.com",
  projectId: "dayzero-e40a9",
  storageBucket: "dayzero-e40a9.firebasestorage.app",
  messagingSenderId: "670380538395",
  appId: "1:670380538395:web:44d3788096b1ed502e16be",
  measurementId: "G-T7XK52LQJF"
};

// Check if credentials exist from environment or user settings or defaults
export function initFirebase(customConfig?: UserSettings['firebaseConfig']): boolean {
  if (firebaseApp) return true;

  const config = customConfig && customConfig.apiKey ? customConfig : {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  };

  if (!config.apiKey || !config.projectId) {
    return false;
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);

    // Try offline persistence for browser
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestoreDb).catch((err) => {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.warn('Firestore offline persistence notice:', err.message);
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseAuth) initFirebase();
  return firebaseAuth;
}

export function getFirebaseDb(): Firestore | null {
  if (!firestoreDb) initFirebase();
  return firestoreDb;
}

// Authentication Helpers
export async function authenticateUser(email: string, pass: string, isSignUp = false): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured. Configure project credentials in Settings.');
  
  if (isSignUp) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } else {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  }
}

export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Firestore Sync Methods
export async function syncTaskToCloud(userId: string, task: Task): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/tasks/${task.id}`);
  await setDoc(ref, task, { merge: true });
}

export async function deleteTaskFromCloud(userId: string, taskId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/tasks/${taskId}`);
  await deleteDoc(ref);
}

export async function syncSessionToCloud(userId: string, session: StudySession): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/studySessions/${session.id}`);
  await setDoc(ref, session, { merge: true });
}

export async function syncAttributionToCloud(userId: string, attr: TimeAttribution): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/timeAttributions/${attr.id}`);
  await setDoc(ref, attr, { merge: true });
}

export async function syncDailyRecordToCloud(userId: string, record: DailyRecord): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/dailyRecords/${record.date}`);
  await setDoc(ref, record, { merge: true });
}

export async function syncMonthlyGoalToCloud(userId: string, goal: MonthlyGoal): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !userId) return;
  const ref = doc(db, `users/${userId}/monthlyGoals/${goal.id}`);
  await setDoc(ref, goal, { merge: true });
}

// Subscribe to real-time cloud changes
export function subscribeToCloudTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void
): () => void {
  const db = getFirebaseDb();
  if (!db || !userId) return () => {};

  const q = query(collection(db, `users/${userId}/tasks`));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Task[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Task));
      onUpdate(items);
    },
    (err) => console.warn('Cloud task sync notice:', err.message)
  );
}
