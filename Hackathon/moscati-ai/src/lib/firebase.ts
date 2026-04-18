// ============================================
// FIREBASE CONNECTION — DUEÑO: Aarón (P1)
// Reemplaza mongodb.ts — usa Firestore como DB
// ============================================
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Opción 1: Service Account JSON como variable de entorno
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId as string,
    });
  }

  // Opción 2: Variables individuales
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
      projectId,
    });
  }

  throw new Error(
    'Firebase no configurado. Define FIREBASE_SERVICE_ACCOUNT o las variables individuales en .env.local'
  );
}

const app = getFirebaseApp();
const db: Firestore = getFirestore(app);

// ============================================
// HELPERS — misma interfaz que teníamos con MongoDB
// ============================================

// Referencia rápida a colecciones
export const collections = {
  patients: () => db.collection('patients'),
  notes: () => db.collection('notes'),
  vitals: () => db.collection('vitals'),
  alerts: () => db.collection('alerts'),
  auditLog: () => db.collection('audit_log'),
  medicalKnowledge: () => db.collection('medical_knowledge'),
};

// Convertir doc de Firestore a objeto con _id
export function docToObj<T>(doc: FirebaseFirestore.DocumentSnapshot): T & { _id: string } {
  return { _id: doc.id, ...doc.data() } as T & { _id: string };
}

// Convertir QuerySnapshot a array de objetos
export function queryToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): (T & { _id: string })[] {
  return snapshot.docs.map(doc => docToObj<T>(doc));
}

export { db };
export default db;
