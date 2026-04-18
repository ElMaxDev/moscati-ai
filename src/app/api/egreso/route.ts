// ============================================
// API: EGRESO — DUEÑO: Aarón (P1)
// POST /api/egreso → Genera documentos de egreso
// GET  /api/egreso?patientId=X → Checklist de egreso
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { generateDischargeDocuments } from '@/lib/gemini';
import type { DischargeChecklist } from '@/types';

// GET: Checklist de egreso de un paciente
export async function GET(req: NextRequest) {
  try {
    const patientId = req.nextUrl.searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId requerido' }, { status: 400 });
    }

    const { notes, patients } = await getCollections();

    // Verificar qué documentos están listos
    const patient = await patients.findOne({ _id: patientId });
    const patientNotes = await notes.find({ patientId, status: 'signed' }).toArray();

    const checklist: DischargeChecklist = {
      patientId,
      notesSigned: patientNotes.length > 0,
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

    const { patients, notes, auditLog } = await getCollections();

    // Obtener paciente y su última nota firmada
    const patient = await patients.findOne({ _id: patientId });
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado' }, { status: 404 });
    }

    const latestNote = await notes.findOne(
      { patientId, status: 'signed' },
      { sort: { createdAt: -1 } }
    );

    if (!latestNote) {
      return NextResponse.json(
        { success: false, error: 'No hay notas firmadas. Firme la nota médica antes del egreso.' },
        { status: 400 }
      );
    }

    // Generar documentos con Gemini
    const documents = await generateDischargeDocuments(patient, latestNote);

    // Actualizar estado del paciente
    await patients.updateOne(
      { _id: patientId },
      { $set: { status: 'discharged', updatedAt: new Date().toISOString() } }
    );

    // Audit log
    await auditLog.insertOne({
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
