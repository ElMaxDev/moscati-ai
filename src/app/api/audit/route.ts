// ============================================
// API: AUDIT — DUEÑO: Aarón (P1)
// POST /api/audit → Registrar acción (+ opcional Solana)
// GET  /api/audit → Lista audit log
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    const { auditLog } = await getCollections();

    const result = await auditLog.insertOne({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...entry },
    });
  } catch (error) {
    console.error('Error creating audit entry:', error);
    return NextResponse.json({ success: false, error: 'Error en audit log' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { auditLog } = await getCollections();
    const entries = await auditLog.find().sort({ timestamp: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al obtener audit log' }, { status: 500 });
  }
}
