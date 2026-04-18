// ============================================
// API: NOTES — DUEÑO: Aarón (P1)
// POST /api/notes → Recibe transcripción, genera nota SOAP con Gemini
// GET  /api/notes?patientId=X → Lista notas de un paciente
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { generateStructuredClinicalNote } from '@/lib/gemini';
import { getPatientContext } from '@/lib/rag';
import type { ClinicalDocument } from '@/types';

// POST: Crear nota SOAP desde transcripción
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      transcription, 
      patientId, 
      documentType = 'SOAP', 
      authorRole = 'Médico Adscrito', 
      authorId = 'dr_123' 
    } = body;

    if (!transcription || !patientId) {
      return NextResponse.json(
        { success: false, error: 'transcription y patientId son requeridos' },
        { status: 400 }
      );
    }

    const { patients, notes, auditLog } = await getCollections();

    // 1. Obtener datos del paciente
    const patient = await patients.findOne({ _id: patientId });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener contexto RAG (historial + protocolos)
    const context = await getPatientContext(patientId, transcription);

    // 3. Gemini genera la nota estructurada y metadatos
    const generatedData = await generateStructuredClinicalNote(
      transcription, 
      context, 
      documentType, 
      authorRole, 
      authorId
    );

    // 4. Construir documento completo
    const note: Omit<ClinicalDocument, '_id'> = {
      patientId,
      doctorName: authorId,
      ...generatedData,
      rawTranscription: transcription,
      status: 'draft',
      createdAt: generatedData.audit_metadata.created_at_iso,
    };

    // 5. Guardar en MongoDB
    const result = await notes.insertOne(note);

    // 6. Log de auditoría
    await auditLog.insertOne({
      action: 'note_created',
      patientId,
      details: `Documento ${documentType} generado desde transcripción de voz.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...note },
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar nota médica' },
      { status: 500 }
    );
  }
}

// GET: Obtener notas de un paciente
export async function GET(req: NextRequest) {
  try {
    const patientId = req.nextUrl.searchParams.get('patientId');
    const { notes } = await getCollections();

    const query = patientId ? { patientId } : {};
    const allNotes = await notes
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: allNotes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notas' },
      { status: 500 }
    );
  }
}
