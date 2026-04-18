// ============================================
// API: VOICE (ElevenLabs TTS) — DUEÑO: Uri (P4)
// POST /api/voice → Genera audio desde texto
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { generateVoiceAudio } from '@/lib/elevenlabs';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'text es requerido' }, { status: 400 });
    }

    const audioBuffer = await generateVoiceAudio(text);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('ElevenLabs error:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando audio. ElevenLabs no disponible.' },
      { status: 500 }
    );
  }
}
