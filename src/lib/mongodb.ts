// ============================================
// MONGODB CONNECTION — DUEÑO: Aarón (P1)
// ============================================
import { MongoClient, Db, Collection } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI no está definida en .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// En desarrollo, usar variable global para no reconectar en cada hot reload
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('auralis');
}

// Helpers para acceso rápido a colecciones
export async function getCollection(name: string): Promise<Collection> {
  const db = await getDb();
  return db.collection(name);
}

// Colecciones con tipo
export async function getCollections() {
  const db = await getDb();
  return {
    patients: db.collection('patients'),
    notes: db.collection('notes'),
    vitals: db.collection('vitals'),
    alerts: db.collection('alerts'),
    auditLog: db.collection('audit_log'),
    medicalKnowledge: db.collection('medical_knowledge'),
  };
}

export default clientPromise;
