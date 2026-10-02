import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string;
  message: string;
  treatment: string;
  status?: AppointmentStatus;
  createdAt: string;
  notes?: string;
};

export type Job = {
  id: string;
  title: string;
  type: string;
  location: string;
  description: string;
  endDate: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  from: 'patient' | 'staff';
  at: string;
};

export type ChatThread = {
  id: string;
  name: string;
  phone: string;
  messages: ChatMessage[];
  updatedAt?: string;
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAGdjGcDQpnxVxh3plO1lCUNooaqciZ0kY',
  authDomain: 'maxglowaesthetic-62207.firebaseapp.com',
  projectId: 'maxglowaesthetic-62207',
  storageBucket: 'maxglowaesthetic-62207.firebasestorage.app',
  messagingSenderId: '86963926002',
  appId: '1:86963926002:web:08de8498f2c82bb5bfb16b',
  measurementId: 'G-63DBM46QCX',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// -------------------------------------------------------------
// APPOINTMENTS (FIRESTORE)
// -------------------------------------------------------------

export async function saveFirestoreAppointment(appointment: Appointment): Promise<void> {
  const cleanAppointment: Appointment = {
    id: appointment.id,
    name: appointment.name || '',
    phone: appointment.phone || '',
    date: appointment.date || '',
    treatment: appointment.treatment || 'A consultation',
    message: appointment.message || '',
    status: appointment.status || 'pending',
    createdAt: appointment.createdAt || new Date().toISOString(),
    notes: appointment.notes || '',
  };

  const docRef = doc(db, 'appointments', cleanAppointment.id);
  await setDoc(docRef, cleanAppointment);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  notes?: string,
): Promise<void> {
  const docRef = doc(db, 'appointments', id);
  const patch: Record<string, unknown> = { status };
  if (notes !== undefined) {
    patch.notes = notes;
  }
  await updateDoc(docRef, patch);
}

export async function deleteAppointment(id: string): Promise<void> {
  const docRef = doc(db, 'appointments', id);
  await deleteDoc(docRef);
}

export function subscribeToFirestoreAppointments(
  onAppointments: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void,
) {
  const appointmentsRef = collection(db, 'appointments');
  const q = query(appointmentsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Appointment;
        appointments.push({
          id: docSnap.id,
          name: data.name || '',
          phone: data.phone || '',
          date: data.date || '',
          treatment: data.treatment || '',
          message: data.message || '',
          status: data.status || 'pending',
          createdAt: data.createdAt || '',
          notes: data.notes || '',
        });
      });
      onAppointments(appointments);
    },
    (err) => {
      console.warn('[Firestore] Ordered query failed, attempting standard collection listener', err);
      // Fallback listener without orderBy in case index isn't ready
      return onSnapshot(
        appointmentsRef,
        (snapshot) => {
          const appointments: Appointment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Appointment;
            appointments.push({
              id: docSnap.id,
              name: data.name || '',
              phone: data.phone || '',
              date: data.date || '',
              treatment: data.treatment || '',
              message: data.message || '',
              status: data.status || 'pending',
              createdAt: data.createdAt || '',
              notes: data.notes || '',
            });
          });
          appointments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          onAppointments(appointments);
        },
        (secondaryErr) => {
          console.error('[Firestore] Appointment subscription error:', secondaryErr);
          if (onError) onError(secondaryErr);
        },
      );
    },
  );
}

// -------------------------------------------------------------
// CAREERS / JOBS (FIRESTORE)
// -------------------------------------------------------------

export function subscribeToFirestoreJobs(
  onJobs: (jobs: Job[]) => void,
  onError?: (err: Error) => void,
) {
  const jobsRef = collection(db, 'jobs');
  return onSnapshot(
    jobsRef,
    (snapshot) => {
      if (snapshot.empty) {
        onJobs([]);
        return;
      }
      const jobs: Job[] = [];
      snapshot.forEach((docSnap) => {
        jobs.push({ id: docSnap.id, ...(docSnap.data() as Omit<Job, 'id'>) });
      });
      onJobs(jobs);
    },
    (err) => {
      console.warn('[Firestore] Jobs subscription error:', err);
      if (onError) onError(err);
    },
  );
}

export async function saveFirestoreJob(job: Job): Promise<void> {
  const docRef = doc(db, 'jobs', job.id);
  await setDoc(docRef, job);
}

export async function deleteFirestoreJob(id: string): Promise<void> {
  const docRef = doc(db, 'jobs', id);
  await deleteDoc(docRef);
}

// -------------------------------------------------------------
// PATIENT CHAT THREADS (FIRESTORE)
// -------------------------------------------------------------

export function subscribeToFirestoreThreads(
  onThreads: (threads: ChatThread[]) => void,
  onError?: (err: Error) => void,
) {
  const threadsRef = collection(db, 'threads');
  return onSnapshot(
    threadsRef,
    (snapshot) => {
      if (snapshot.empty) {
        onThreads([]);
        return;
      }
      const threads: ChatThread[] = [];
      snapshot.forEach((docSnap) => {
        threads.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChatThread, 'id'>) });
      });
      threads.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onThreads(threads);
    },
    (err) => {
      console.warn('[Firestore] Threads subscription error:', err);
      if (onError) onError(err);
    },
  );
}

export async function saveFirestoreThread(thread: ChatThread): Promise<void> {
  const docRef = doc(db, 'threads', thread.id);
  await setDoc(docRef, {
    ...thread,
    updatedAt: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// FIREBASE AUTHENTICATION
// -------------------------------------------------------------

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function signupWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function formatAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'An error occurred during authentication.';
  const code = (error as { code?: string }).code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account was found with this email. You can sign up below.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return (error as { message?: string }).message || 'Failed to authenticate.';
  }
}
