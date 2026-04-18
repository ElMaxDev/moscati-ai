// ============================================
// API: NOTES — DUEÑO: Aarón (P1)
// POST /api/notes → Recibe transcripción, genera nota SOAP con Gemini
// GET  /api/notes?patientId=X → Lista notas de un paciente
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { collections, docToObj, queryToArray } from '@/lib/firebase';
import { transcriptionToSOAP } from '@/lib/gemini';
import { getPatientContext } from '@/lib/rag';
import type { SOAPNote } from '@/types';

// POST: Crear nota SOAP desde transcripción
export async function POST(req: NextRequest) {
  try {
    const { transcription, patientId } = await req.json();

    if (!transcription || !patientId) {
      return NextResponse.json(
        { success: false, error: 'transcription y patientId son requeridos' },
        { status: 400 }
      );
    }

    // 1. Obtener datos del paciente
    const patientDoc = await collections.patients().doc(patientId).get();
    if (!patientDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener contexto RAG (historial + protocolos)
    const context = await getPatientContext(patientId, transcription);

    // 3. Gemini genera la nota SOAP
    const soapData = await transcriptionToSOAP(transcription, context);

    // 4. Construir nota completa
    const note: Omit<SOAPNote, '_id'> = {
      patientId,
      doctorName: 'Dr. Martínez',
      ...soapData,
      rawTranscription: transcription,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    // 5. Guardar en Firestore
    const docRef = await collections.notes().add(note);

    // 6. Log de auditoría
    await collections.auditLog().add({
      action: 'note_created',
      patientId,
      details: `Nota SOAP generada desde transcripción de voz. Dx: ${soapData.assessment?.primary_diagnosis}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: docRef.id, ...note },
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

    let query: FirebaseFirestore.Query = collections.notes().orderBy('createdAt', 'desc');
    if (patientId) {
      query = collections.notes()
        .where('patientId', '==', patientId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const notes = queryToArray<SOAPNote>(snapshot);

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notas' },
      { status: 500 }
    );
  }
}
