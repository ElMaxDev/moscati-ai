// ============================================
// API: INSURANCE (Mock) — DUEÑO: Aarón (P1)
// POST /api/insurance → Simula envío a aseguradora
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import type { InsuranceSubmission } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { patientId, provider } = await req.json();

    if (!patientId || !provider) {
      return NextResponse.json(
        { success: false, error: 'patientId y provider son requeridos' },
        { status: 400 }
      );
    }

    const { patients, auditLog } = await getCollections();

    const patient = await patients.findOne({ _id: patientId });
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Simular delay de envío (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Respuesta mock de la aseguradora
    const claimId = `CLM-${Date.now().toString(36).toUpperCase()}`;
    const submission: InsuranceSubmission = {
      provider,
      claimId,
      status: 'received',
      documentsReceived: 4,
      estimatedProcessingTime: '24-48 horas',
      message: `Documentos del paciente ${patient.name} recibidos exitosamente por ${provider}. Folio de seguimiento: ${claimId}.`,
      timestamp: new Date().toISOString(),
    };

    // Guardar en audit log
    await auditLog.insertOne({
      action: 'insurance_submitted',
      patientId,
      details: `Documentos enviados a ${provider}. Folio: ${claimId}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('Error submitting to insurance:', error);
    return NextResponse.json(
      { success: false, error: 'Error al enviar a aseguradora' },
      { status: 500 }
    );
  }
}
