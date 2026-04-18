// ============================================
// API: EGRESO — DUEÑO: Aarón (P1)
// POST /api/egreso → Genera documentos de egreso
// GET  /api/egreso?patientId=X → Checklist de egreso
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { collections, docToObj, queryToArray } from '@/lib/firebase';
import { generateDischargeDocuments } from '@/lib/gemini';
import type { DischargeChecklist } from '@/types';

// GET: Checklist de egreso de un paciente
export async function GET(req: NextRequest) {
  try {
    const patientId = req.nextUrl.searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId requerido' }, { status: 400 });
    }

    // Verificar qué documentos están listos
    const patientDoc = await collections.patients().doc(patientId).get();

    const notesSnapshot = await collections.notes()
      .where('patientId', '==', patientId)
      .where('status', '==', 'signed')
      .get();

    const checklist: DischargeChecklist = {
      patientId,
      notesSigned: !notesSnapshot.empty,
      labResultsReady: true,  // Simulado como listo
      dischargeInstructions: false,
      prescriptionReady: false,
      insuranceFormReady: false,
      allComplete: false,
    };

    checklist.allComplete = checklist.notesSigned && checklist.labResultsReady;

    return NextResponse.json({ success: true, data: checklist });
  } catch (error) {
    console.error('Error fetching discharge checklist:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener checklist' }, { status: 500 });
  }
}

// POST: Generar todos los documentos de egreso
export async function POST(req: NextRequest) {
  try {
    const { patientId } = await req.json();
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId requerido' }, { status: 400 });
    }

    // Obtener paciente
    const patientDoc = await collections.patients().doc(patientId).get();
    if (!patientDoc.exists) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado' }, { status: 404 });
    }
    const patient = { _id: patientDoc.id, ...patientDoc.data() };

    // Obtener última nota firmada
    const notesSnapshot = await collections.notes()
      .where('patientId', '==', patientId)
      .where('status', '==', 'signed')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (notesSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'No hay notas firmadas. Firme la nota médica antes del egreso.' },
        { status: 400 }
      );
    }

    const latestNote = { _id: notesSnapshot.docs[0].id, ...notesSnapshot.docs[0].data() };

    // Generar documentos con Gemini
    const documents = await generateDischargeDocuments(patient, latestNote);

    // Actualizar estado del paciente
    await collections.patients().doc(patientId).update({
      status: 'discharged',
      updatedAt: new Date().toISOString(),
    });

    // Audit log
    await collections.auditLog().add({
      action: 'discharge_initiated',
      patientId,
      details: `Egreso iniciado. ${Object.keys(documents).length} documentos generados.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error generating discharge:', error);
    return NextResponse.json({ success: false, error: 'Error al generar egreso' }, { status: 500 });
  }
}
