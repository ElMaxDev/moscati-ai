// ============================================
// API: AUDIT — DUEÑO: Aarón (P1)
// POST /api/audit → Registrar acción
// GET  /api/audit → Lista audit log
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { collections, queryToArray } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();

    const docRef = await collections.auditLog().add({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: docRef.id, ...entry },
    });
  } catch (error) {
    console.error('Error creating audit entry:', error);
    return NextResponse.json({ success: false, error: 'Error en audit log' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await collections.auditLog()
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const entries = queryToArray(snapshot);
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al obtener audit log' }, { status: 500 });
  }
}
