// ============================================
// API: ALERTS — DUEÑO: Aarón (P1)
// GET /api/alerts → Lista alertas activas
// ============================================
import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

export async function GET() {
  try {
    const { alerts } = await getCollections();
    const activeAlerts = await alerts
      .find({ acknowledged: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ success: true, data: activeAlerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener alertas' }, { status: 500 });
  }
}
