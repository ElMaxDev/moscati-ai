// ============================================
// GEMINI AI — DUEÑO: Max (P2)
// Motor de IA para: SOAP, documentos de egreso, chat
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY no configurada');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


// ============================================
// DOCUMENT SCHEMAS (Inyección Dinámica)
// ============================================
const DOCUMENT_SCHEMAS: Record<string, string> = {
  SOAP: `{
    "subjective": {
      "chief_complaint": "motivo principal de consulta",
      "history_present_illness": "descripción detallada del padecimiento actual",
      "review_of_systems": "síntomas por aparatos y sistemas",
      "allergies_mentioned": "alergias mencionadas o 'No referidas'"
    },
    "objective": {
      "vital_signs_mentioned": "signos vitales mencionados",
      "physical_exam": "hallazgos de exploración física"
    },
    "assessment": {
      "primary_diagnosis_natural_language": "diagnóstico principal en lenguaje natural (ej. Apendicitis aguda)",
      "secondary_diagnoses_natural_language": ["otros diagnósticos mencionados"],
      "clinical_reasoning": "razonamiento clínico breve"
    },
    "plan": {
      "medications": [{ "name": "nombre", "dose": "dosis", "frequency": "frecuencia" }],
      "follow_up": "plan de seguimiento"
    }
  }`,
  POST_OP: `{
    "surgical_team": {
      "surgeon_mentioned": "nombre del cirujano principal si se menciona",
      "assistants_mentioned": ["asistentes mencionados"],
      "anesthesiologist_mentioned": "anestesiólogo si se menciona"
    },
    "procedure_details": {
      "pre_op_diagnosis_natural_language": "diagnóstico preoperatorio en lenguaje natural",
      "post_op_diagnosis_natural_language": "diagnóstico postoperatorio en lenguaje natural",
      "procedure_performed_natural_language": "nombre del procedimiento realizado",
      "type_of_anesthesia": "tipo de anestesia"
    },
    "surgical_findings": "hallazgos quirúrgicos detallados",
    "surgical_technique": "descripción de la técnica quirúrgica paso a paso",
    "complications": "complicaciones o 'Ninguna'",
    "estimated_blood_loss": "sangrado estimado o 'No reportado'",
    "specimens_sent": ["muestras enviadas a patología"]
  }`,
  CIRCULATING_NURSE: `{
    "patient_prep": "preparación del paciente (ej. posición, asepsia)",
    "equipment_used": ["equipos y monitores utilizados"],
    "counts": {
      "sponges_correct": true,
      "instruments_correct": true,
      "sharps_correct": true
    },
    "incidents": "incidentes durante transoperatorio o 'Ninguno'",
    "fluids": {
      "iv_fluids_administered": "soluciones administradas",
      "urine_output": "uresis si aplica"
    }
  }`
};

// ============================================
// RESOLUCIÓN DETERMINISTA DE CÓDIGOS (Mitigación Alucinaciones)
// ============================================
// TODO: Conectar a RAG o DB para catálogo CIE-10 / CPT real.
async function resolveClinicalCodes(diagnosisText: string | undefined): Promise<{ code: string; label: string }> {
  if (!diagnosisText) return { code: "Z00.0", label: "No especificado" };

  const text = diagnosisText.toLowerCase();
  if (text.includes('apendicitis')) return { code: "K35.8", label: "Apendicitis aguda" };
  if (text.includes('colecistitis')) return { code: "K81.9", label: "Colecistitis, no especificada" };
  if (text.includes('hipertension') || text.includes('hta')) return { code: "I10.X", label: "Hipertensión esencial" };
  if (text.includes('diabetes')) return { code: "E11.9", label: "Diabetes mellitus tipo 2" };

  return { code: "R69", label: "Causas de morbilidad desconocidas y no especificadas" }; // Fallback genérico
}

