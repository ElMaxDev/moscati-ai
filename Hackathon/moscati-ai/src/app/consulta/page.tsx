// ============================================
// PANTALLA DE CONSULTA — DUEÑO: Uri (P4) + Cris (P3)
// Pantalla 2: Grabación de voz + Nota SOAP en tiempo real
// ESTA ES LA PANTALLA MÁS IMPORTANTE DEL DEMO
// ============================================
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';
import SOAPNoteEditor from '@/components/SOAPNoteEditor';
import type { Patient, SOAPNote } from '@/types';

function ConsultaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [soapNote, setSoapNote] = useState<Partial<SOAPNote> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState('');

  // Cargar paciente
  useEffect(() => {
    if (!patientId) return;
    async function load() {
      try {
        const res = await fetch('/api/patients');
        const data = await res.json();
        if (data.success) {
          const found = data.data.find((p: Patient) => p._id === patientId);
          if (found) setPatient(found);
        }
      } catch (err) {
        console.error('Error loading patient:', err);
      }
    }
    load();
  }, [patientId]);

  // Cuando termina la grabación → enviar a Gemini
  const handleTranscriptionComplete = useCallback(async (fullText: string) => {
    if (!patientId) {
      setError('No hay paciente seleccionado');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: fullText, patientId }),
      });

      const data = await res.json();

      if (data.success) {
        setSoapNote(data.data);
      } else {
        setError(data.error || 'Error al generar la nota');
      }
    } catch (err) {
      setError('Error de conexión al generar la nota');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [patientId]);

  // Firmar nota
  const handleSign = async (signedNote: SOAPNote) => {
    try {
      // En producción: PUT /api/notes/[id]/sign
      // Para el hackathon: simular firma local
      setSoapNote({ ...signedNote, status: 'signed', signedAt: new Date().toISOString() });
      setIsSigned(true);

      // Registrar en audit log
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note_signed',
          patientId,
          details: `Nota SOAP firmada. Dx: ${signedNote.assessment?.primary_diagnosis}`,
        }),
      });
    } catch (err) {
      console.error('Error signing note:', err);
    }
  };

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => router.push('/')} className="text-primary-400 hover:text-primary-600">
            Dashboard
          </button>
          <span className="text-primary-300">/</span>
          <span className="text-primary-700 font-medium">Consulta</span>
        </div>
        {isSigned && (
          <button
            onClick={() => router.push(`/egreso?patientId=${patientId}`)}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            Continuar a Egreso →
          </button>
        )}
      </div>

      {/* Patient header */}
      {patient && (
        <div className="bg-white rounded-xl border border-primary-100 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-primary-900">{patient.name}</h2>
              <p className="text-xs text-primary-500">
                {patient.age} años • {patient.gender === 'M' ? 'Masculino' : 'Femenino'} • {patient.bed} • {patient.insuranceProvider}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-400">Alergias</p>
            <p className="text-sm font-medium text-danger-600">
              {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'NKDA'}
            </p>
          </div>
        </div>
      )}

      {/* Layout de 2 columnas: Voz izquierda | Nota derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Columna izquierda: Grabación (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          <VoiceRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onTranscribing={setLiveTranscript}
            disabled={!patientId}
          />

          {/* Info del paciente compacta */}
          {patient && (
            <div className="bg-white rounded-xl border border-primary-100 p-4 space-y-2">
              <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider">Contexto del paciente</h4>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[11px] text-primary-400">Motivo de ingreso</span>
                  <p className="text-sm text-primary-800">{patient.admissionReason}</p>
                </div>
                <div>
                  <span className="text-[11px] text-primary-400">Antecedentes</span>
                  <p className="text-sm text-primary-800">{patient.medicalHistory}</p>
                </div>
                <div>
                  <span className="text-[11px] text-primary-400">Medicación actual</span>
                  <p className="text-sm text-primary-800">{patient.currentMedications?.join(', ') || 'Ninguna'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Nota SOAP (3/5) */}
        <div className="lg:col-span-3">
          <SOAPNoteEditor
            note={soapNote}
            isLoading={isGenerating}
            onSign={handleSign}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 bg-danger-50 border border-danger-200 text-danger-600 p-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default function ConsultaPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-white rounded-xl" />}>
      <ConsultaContent />
    </Suspense>
  );
}
