// ============================================
// API: ALERTS — DUEÑO: Aarón (P1)
// GET /api/alerts → Lista alertas activas
// ============================================
import { NextResponse } from 'next/server';
import { collections, queryToArray } from '@/lib/firebase';
import type { Alert } from '@/types';

export async function GET() {
  try {
    const snapshot = await collections.alerts()
      .where('acknowledged', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const alerts = queryToArray<Alert>(snapshot);

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener alertas' }, { status: 500 });
  }
}