// ============================================
// 1. GENERACIÓN DE DOCUMENTOS (Motor Dinámico)
// ============================================
export async function generateStructuredClinicalNote(
  transcription: string,
  patientContext: string,
  documentType: 'SOAP' | 'POST_OP' | 'CIRCULATING_NURSE',
  authorRole: string,
  authorId: string
) {
  const targetSchema = DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS['SOAP'];

  const prompt = `Eres un asistente de documentación clínica automatizada de Auralis Health.
Tu tarea es convertir una transcripción dictada por un ${authorRole} en un documento estructurado de tipo: ${documentType}.

REGLAS ESTRICTAS (NOM-004 / Seguridad del Paciente):
1. Usa SOLO la información mencionada en la transcripción. NO inventes datos ni asumas resultados.
2. Si un campo no tiene información en el audio, pon "No referido" o null según corresponda.
3. NO generes códigos médicos (CIE-10/CPT). Extrae diagnósticos y procedimientos SOLO en lenguaje natural. El sistema resolverá los códigos internamente.
4. Responde ÚNICAMENTE con el JSON, sin texto adicional, sin markdown.

CONTEXTO DEL PACIENTE (Expediente previo):
${patientContext}

TRANSCRIPCIÓN DICTADA (Rol: ${authorRole}):
"${transcription}"

RESPONDE EN ESTE FORMATO JSON EXACTO (sin \`\`\`json, solo el JSON puro):
${targetSchema}`;

  let text = '';
  
  try {
    // INTENTO 1: OLLAMA (MODELO LOCAL PRIVADO)
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', 
        prompt: prompt,
        stream: false,
        format: 'json' 
      })
    });

    if (ollamaResponse.ok) {
      const result = await ollamaResponse.json();
      text = result.response;
      console.log('✅ Nota estructurada exitosamente vía Llama 3 (Ollama Local)');
    } else {
      throw new Error(`Ollama retornó status: ${ollamaResponse.status}`);
    }

  } catch (ollamaError) {
    console.warn('⚠️ Ollama no disponible localmente. Intentando con Google Gemini Cloud...');
    
    // INTENTO 2: GOOGLE GEMINI (NUBE)
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
      console.log('✅ Nota estructurada exitosamente vía Google Gemini');
    } catch (geminiError: any) {
      console.error('Gemini API Error:', geminiError);
      console.warn('⚠️ GOOGLE GEMINI FALLÓ (Posible límite de cuota 429). ACTIVANDO MODO SIMULADO DE RESPALDO.');
      
      // INTENTO 3: FALLBACK SIMULADO
      text = JSON.stringify({
        subjective: {
          chief_complaint: transcription.substring(0, 50) + '...',
          history_present_illness: "Generado automáticamente por sistema de respaldo debido a errores en servidores de IA.",
          review_of_systems: "No referido",
          allergies_mentioned: "No referidas"
        },
        objective: {
          vital_signs_mentioned: "No referidos",
          physical_exam: "Pendiente de explorar"
        },
        assessment: {
          primary_diagnosis_natural_language: "Diagnóstico en evaluación (Modo Offline)",
          secondary_diagnoses_natural_language: [],
          clinical_reasoning: "Múltiples fallas en Ollama y Gemini. Esta es una nota de respaldo temporal."
        },
        plan: {
          medications: [],
          follow_up: "Reevaluar conexión a internet o cuota de API."
        }
      });
    }
  }

  // Limpiar markdown si Llama3 lo envuelve por accidente
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let extractedData;
  try {
    extractedData = JSON.parse(cleaned);
  } catch (error) {
    console.error('Error parsing Ollama response:', cleaned);
    throw new Error('La IA Local no devolvió un JSON válido.');
  }

  // --- PIPELINE DE RESOLUCIÓN DE CÓDIGOS (Anti-Alucinaciones) ---
  let resolved_codes = {};
  if (documentType === 'SOAP' && extractedData.assessment?.primary_diagnosis_natural_language) {
    const codeData = await resolveClinicalCodes(extractedData.assessment.primary_diagnosis_natural_language);
    resolved_codes = { primary_diagnosis_code: codeData.code, primary_diagnosis_label: codeData.label };
  } else if (documentType === 'POST_OP' && extractedData.procedure_details?.post_op_diagnosis_natural_language) {
    const codeData = await resolveClinicalCodes(extractedData.procedure_details.post_op_diagnosis_natural_language);
    resolved_codes = { post_op_diagnosis_code: codeData.code, post_op_diagnosis_label: codeData.label };
  }

  // --- TRAZABILIDAD (Cumplimiento NOM-024) ---
  const finalDocument = {
    document_content: extractedData,
    clinical_codes_resolved: resolved_codes,
    audit_metadata: {
      document_type: documentType,
      author_id: authorId,
      author_role: authorRole,
      created_at_iso: new Date().toISOString(), // Server-side strict timestamp
      system_version: "2.0.0",
      legal_disclaimer: "Documento generado por IA procesando dictado de voz. Pendiente de firma electrónica."
    }
  };

  return finalDocument;
}


// ============================================
// 2. GENERAR DOCUMENTOS DE EGRESO
// ============================================
export async function generateDischargeDocuments(patient: Record<string, unknown>, soapNote: Record<string, unknown>) {
  const prompt = `Eres un asistente administrativo de Auralis Health. Genera los documentos de egreso
basándote en los datos del paciente y su nota clínica.

PACIENTE: ${JSON.stringify(patient, null, 2)}
NOTA CLÍNICA: ${JSON.stringify(soapNote, null, 2)}

Genera en JSON puro (sin markdown):
{
  "prescription": {
    "medications": [
      { "name": "...", "dose": "...", "route": "...", "frequency": "...", "duration": "..." }
    ],
    "general_instructions": "instrucciones generales al paciente"
  },
  "discharge_summary": {
    "admission_reason": "motivo de ingreso",
    "hospital_course": "evolución durante la estancia",
    "discharge_condition": "condición al egreso",
    "discharge_diagnosis": "diagnóstico de egreso con CIE-10",
    "follow_up_instructions": "indicaciones de seguimiento"
  },
  "patient_instructions": {
    "diet": "indicaciones dietéticas",
    "activity": "nivel de actividad permitido",
    "warning_signs": ["signo de alarma 1", "signo de alarma 2", "signo de alarma 3"],
    "next_appointment": "cuándo regresar a consulta"
  },
  "insurance_form": {
    "diagnosis_code": "código CIE-10 principal",
    "procedure_codes": ["códigos de procedimientos realizados"],
    "length_of_stay": "días de estancia",
    "total_charges_estimate": "estimado en MXN"
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error('Error parsing discharge documents:', cleaned);
    return {
      prescription: { medications: [], general_instructions: 'Error al generar. Revisar manualmente.' },
      discharge_summary: { admission_reason: '-', hospital_course: '-', discharge_condition: '-', discharge_diagnosis: '-', follow_up_instructions: '-' },
      patient_instructions: { diet: '-', activity: '-', warning_signs: [], next_appointment: '-' },
      insurance_form: { diagnosis_code: '-', procedure_codes: [], length_of_stay: '-', total_charges_estimate: '-' },
    };
  }
}


// ============================================
// 3. CHAT MEDICO CON CONTEXTO
// ============================================
export async function chatWithContext(question: string, context: string): Promise<string> {
  const prompt = `Eres Auralis Health, asistente médico inteligente.
Responde preguntas del doctor de forma concisa, precisa y accionable.
Siempre responde en español. Máximo 3-4 oraciones a menos que se pida más detalle.

CONTEXTO DEL PACIENTE:
${context}

PREGUNTA DEL DOCTOR:
${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
