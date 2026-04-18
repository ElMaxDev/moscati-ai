// ============================================
// GEMINI AI — DUEÑO: Max (P2)
// Motor de IA para: SOAP, documentos de egreso, chat
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY no configurada');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


// ============================================
// 1. TRANSCRIPCION → NOTA SOAP
// ============================================
export async function transcriptionToSOAP(transcription: string, patientContext: string) {
  const prompt = `Eres un asistente de documentación clínica del Hospital Moscati en Querétaro, México.
Tu tarea es convertir la transcripción de una consulta médica en una nota clínica estructurada en formato SOAP.

REGLAS ESTRICTAS:
1. Usa SOLO la información mencionada en la transcripción. NO inventes datos.
2. Si un campo no tiene información, pon "No referido en consulta".
3. Los códigos CIE-10 deben ser precisos. Si no estás seguro, pon el más cercano con "(probable)" al lado.
4. Los medicamentos deben incluir dosis, vía y frecuencia si se mencionaron.
5. Responde ÚNICAMENTE con el JSON, sin texto adicional, sin markdown.

CONTEXTO DEL PACIENTE (expediente previo):
${patientContext}

TRANSCRIPCIÓN DE LA CONSULTA:
"${transcription}"

RESPONDE EN ESTE FORMATO JSON EXACTO (sin \`\`\`json, solo el JSON puro):
{
  "subjective": {
    "chief_complaint": "motivo principal de consulta",
    "history_present_illness": "descripción detallada del padecimiento actual",
    "review_of_systems": "síntomas por aparatos y sistemas mencionados",
    "allergies_mentioned": "alergias mencionadas o 'No referidas'"
  },
  "objective": {
    "vital_signs": {
      "blood_pressure": "valor o 'No registrada'",
      "heart_rate": "valor o 'No registrada'",
      "temperature": "valor o 'No registrada'",
      "spo2": "valor o 'No registrada'",
      "respiratory_rate": "valor o 'No registrada'"
    },
    "physical_exam": "hallazgos de exploración física mencionados",
    "lab_results": "resultados mencionados o 'Pendientes'"
  },
  "assessment": {
    "primary_diagnosis": "diagnóstico principal",
    "cie10_code": "código CIE-10",
    "secondary_diagnoses": ["otros diagnósticos mencionados"],
    "clinical_reasoning": "razonamiento clínico breve"
  },
  "plan": {
    "medications": [
      {
        "name": "nombre del medicamento",
        "dose": "dosis",
        "route": "vía",
        "frequency": "frecuencia",
        "duration": "duración si se mencionó"
      }
    ],
    "studies_ordered": ["estudios solicitados"],
    "procedures": ["procedimientos indicados"],
    "follow_up": "plan de seguimiento",
    "patient_education": "indicaciones al paciente mencionadas"
  },
  "metadata": {
    "consultation_duration_estimate": "duración estimada en minutos",
    "urgency_level": 3,
    "requires_hospitalization": false,
    "requires_specialist_referral": null
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Limpiar markdown si Gemini lo envuelve
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error('Error parsing Gemini SOAP response:', cleaned);
    // Retornar estructura vacía si falla el parse
    return {
      subjective: {
        chief_complaint: 'Error al procesar transcripción',
        history_present_illness: transcription,
        review_of_systems: 'No procesado',
        allergies_mentioned: 'No procesado',
      },
      objective: {
        vital_signs: { blood_pressure: '-', heart_rate: '-', temperature: '-', spo2: '-', respiratory_rate: '-' },
        physical_exam: 'No procesado',
        lab_results: 'Pendientes',
      },
      assessment: {
        primary_diagnosis: 'Pendiente de clasificación',
        cie10_code: 'Z00.0',
        secondary_diagnoses: [],
        clinical_reasoning: 'La nota requiere revisión manual.',
      },
      plan: {
        medications: [],
        studies_ordered: [],
        procedures: [],
        follow_up: 'Pendiente',
        patient_education: 'Pendiente',
      },
      metadata: {
        consultation_duration_estimate: 'No estimado',
        urgency_level: 3,
        requires_hospitalization: false,
        requires_specialist_referral: null,
      },
    };
  }
}


// ============================================
// 2. GENERAR DOCUMENTOS DE EGRESO
// ============================================
export async function generateDischargeDocuments(patient: Record<string, unknown>, soapNote: Record<string, unknown>) {
  const prompt = `Eres un asistente administrativo del Hospital Moscati. Genera los documentos de egreso
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
  const prompt = `Eres MoscatiAI, asistente médico del Hospital Moscati en Querétaro.
Responde preguntas del doctor de forma concisa, precisa y accionable.
Siempre responde en español. Máximo 3-4 oraciones a menos que se pida más detalle.

CONTEXTO DEL PACIENTE:
${context}

PREGUNTA DEL DOCTOR:
${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
