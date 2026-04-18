// ============================================
// RAG ENGINE — DUEÑO: Max (P2)
// Busca contexto relevante en MongoDB para enriquecer prompts
// ============================================
import { getCollections } from './mongodb';

// ============================================
// OPCION 1: Embedding con Gemini + Vector Search
// (Requiere que MongoDB Atlas tenga un vector index creado)
// ============================================
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.warn('⚠️ Error generando embedding, usando búsqueda por texto:', error);
    return [];
  }
}


// ============================================
// OPCION 2: Búsqueda por texto simple (FALLBACK)
// Funciona sin vector index — para cuando no hay tiempo de configurar Atlas Search
// ============================================
async function textSearch(collection: string, query: string, limit: number = 3) {
  const { medicalKnowledge } = await getCollections();

  // Buscar por coincidencia de texto simple
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

  const results = await medicalKnowledge
    .find({
      type: collection,
      $or: keywords.map(keyword => ({
        content: { $regex: keyword, $options: 'i' },
      })),
    })
    .limit(limit)
    .toArray();

  return results;
}


// ============================================
// OBTENER CONTEXTO DEL PACIENTE (usado por /api/notes y /api/chat)
// ============================================
export async function getPatientContext(patientId: string, query: string): Promise<string> {
  try {
    const { patients, notes, medicalKnowledge } = await getCollections();

    // 1. Datos del paciente
    const patient = await patients.findOne({ _id: patientId });
    if (!patient) return 'Paciente no encontrado en la base de datos.';

    // 2. Últimas notas del paciente
    const previousNotes = await notes
      .find({ patientId })
      .sort({ createdAt: -1 })
      .limit(2)
      .toArray();

    // 3. Buscar conocimiento médico relevante
    let relevantDocs: Array<{ content: string }> = [];

    // Intentar vector search primero
    const embedding = await generateEmbedding(query);
    if (embedding.length > 0) {
      try {
        relevantDocs = await medicalKnowledge
          .aggregate([
            {
              $vectorSearch: {
                index: 'medical_vector_index',
                path: 'embedding',
                queryVector: embedding,
                numCandidates: 50,
                limit: 3,
              },
            },
            { $project: { content: 1, type: 1 } },
          ])
          .toArray() as Array<{ content: string }>;
      } catch {
        console.warn('Vector search no disponible, usando text search');
      }
    }

    // Fallback a text search
    if (relevantDocs.length === 0) {
      relevantDocs = await textSearch('protocol', query) as Array<{ content: string }>;
    }

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
${relevantDocs.map(d => d.content).join('\n---\n') || 'No se encontraron protocolos específicos.'}
    `.trim();

    return context;
  } catch (error) {
    console.error('Error getting patient context:', error);
    return 'Error al obtener contexto del paciente. La nota se generará sin contexto adicional.';
  }
}
