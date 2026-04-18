// ============================================
// SEED DE DATOS (FIREBASE) — DUEÑO: Luis (P5)
// Ejecutar: npm run seed
// Crea pacientes ficticios y conocimiento médico en Firestore
// ============================================
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Inicializar Firebase Admin
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let credential;

if (serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson) as ServiceAccount;
  credential = cert(sa);
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase no configurado. Define las variables en .env.local');
    process.exit(1);
  }
  credential = cert({ projectId, clientEmail, privateKey } as ServiceAccount);
}

const app = initializeApp({ credential });
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Iniciando seed de MoscatiAI (Firebase)...\n');

  try {
    // ============================================
    // LIMPIAR COLECCIONES
    // ============================================
    const collectionsToClean = ['patients', 'notes', 'vitals', 'alerts', 'audit_log', 'medical_knowledge'];
    for (const col of collectionsToClean) {
      const snapshot = await db.collection(col).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      if (!snapshot.empty) await batch.commit();
    }
    console.log('🗑️  Colecciones limpiadas');

    // ============================================
    // PACIENTES (10 pacientes realistas mexicanos)
    // En Firestore usamos el ID como document ID
    // ============================================
    const patients = [
      {
        id: 'pac-001',
        data: {
          name: 'Carlos Rodríguez Hernández',
          age: 45,
          gender: 'M',
          bed: 'Cama 4',
          status: 'critical',
          triageLevel: 2,
          medicalHistory: 'Hipertensión arterial diagnosticada hace 8 años. Tabaquismo activo (1 cajetilla/día x 20 años). Dislipidemia mixta.',
          currentMedications: ['Losartán 50mg c/12h', 'Atorvastatina 20mg c/24h', 'Aspirina 100mg c/24h'],
          allergies: ['Penicilina', 'Sulfonamidas'],
          insuranceProvider: 'MetLife',
          insurancePolicyNumber: 'ML-2024-78543',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Dolor torácico opresivo de 2 horas de evolución irradiado a brazo izquierdo',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-002',
        data: {
          name: 'María Elena García López',
          age: 62,
          gender: 'F',
          bed: 'Cama 7',
          status: 'warning',
          triageLevel: 3,
          medicalHistory: 'Diabetes mellitus tipo 2 (15 años). Neuropatía diabética. Retinopatía diabética no proliferativa. Hipotiroidismo.',
          currentMedications: ['Metformina 850mg c/8h', 'Glimepirida 4mg c/24h', 'Insulina Glargina 20 UI c/24h', 'Levotiroxina 100mcg c/24h'],
          allergies: ['NKDA'],
          insuranceProvider: 'GNP',
          insurancePolicyNumber: 'GNP-2024-12390',
          admissionDate: new Date(Date.now() - 86400000).toISOString(),
          admissionReason: 'Descontrol glucémico severo con glucosa de 450 mg/dL',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-003',
        data: {
          name: 'José Luis Ramírez Ortiz',
          age: 38,
          gender: 'M',
          bed: 'Cama 2',
          status: 'stable',
          triageLevel: 4,
          medicalHistory: 'Apendicectomía a los 22 años. Sin enfermedades crónicas conocidas.',
          currentMedications: [],
          allergies: ['NKDA'],
          insuranceProvider: 'AXA',
          insurancePolicyNumber: 'AXA-2024-45678',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Lumbalgia mecánica aguda posterior a esfuerzo físico',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-004',
        data: {
          name: 'Ana Patricia Morales Vega',
          age: 28,
          gender: 'F',
          bed: 'Cama 9',
          status: 'stable',
          triageLevel: 3,
          medicalHistory: 'Asma bronquial desde la infancia. Rinitis alérgica.',
          currentMedications: ['Salbutamol inhalado PRN', 'Budesonida/Formoterol 200/6mcg c/12h'],
          allergies: ['Ácido acetilsalicílico', 'Polvo de casa'],
          insuranceProvider: 'MetLife',
          insurancePolicyNumber: 'ML-2024-33210',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Crisis asmática moderada que no cede con tratamiento ambulatorio',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-005',
        data: {
          name: 'Roberto Sánchez Díaz',
          age: 71,
          gender: 'M',
          bed: 'Cama 1',
          status: 'critical',
          triageLevel: 1,
          medicalHistory: 'EPOC Gold III. Cor pulmonale. Fibrilación auricular permanente. Insuficiencia cardíaca NYHA III. Ex-fumador (40 paquetes/año).',
          currentMedications: ['Rivaroxabán 20mg c/24h', 'Furosemida 40mg c/12h', 'Digoxina 0.125mg c/24h', 'Tiotropio 18mcg inhalado c/24h', 'Oxígeno suplementario 2L/min'],
          allergies: ['Metamizol'],
          insuranceProvider: 'IMSS',
          insurancePolicyNumber: 'IMSS-NSS-12345678',
          admissionDate: new Date(Date.now() - 172800000).toISOString(),
          admissionReason: 'Exacerbación aguda de EPOC con insuficiencia respiratoria',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-006',
        data: {
          name: 'Guadalupe Torres Méndez',
          age: 55,
          gender: 'F',
          bed: 'Cama 11',
          status: 'warning',
          triageLevel: 3,
          medicalHistory: 'Hipertensión arterial. Obesidad grado II (IMC 35). Síndrome de apnea obstructiva del sueño.',
          currentMedications: ['Amlodipino 10mg c/24h', 'Hidroclorotiazida 25mg c/24h', 'CPAP nocturno'],
          allergies: ['Ibuprofeno'],
          insuranceProvider: 'GNP',
          insurancePolicyNumber: 'GNP-2024-56789',
          admissionDate: new Date(Date.now() - 43200000).toISOString(),
          admissionReason: 'Cefalea intensa súbita con cifras tensionales de 200/120 mmHg',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-007',
        data: {
          name: 'Fernando Ruiz Castillo',
          age: 33,
          gender: 'M',
          bed: 'Cama 5',
          status: 'stable',
          triageLevel: 4,
          medicalHistory: 'Sin antecedentes patológicos de importancia. Deportista recreativo.',
          currentMedications: [],
          allergies: ['NKDA'],
          insuranceProvider: 'AXA',
          insurancePolicyNumber: 'AXA-2024-11223',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Fractura de radio distal derecho por caída durante actividad deportiva',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-008',
        data: {
          name: 'Sofía Juárez Domínguez',
          age: 42,
          gender: 'F',
          bed: 'Cama 8',
          status: 'stable',
          triageLevel: 3,
          medicalHistory: 'Gastritis crónica. Colecistectomía hace 3 años. Migraña con aura.',
          currentMedications: ['Omeprazol 20mg c/24h', 'Sumatriptán 50mg PRN'],
          allergies: ['Ciprofloxacino'],
          insuranceProvider: 'MetLife',
          insurancePolicyNumber: 'ML-2024-99887',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Dolor abdominal epigástrico intenso con datos de irritación peritoneal',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-009',
        data: {
          name: 'Miguel Ángel Flores Reyes',
          age: 58,
          gender: 'M',
          bed: 'Cama 3',
          status: 'warning',
          triageLevel: 2,
          medicalHistory: 'Diabetes mellitus tipo 2. Enfermedad renal crónica estadio IIIA. Hipertensión arterial. Gota.',
          currentMedications: ['Insulina NPH 30 UI c/12h', 'Enalapril 10mg c/12h', 'Alopurinol 300mg c/24h', 'Eritropoyetina 4000 UI SC semanal'],
          allergies: ['Contraste yodado'],
          insuranceProvider: 'MetLife',
          insurancePolicyNumber: 'ML-2024-44556',
          admissionDate: new Date(Date.now() - 86400000).toISOString(),
          admissionReason: 'Infección de vías urinarias complicada con datos de sepsis',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'pac-010',
        data: {
          name: 'Laura Cristina Peña Aguilar',
          age: 25,
          gender: 'F',
          bed: 'Cama 12',
          status: 'stable',
          triageLevel: 5,
          medicalHistory: 'Ansiedad generalizada. Sin otros antecedentes.',
          currentMedications: ['Sertralina 50mg c/24h'],
          allergies: ['NKDA'],
          insuranceProvider: 'AXA',
          insurancePolicyNumber: 'AXA-2024-77889',
          admissionDate: new Date().toISOString(),
          admissionReason: 'Observación por reacción alérgica a alimento (urticaria generalizada)',
          attendingDoctor: 'Dr. Martínez',
          previousNotes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    // Escribir pacientes con IDs específicos
    const patientBatch = db.batch();
    for (const p of patients) {
      patientBatch.set(db.collection('patients').doc(p.id), p.data);
    }
    await patientBatch.commit();
    console.log(`✅ ${patients.length} pacientes creados`);

    // ============================================
    // ALERTAS INICIALES
    // ============================================
    const alerts = [
      {
        patientId: 'pac-001',
        patientName: 'Carlos Rodríguez Hernández',
        bed: 'Cama 4',
        severity: 'critical',
        type: 'vital_sign',
        message: 'Frecuencia cardíaca elevada: 142 bpm. Posible arritmia.',
        recommendation: 'Realizar ECG inmediato y administrar betabloqueador si no hay contraindicación.',
        acknowledged: false,
        createdAt: new Date().toISOString(),
      },
      {
        patientId: 'pac-005',
        patientName: 'Roberto Sánchez Díaz',
        bed: 'Cama 1',
        severity: 'critical',
        type: 'vital_sign',
        message: 'SpO2 descendiendo: 87%. Requiere ajuste de oxígeno.',
        recommendation: 'Aumentar flujo de O2 a 4L/min. Considerar ventilación no invasiva si no mejora en 15 min.',
        acknowledged: false,
        createdAt: new Date().toISOString(),
      },
      {
        patientId: 'pac-006',
        patientName: 'Guadalupe Torres Méndez',
        bed: 'Cama 11',
        severity: 'high',
        type: 'vital_sign',
        message: 'Presión arterial: 195/115 mmHg. Crisis hipertensiva.',
        recommendation: 'Administrar Captopril 25mg SL. Reevaluar en 30 minutos.',
        acknowledged: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const alertBatch = db.batch();
    for (const alert of alerts) {
      alertBatch.set(db.collection('alerts').doc(), alert);
    }
    await alertBatch.commit();
    console.log(`✅ ${alerts.length} alertas creadas`);

    // ============================================
    // CONOCIMIENTO MÉDICO PARA RAG
    // ============================================
    const knowledge = [
      {
        type: 'protocol',
        title: 'Protocolo de Síndrome Coronario Agudo',
        content: `PROTOCOLO SCA - HOSPITAL MOSCATI\nAnte dolor torácico sugestivo de SCA:\n1. ECG 12 derivaciones en < 10 min\n2. Troponina I o T de alta sensibilidad\n3. BHC, QS, ES, tiempos de coagulación\n4. ASA 300mg VO (si no hay alergia)\n5. Nitroglicerina 0.4mg SL cada 5 min x 3 dosis\n6. Clopidogrel 300mg dosis de carga\n7. Heparina no fraccionada o Enoxaparina\n8. Oxígeno solo si SpO2 < 90%\nCIE-10: I21.0 - I21.9 según localización`,
      },
      {
        type: 'protocol',
        title: 'Protocolo de Descontrol Glucémico',
        content: `PROTOCOLO HIPERGLUCEMIA - HOSPITAL MOSCATI\nGlucosa > 300 mg/dL:\n1. Insulina rápida según esquema: >300: 8UI, >400: 12UI, >500: 16UI SC\n2. Hidratación IV con SSF 0.9% 1000mL en 2h\n3. Monitoreo glucémico cada 2 horas\n4. Gasometría arterial si glucosa > 400\n5. Buscar desencadenante (infección, omisión de dosis)\nCIE-10: E11.65 - DM2 con hiperglucemia`,
      },
      {
        type: 'protocol',
        title: 'Protocolo de Exacerbación de EPOC',
        content: `PROTOCOLO EAEPOC - HOSPITAL MOSCATI\n1. Oxígeno para SpO2 88-92%\n2. Salbutamol 2.5mg + Ipratropio 0.5mg nebulizados cada 4-6h\n3. Metilprednisolona 40mg IV c/8h x 5 días\n4. Antibiótico si esputo purulento: Levofloxacino 750mg IV c/24h\n5. Gasometría arterial basal y a las 2h\n6. Considerar VNI si pH < 7.35 con PaCO2 > 45\nCIE-10: J44.1 - EPOC con exacerbación aguda`,
      },
      {
        type: 'protocol',
        title: 'Protocolo de Crisis Asmática',
        content: `PROTOCOLO ASMA - HOSPITAL MOSCATI\nCrisis moderada-severa:\n1. Salbutamol 2.5mg nebulizado cada 20 min x 3 dosis\n2. Ipratropio 0.5mg nebulizado con primera dosis\n3. Metilprednisolona 60-80mg IV\n4. Oxígeno para SpO2 > 92%\n5. Si no mejora: Sulfato de magnesio 2g IV en 20 min\nCIE-10: J45.21 - Asma moderada con exacerbación aguda`,
      },
      {
        type: 'cie10',
        title: 'Códigos CIE-10 frecuentes en urgencias',
        content: `CÓDIGOS CIE-10 MÁS USADOS:\nI21.9 - Infarto agudo del miocardio\nI10 - Hipertensión esencial\nE11.65 - DM2 con hiperglucemia\nJ44.1 - EPOC con exacerbación aguda\nJ45.21 - Asma moderada con exacerbación\nJ18.9 - Neumonía no especificada\nN39.0 - Infección urinaria\nM54.5 - Lumbago no especificado\nS52.50 - Fractura de radio distal\nK29.7 - Gastritis no especificada\nL50.0 - Urticaria alérgica\nA41.9 - Sepsis no especificada`,
      },
      {
        type: 'medications',
        title: 'Vademécum básico Hospital Moscati',
        content: `MEDICAMENTOS FRECUENTES:\n- Aspirina (ASA): 100-300mg VO. Antiagregante.\n- Losartán: 25-100mg VO c/12-24h. ARA II.\n- Metformina: 500-850mg VO c/8-12h. Antidiabético.\n- Omeprazol: 20-40mg VO/IV c/24h. IBP.\n- Salbutamol: 2.5-5mg nebulizado. Broncodilatador.\n- Insulina Glargina: SC c/24h. Basal.\n- Enoxaparina: 1mg/kg SC c/12h. Anticoagulante.\n- Ceftriaxona: 1-2g IV c/24h. Cefalosporina 3a gen.\n- Ketorolaco: 30mg IV c/8h. AINE. Máx 5 días.\n- Metilprednisolona: 40-125mg IV. Corticoide.`,
      },
      {
        type: 'insurance_template',
        title: 'Campos requeridos por aseguradoras',
        content: `FORMATO ESTÁNDAR ASEGURADORAS EN MÉXICO:\nDatos del asegurado: nombre, póliza, fecha de nacimiento\nPadecimiento: fecha de inicio, diagnóstico con CIE-10\nTratamiento: medicamentos, procedimientos\nEstancia: fecha ingreso, fecha egreso, días\nCostos: desglose por rubro\nMetLife: formulario MC-001, requiere firma digital\nGNP: formulario GNP-HOSP-2024, sello del hospital\nAXA: formato digital vía portal, acepta PDF`,
      },
    ];

    const knowledgeBatch = db.batch();
    for (const doc of knowledge) {
      knowledgeBatch.set(db.collection('medical_knowledge').doc(), doc);
    }
    await knowledgeBatch.commit();
    console.log(`✅ ${knowledge.length} documentos de conocimiento médico creados`);

    // ============================================
    // SIGNOS VITALES INICIALES
    // ============================================
    const now = Date.now();
    const vitalsBatch = db.batch();
    let vitalsCount = 0;

    for (let i = 0; i < 10; i++) {
      const v1 = {
        patientId: 'pac-001',
        heartRate: 130 + Math.floor(Math.random() * 20),
        bloodPressure: { systolic: 155 + Math.floor(Math.random() * 15), diastolic: 95 + Math.floor(Math.random() * 10) },
        spO2: 94 + Math.floor(Math.random() * 3),
        temperature: +(37.2 + Math.random() * 0.5).toFixed(1),
        respiratoryRate: 22 + Math.floor(Math.random() * 4),
        timestamp: new Date(now - (9 - i) * 300000).toISOString(),
      };
      const v2 = {
        patientId: 'pac-005',
        heartRate: 95 + Math.floor(Math.random() * 10),
        bloodPressure: { systolic: 135 + Math.floor(Math.random() * 10), diastolic: 85 + Math.floor(Math.random() * 5) },
        spO2: 85 + Math.floor(Math.random() * 5),
        temperature: +(37.8 + Math.random() * 0.4).toFixed(1),
        respiratoryRate: 28 + Math.floor(Math.random() * 6),
        timestamp: new Date(now - (9 - i) * 300000).toISOString(),
      };
      vitalsBatch.set(db.collection('vitals').doc(), v1);
      vitalsBatch.set(db.collection('vitals').doc(), v2);
      vitalsCount += 2;
    }
    await vitalsBatch.commit();
    console.log(`✅ ${vitalsCount} registros de signos vitales creados`);

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${patients.length} pacientes`);
    console.log(`   - ${alerts.length} alertas`);
    console.log(`   - ${knowledge.length} documentos de conocimiento`);
    console.log(`   - ${vitalsCount} registros de signos vitales`);
    console.log('\n🚀 Ejecuta: npm run dev');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
