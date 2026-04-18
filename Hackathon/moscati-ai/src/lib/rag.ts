// ============================================
// RAG ENGINE — DUEÑO: Max (P2)
// Busca contexto relevante en Firestore para enriquecer prompts
// Adaptado de MongoDB a Firebase Firestore
// ============================================
import { collections, queryToArray } from './firebase';

// ============================================
// BUSQUEDA DE CONOCIMIENTO MÉDICO
// Firestore no tiene vector search nativo, así que usamos
// búsqueda por tipo + keywords en memoria
// ============================================

async function searchKnowledge(query: string, limit: number = 3) {
  // Obtener todos los documentos de conocimiento (son pocos, ~10-20)
  const snapshot = await collections.medicalKnowledge().get();
  const allDocs = queryToArray<{ type: string; title: string; content: string }>(snapshot);

  // Ranking simple por coincidencia de keywords
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const scored = allDocs.map(doc => {
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
      // Contar ocurrencias en contenido
      const contentMatches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      score += contentMatches * 2;
      // Bonus por match en título
      if (titleLower.includes(keyword)) score += 5;
    }

    return { ...doc, score };
  });

  // Retornar los más relevantes
  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}


// ============================================
// OBTENER CONTEXTO DEL PACIENTE (usado por /api/notes y /api/chat)
// ============================================
export async function getPatientContext(patientId: string, query: string): Promise<string> {
  try {
    // 1. Datos del paciente
    const patientDoc = await collections.patients().doc(patientId).get();
    if (!patientDoc.exists) return 'Paciente no encontrado en la base de datos.';
    const patient = patientDoc.data()!;

    // 2. Últimas notas del paciente
    const notesSnapshot = await collections.notes()
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    const previousNotes = queryToArray<{
      createdAt: string;
      assessment?: { primary_diagnosis?: string };
      plan?: { follow_up?: string };
    }>(notesSnapshot);

    // 3. Buscar conocimiento médico relevante
    const relevantDocs = await searchKnowledge(query);

    // 4. Construir contexto completo
    const context = `
PACIENTE: ${patient.name}, ${patient.age} años, ${patient.gender === 'M' ? 'Masculino' : 'Femenino'}
CAMA: ${patient.bed}
MOTIVO DE INGRESO: ${patient.admissionReason || 'No especificado'}
ANTECEDENTES: ${patient.medicalHistory || 'Sin antecedentes registrados'}
MEDICACIÓN ACTUAL: ${patient.currentMedications?.join(', ') || 'Ninguna'}
ALERGIAS: ${patient.allergies?.join(', ') || 'NKDA (No known drug allergies)'}
ASEGURADORA: ${patient.insuranceProvider || 'No especificada'}

NOTAS PREVIAS:
${previousNotes.length > 0
  ? previousNotes.map(n =>
      `[${n.createdAt}] Dx: ${n.assessment?.primary_diagnosis || 'N/A'} | Plan: ${n.plan?.follow_up || 'N/A'}`
    ).join('\n')
  : 'Primera consulta - sin notas previas'
}

PROTOCOLOS/CONOCIMIENTO RELEVANTE:
${relevantDocs.length > 0
  ? relevantDocs.map(d => d.content).join('\n---\n')
  : 'No se encontraron protocolos específicos.'
}
    `.trim();

    return context;
  } catch (error) {
    console.error('Error getting patient context:', error);
    return 'Error al obtener contexto del paciente. La nota se generará sin contexto adicional.';
  }
}
