// ============================================
// VOICE RECORDER — DUEÑO: Uri (P4)
// Componente de grabación de voz con transcripción en vivo
// Este es el COMPONENTE MÁS IMPORTANTE del proyecto
// ============================================
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createSpeechRecognizer } from '@/lib/speech';

interface VoiceRecorderProps {
  onTranscriptionComplete: (fullText: string) => void;
  onTranscribing?: (partialText: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptionComplete, onTranscribing, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const recognizerRef = useRef<Awaited<ReturnType<typeof createSpeechRecognizer>> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef('');

  // Timer de duración
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    setError('');
    setPartialText('');
    setFullTranscript('');
    setDuration(0);
    transcriptRef.current = '';

    try {
      const recognizer = await createSpeechRecognizer({
        onTranscribing: (text) => {
          setPartialText(text);
          onTranscribing?.(transcriptRef.current + ' ' + text);
        },
        onRecognized: (text) => {
          transcriptRef.current += (transcriptRef.current ? ' ' : '') + text;
          setFullTranscript(transcriptRef.current);
          setPartialText('');
          onTranscribing?.(transcriptRef.current);
        },
        onError: (err) => {
          console.error('Speech error:', err);
          setError(err);
        },
      });

      if (!recognizer) {
        setError('No se pudo iniciar el reconocimiento de voz. Usa Chrome.');
        return;
      }

      recognizerRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    } catch (err) {
      setError(`Error al iniciar micrófono: ${err}`);
    }
  }, [onTranscribing]);

  // Detener grabación
  const stopRecording = useCallback(async () => {
    if (recognizerRef.current) {
      await recognizerRef.current.stop();
      recognizerRef.current.dispose();
      recognizerRef.current = null;
    }
    setIsRecording(false);

    const finalText = transcriptRef.current.trim();
    if (finalText) {
      onTranscriptionComplete(finalText);
    }
  }, [onTranscriptionComplete]);

  return (
    <div className="bg-white rounded-xl border border-primary-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary-900 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          Grabación de consulta
        </h3>
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-danger-500 rounded-full recording-dot"></span>
            <span className="text-sm font-mono text-danger-600">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Botón principal */}
      <div className="flex justify-center mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="w-20 h-20 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-primary-200"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-20 h-20 bg-danger-500 hover:bg-danger-600 text-white rounded-full flex items-center justify-center transition-all animate-recording shadow-lg shadow-danger-200"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        )}
      </div>

      <p className="text-center text-xs text-primary-400 mb-4">
        {isRecording
          ? 'Hablando... Presiona el botón rojo para detener'
          : 'Presiona el micrófono para iniciar la consulta'}
      </p>

      {/* Transcripción en vivo */}
      {(fullTranscript || partialText) && (
        <div className="bg-primary-50 rounded-lg p-4 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-primary-400 mb-2">Transcripción en vivo:</p>
          <p className="text-sm text-primary-800 leading-relaxed">
            {fullTranscript}
            {partialText && (
              <span className="text-primary-400 italic"> {partialText}...</span>
            )}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 bg-danger-50 text-danger-600 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
