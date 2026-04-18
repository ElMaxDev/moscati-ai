// ============================================
// PANTALLA DE EGRESO — DUEÑO: Uri (P4)
// Pantalla 3: Checklist + Generación docs + Envío aseguradora
// ============================================
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Patient, DischargeDocuments, InsuranceSubmission } from '@/types';

function EgresoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [checklist, setChecklist] = useState({
    notesSigned: true,
    labResultsReady: true,
    dischargeInstructions: false,
    prescriptionReady: false,
    insuranceFormReady: false,
  });
  const [documents, setDocuments] = useState<DischargeDocuments | null>(null);
  const [insurance, setInsurance] = useState<InsuranceSubmission | null>(null);
  const [step, setStep] = useState<'checklist' | 'generating' | 'review' | 'sending' | 'complete'>('checklist');
  const [voiceFeedback, setVoiceFeedback] = useState('');

  // Cargar paciente
  useEffect(() => {
    if (!patientId) return;
    async function load() {
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((p: Patient) => p._id === patientId);
        if (found) setPatient(found);
      }
    }
    load();
  }, [patientId]);

  // Generar documentos de egreso
  const handleGenerateDocuments = async () => {
    setStep('generating');
    try {
      const res = await fetch('/api/egreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        setChecklist(prev => ({
          ...prev,
          dischargeInstructions: true,
          prescriptionReady: true,
          insuranceFormReady: true,
        }));
        setStep('review');
      } else {
        alert(data.error || 'Error generando documentos');
        setStep('checklist');
      }
    } catch {
      alert('Error de conexión');
      setStep('checklist');
    }
  };

  // Enviar a aseguradora
  const handleSendInsurance = async () => {
    if (!patient) return;
    setStep('sending');
    try {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          provider: patient.insuranceProvider,
          documents: ['receta', 'resumen_clinico', 'indicaciones', 'formato_aseguradora'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInsurance(data.data);
        setStep('complete');
        setVoiceFeedback(
          `Doctor, el egreso del paciente ${patient.name} ha sido completado exitosamente. Documentos enviados a ${patient.insuranceProvider}.`
        );
        // Intentar reproducir con ElevenLabs
        playVoiceFeedback(
          `Doctor, el egreso del paciente ${patient.name} ha sido completado. Documentos enviados a ${patient.insuranceProvider}.`
        );
      }
    } catch {
      alert('Error enviando a aseguradora');
      setStep('review');
    }
  };

  // ElevenLabs voice feedback
  const playVoiceFeedback = async (text: string) => {
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch {
      console.warn('ElevenLabs no disponible, usando SpeechSynthesis');
      // Fallback: usar SpeechSynthesis del browser
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const checklistItems = [
    { key: 'notesSigned', label: 'Nota médica firmada', icon: '📋' },
    { key: 'labResultsReady', label: 'Resultados de laboratorio', icon: '🔬' },
    { key: 'dischargeInstructions', label: 'Indicaciones de egreso', icon: '📄' },
    { key: 'prescriptionReady', label: 'Receta médica', icon: '💊' },
    { key: 'insuranceFormReady', label: `Formato aseguradora (${patient?.insuranceProvider || '...'})`, icon: '🏢' },
  ];

  const allReady = Object.values(checklist).every(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button onClick={() => router.push('/')} className="text-primary-400 hover:text-primary-600">Dashboard</button>
        <span className="text-primary-300">/</span>
        <span className="text-primary-700 font-medium">Egreso</span>
      </div>

      {/* Patient header */}
      {patient && (
        <div className="bg-white rounded-xl border border-primary-100 p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-primary-600">
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-primary-900">{patient.name}</h2>
            <p className="text-xs text-primary-500">
              {patient.age} años • {patient.bed} • Aseguradora: {patient.insuranceProvider}
            </p>
          </div>
        </div>
      )}

      {/* ---- STEP: CHECKLIST ---- */}
      {(step === 'checklist' || step === 'review') && (
        <div className="bg-white rounded-xl border border-primary-100 p-6 mb-4">
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <span>📑</span> Checklist de Egreso
          </h3>
          <div className="space-y-3">
            {checklistItems.map(item => {
              const done = checklist[item.key as keyof typeof checklist];
              return (
                <div key={item.key} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  done ? 'bg-success-50' : 'bg-gray-50'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'bg-success-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? '✓' : '·'}
                  </span>
                  <span className="text-sm">{item.icon}</span>
                  <span className={`text-sm ${done ? 'text-primary-800' : 'text-primary-400'}`}>{item.label}</span>
                  {done && <span className="ml-auto text-xs text-success-500 font-medium">Listo</span>}
                </div>
              );
            })}
          </div>

          {/* Botón generar */}
          {!documents && (
            <button
              onClick={handleGenerateDocuments}
              disabled={!checklist.notesSigned}
              className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Generar Documentos de Egreso
            </button>
          )}
        </div>
      )}

      {/* ---- STEP: GENERATING ---- */}
      {step === 'generating' && (
        <div className="bg-white rounded-xl border border-primary-100 p-8 text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Generando documentos de egreso con IA...</p>
          <p className="text-sm text-primary-400 mt-2">Receta, indicaciones, resumen clínico y formato de aseguradora</p>
        </div>
      )}

      {/* ---- STEP: REVIEW (documentos generados) ---- */}
      {step === 'review' && documents && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-primary-100 p-6">
            <h3 className="font-semibold text-primary-900 mb-4">📄 Documentos Generados</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Receta Médica', icon: '💊', data: documents.prescription },
                { name: 'Resumen Clínico', icon: '📋', data: documents.discharge_summary },
                { name: 'Indicaciones al Paciente', icon: '📝', data: documents.patient_instructions },
                { name: `Formato ${patient?.insuranceProvider}`, icon: '🏢', data: documents.insurance_form },
              ].map(doc => (
                <div key={doc.name} className="bg-primary-50 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-primary-100 transition-colors">
                  <span className="text-2xl">{doc.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-primary-800">{doc.name}</p>
                    <p className="text-[11px] text-primary-400">Generado con IA • Click para ver</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen del discharge summary */}
          {documents.discharge_summary && (
            <div className="bg-white rounded-xl border border-primary-100 p-6">
              <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-2">Resumen Clínico de Egreso</h4>
              <div className="space-y-2 text-sm text-primary-700">
                <p><strong>Diagnóstico:</strong> {documents.discharge_summary.discharge_diagnosis}</p>
                <p><strong>Condición al egreso:</strong> {documents.discharge_summary.discharge_condition}</p>
                <p><strong>Seguimiento:</strong> {documents.discharge_summary.follow_up_instructions}</p>
              </div>
            </div>
          )}

          {/* Signos de alarma */}
          {documents.patient_instructions?.warning_signs?.length > 0 && (
            <div className="bg-warning-50 rounded-xl border border-warning-200 p-4">
              <h4 className="text-xs font-bold text-warning-600 uppercase mb-2">⚠️ Signos de Alarma para el Paciente</h4>
              <ul className="space-y-1">
                {documents.patient_instructions.warning_signs.map((sign, i) => (
                  <li key={i} className="text-sm text-primary-700">• {sign}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón enviar a aseguradora */}
          <button
            onClick={handleSendInsurance}
            className="w-full bg-success-500 hover:bg-success-600 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
          >
            🚀 Completar Egreso y Enviar a {patient?.insuranceProvider}
          </button>
        </div>
      )}

      {/* ---- STEP: SENDING ---- */}
      {step === 'sending' && (
        <div className="bg-white rounded-xl border border-primary-100 p-8 text-center">
          <div className="w-12 h-12 border-3 border-success-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Enviando documentos a {patient?.insuranceProvider}...</p>
        </div>
      )}

      {/* ---- STEP: COMPLETE ---- */}
      {step === 'complete' && insurance && (
        <div className="bg-white rounded-xl border border-success-200 p-8 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">Egreso Completado</h2>
          <p className="text-primary-500 mb-6">Todos los documentos fueron generados y enviados exitosamente</p>

          <div className="bg-primary-50 rounded-lg p-4 text-left space-y-2 mb-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm">
              <span className="text-primary-400">Paciente</span>
              <span className="text-primary-800 font-medium">{patient?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-400">Folio {insurance.provider}</span>
              <span className="text-primary-800 font-mono font-medium">{insurance.claimId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-400">Documentos enviados</span>
              <span className="text-primary-800 font-medium">{insurance.documentsReceived}/4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-400">Estado</span>
              <span className="text-success-600 font-medium">Recibido ✓</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-primary-50 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
            <h4 className="text-xs font-bold text-primary-500 uppercase mb-3">Timeline del egreso</h4>
            {[
              { time: 'Hace 5 min', event: 'Consulta iniciada', icon: '🎙️' },
              { time: 'Hace 4 min', event: 'Nota SOAP generada por voz', icon: '📋' },
              { time: 'Hace 3 min', event: 'Nota firmada', icon: '✍️' },
              { time: 'Hace 1 min', event: 'Documentos generados automáticamente', icon: '📄' },
              { time: 'Ahora', event: `Enviado a ${insurance.provider}`, icon: '🚀' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-xs text-primary-400 w-20">{item.time}</span>
                <span>{item.icon}</span>
                <span className="text-sm text-primary-700">{item.event}</span>
              </div>
            ))}
          </div>

          {/* Voice feedback display */}
          {voiceFeedback && (
            <div className="bg-primary-50 rounded-lg p-3 mb-6 flex items-center gap-2 max-w-md mx-auto">
              <span className="text-lg">🔊</span>
              <p className="text-sm text-primary-600 italic">"{voiceFeedback}"</p>
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default function EgresoPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-white rounded-xl" />}>
      <EgresoContent />
    </Suspense>
  );
}
