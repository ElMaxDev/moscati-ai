// ============================================
// API: PATIENTS — DUEÑO: Aarón (P1)
// GET /api/patients → Lista todos los pacientes
// ============================================
import { NextResponse } from 'next/server';
import { collections, queryToArray } from '@/lib/firebase';
import type { Patient } from '@/types';

export async function GET() {
  try {
    const snapshot = await collections.patients()
      .where('status', '!=', 'discharged')
      .orderBy('status')
      .orderBy('triageLevel', 'asc')
      .get();

    const patients = queryToArray<Patient>(snapshot);

    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}
