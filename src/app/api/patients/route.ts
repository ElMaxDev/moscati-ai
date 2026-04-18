// ============================================
// API: PATIENTS — DUEÑO: Aarón (P1)
// GET /api/patients → Lista todos los pacientes
// ============================================
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

export async function GET() {
  try {
    const { patients } = await getCollections();
    const allPatients = await patients
      .find({ status: { $ne: 'discharged' } })
      .sort({ triageLevel: 1, updatedAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: allPatients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}
