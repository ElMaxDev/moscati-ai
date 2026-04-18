// ============================================
// API: CHAT — DUEÑO: Aarón (P1)
// POST /api/chat → Chat médico con contexto RAG
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { chatWithContext } from '@/lib/gemini';
import { getPatientContext } from '@/lib/rag';

export async function POST(req: NextRequest) {
  try {
    const { message, patientId } = await req.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'message es requerido' }, { status: 400 });
    }

    // Obtener contexto si hay paciente seleccionado
    let context = 'No hay paciente seleccionado. Responde con conocimiento médico general.';
    if (patientId) {
      context = await getPatientContext(patientId, message);
    }

    const reply = await chatWithContext(message, context);

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ success: false, error: 'Error en el chat' }, { status: 500 });
  }
}
