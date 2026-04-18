'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';
import type { Patient, ClinicalDocument } from '@/types';

function ConsultaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clinicalNote, setClinicalNote] = useState<ClinicalDocument | null>(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    async function fetchPatient() {
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        const data = await res.json();
        if (data.success) {
          setPatient(data.data);
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [patientId]);

  const handleTranscriptionComplete = async (transcription: string) => {
    if (!transcription.trim()) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription, patientId: patientId || 'unknown' })
      });
      const data = await res.json();
      
      if (data.success) {
        setClinicalNote(data.data);
      } else {
        alert('Error al generar la nota SOAP (revisa los logs del servidor API).');
      }
    } catch (error) {
      console.error('Error procesando nota:', error);
      alert('Error de red al procesar la nota');
    } finally {
      setProcessing(false);
    }
  };

  const handleSignNote = async () => {
    if (!clinicalNote || !clinicalNote._id) {
        alert('Nota firmada guardada en modo local (demo).');
        router.push('/');
        return;
    }
    
    try {
        await fetch(`/api/notes/${clinicalNote._id}/sign`, { method: 'PUT' });
        router.push('/');
    } catch (error) {
        console.error(error);
        alert('Error al firmar nota');
    }
  };

  if (loading) return <div className="p-8 text-center text-primary-500 animate-pulse">Cargando paciente...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header y botón de volver */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/')} className="p-2 bg-white rounded-full border border-primary-200 text-primary-500 hover:bg-primary-50 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-2xl font-bold text-primary-900">Nueva Consulta</h2>
      </div>

      {/* Info del paciente */}
      {patient ? (
        <div className="bg-white p-5 rounded-xl border border-primary-100 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">{patient.name}</h3>
            <p className="text-sm text-primary-500">Cama: {patient.bed} • {patient.age} años • Sexo: {patient.gender}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${patient.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              Estado: {patient.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-xl border border-primary-100">
          <p className="text-sm text-primary-500">Consulta general (sin paciente específico seleccionado).</p>
        </div>
      )}

      {/* Grabadora */}
      {!clinicalNote && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 shadow-sm">
            <strong>Instrucciones:</strong> Presiona el botón del micrófono y comienza a dictar la nota clínica en voz alta. Al terminar, presiona el botón rojo para detener la grabación. La IA procesará tu audio y estructurará automáticamente el formato SOAP.
          </div>
          
          <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} disabled={processing} />
          
          {processing && (
            <div className="text-center py-10 bg-white rounded-xl border border-primary-100">
              <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary-700 font-medium animate-pulse">Procesando audio y estructurando nota SOAP...</p>
              <p className="text-xs text-primary-400 mt-2">Usando Gemini AI</p>
            </div>
          )}
        </div>
      )}

      {/* Resultado Documento Clínico */}
      {clinicalNote && (
        <div className="bg-white rounded-xl border border-primary-100 p-6 space-y-6 shadow-md">
          <div className="flex justify-between items-center border-b border-primary-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-primary-900">Documento Clínico: {clinicalNote.audit_metadata?.document_type || 'SOAP'}</h3>
              <p className="text-xs text-primary-500 mt-1">Estructurado automáticamente con IA</p>
            </div>
            <button onClick={handleSignNote} className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary-200 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Firmar y Guardar
            </button>
          </div>
          
          <div className="space-y-5">
            {clinicalNote.audit_metadata?.document_type === 'SOAP' ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-primary-700 uppercase mb-2 flex items-center gap-2">
                     <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">S</span> 
                     Subjetivo
                  </h4>
                  <div className="text-sm text-primary-800 bg-primary-50 p-4 rounded-lg border border-primary-100/50">
                    <p><strong>Motivo de consulta:</strong> {clinicalNote.document_content?.subjective?.chief_complaint || 'N/A'}</p>
                    <p className="mt-2"><strong>Historia:</strong> {clinicalNote.document_content?.subjective?.history_present_illness || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-primary-700 uppercase mb-2 flex items-center gap-2">
                     <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">O</span> 
                     Objetivo
                  </h4>
                  <div className="text-sm text-primary-800 bg-primary-50 p-4 rounded-lg border border-primary-100/50 whitespace-pre-wrap">
                    {clinicalNote.document_content?.objective?.physical_exam || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-primary-700 uppercase mb-2 flex items-center gap-2">
                     <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">A</span> 
                     Análisis
                  </h4>
                  <div className="text-sm text-primary-800 bg-primary-50 p-4 rounded-lg border border-primary-100/50">
                    <p className="text-base text-primary-900 mb-2"><strong>Diagnóstico:</strong> {clinicalNote.document_content?.assessment?.primary_diagnosis_natural_language || 'N/A'} {clinicalNote.clinical_codes_resolved?.primary_diagnosis_code ? `(${clinicalNote.clinical_codes_resolved.primary_diagnosis_code})` : ''}</p>
                    <p><strong>Razonamiento:</strong> {clinicalNote.document_content?.assessment?.clinical_reasoning || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-primary-700 uppercase mb-2 flex items-center gap-2">
                     <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center">P</span> 
                     Plan
                  </h4>
                  <div className="text-sm text-primary-800 bg-primary-50 p-4 rounded-lg border border-primary-100/50">
                    {clinicalNote.document_content?.plan?.medications && clinicalNote.document_content.plan.medications.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold mb-1">Medicamentos:</p>
                        <ul className="list-disc list-inside">
                          {clinicalNote.document_content.plan.medications.map((m: any, i: number) => (
                            <li key={i}>{m.name} {m.dose} - {m.frequency} por {m.duration}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p><strong>Seguimiento:</strong> {clinicalNote.document_content?.plan?.follow_up || 'N/A'}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-primary-800 bg-primary-50 p-4 rounded-lg border border-primary-100/50">
                <p className="font-bold mb-2">Contenido Dinámico Extraído ({clinicalNote.audit_metadata?.document_type}):</p>
                <pre className="whitespace-pre-wrap font-sans text-xs">
                  {JSON.stringify(clinicalNote.document_content, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-xs text-gray-500">
               <div><strong>ID Autor:</strong> {clinicalNote.audit_metadata?.author_id} ({clinicalNote.audit_metadata?.author_role})</div>
               <div><strong>Firma IA:</strong> {clinicalNote.audit_metadata?.created_at_iso}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Consulta() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse text-primary-500">Cargando...</div>}>
      <ConsultaContent />
    </Suspense>
  );
}
