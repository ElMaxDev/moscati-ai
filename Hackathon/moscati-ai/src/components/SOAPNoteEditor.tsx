// ============================================
// SOAP NOTE EDITOR — DUEÑO: Uri (P4)
// Nota médica editable que se prellenar con IA
// ESTE ES EL COMPONENTE CORE DEL PRODUCTO
// ============================================
'use client';

import { useState } from 'react';
import type { SOAPNote } from '@/types';

interface SOAPNoteEditorProps {
  note: Partial<SOAPNote> | null;
  isLoading: boolean;
  onSign: (note: SOAPNote) => void;
}

export default function SOAPNoteEditor({ note, isLoading, onSign }: SOAPNoteEditorProps) {
  const [editedNote, setEditedNote] = useState<Partial<SOAPNote> | null>(null);

  // Usar la nota editada o la original
  const currentNote = editedNote || note;

  // Helper para actualizar campos anidados
  const updateField = (section: string, field: string, value: string) => {
    setEditedNote(prev => {
      const base = prev || note || {};
      return {
        ...base,
        [section]: {
          ...(base as Record<string, Record<string, unknown>>)[section],
          [field]: value,
        },
      };
    });
  };

  const updateVitalSign = (field: string, value: string) => {
    setEditedNote(prev => {
      const base = prev || note || {};
      const objective = (base as Record<string, Record<string, unknown>>).objective || {};
      return {
        ...base,
        objective: {
          ...objective,
          vital_signs: {
            ...(objective.vital_signs as Record<string, string> || {}),
            [field]: value,
          },
        },
      };
    });
  };

  const handleSign = () => {
    if (currentNote) {
      onSign({
        ...currentNote,
        status: 'signed',
        signedAt: new Date().toISOString(),
      } as SOAPNote);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-primary-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-primary-600 font-medium">Generando nota SOAP con IA...</span>
        </div>
        {['Subjetivo', 'Objetivo', 'Evaluación', 'Plan'].map(section => (
          <div key={section} className="space-y-2">
            <div className="h-5 bg-primary-100 rounded w-24 animate-pulse" />
            <div className="h-16 bg-primary-50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!currentNote) {
    return (
      <div className="bg-white rounded-xl border border-primary-100 p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-primary-400 text-sm">
          Inicia la grabación de voz para generar la nota médica automáticamente
        </p>
      </div>
    );
  }

  const s = currentNote.subjective;
  const o = currentNote.objective;
  const a = currentNote.assessment;
  const p = currentNote.plan;

  return (
    <div className="bg-white rounded-xl border border-primary-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary-900 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Nota Médica SOAP
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          currentNote.status === 'signed'
            ? 'bg-success-100 text-success-600'
            : 'bg-warning-100 text-warning-600'
        }`}>
          {currentNote.status === 'signed' ? '✅ Firmada' : '📝 Borrador'}
        </span>
      </div>

      {/* CIE-10 Badge */}
      {a?.cie10_code && (
        <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-lg">
          <span className="text-xs font-bold text-primary-500">CIE-10:</span>
          <span className="text-sm font-mono font-semibold text-primary-800">{a.cie10_code}</span>
          <span className="text-xs text-primary-500">— {a.primary_diagnosis}</span>
        </div>
      )}

      {/* SUBJECTIVE */}
      <section className="space-y-2">
        <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Subjetivo (S)
        </h4>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-primary-400 font-medium">Motivo de consulta</label>
            <textarea
              value={s?.chief_complaint || ''}
              onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
              className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="text-[11px] text-primary-400 font-medium">Historia de la enfermedad actual</label>
            <textarea
              value={s?.history_present_illness || ''}
              onChange={(e) => updateField('subjective', 'history_present_illness', e.target.value)}
              className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* OBJECTIVE */}
      <section className="space-y-2">
        <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Objetivo (O)
        </h4>
        {/* Signos vitales en grid */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'blood_pressure', label: 'PA', icon: '💓' },
            { key: 'heart_rate', label: 'FC', icon: '❤️' },
            { key: 'temperature', label: 'Temp', icon: '🌡️' },
            { key: 'spo2', label: 'SpO2', icon: '🫁' },
            { key: 'respiratory_rate', label: 'FR', icon: '💨' },
          ].map(v => (
            <div key={v.key} className="bg-primary-50 rounded-lg p-2 text-center">
              <span className="text-xs">{v.icon}</span>
              <input
                value={(o?.vital_signs as Record<string, string>)?.[v.key] || ''}
                onChange={(e) => updateVitalSign(v.key, e.target.value)}
                className="w-full text-center text-sm font-semibold bg-transparent border-none focus:outline-none text-primary-800"
              />
              <span className="text-[10px] text-primary-400">{v.label}</span>
            </div>
          ))}
        </div>
        <div>
          <label className="text-[11px] text-primary-400 font-medium">Exploración física</label>
          <textarea
            value={o?.physical_exam || ''}
            onChange={(e) => updateField('objective', 'physical_exam', e.target.value)}
            className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
            rows={2}
          />
        </div>
      </section>

      {/* ASSESSMENT */}
      <section className="space-y-2">
        <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          Evaluación (A)
        </h4>
        <div>
          <label className="text-[11px] text-primary-400 font-medium">Diagnóstico principal</label>
          <input
            value={a?.primary_diagnosis || ''}
            onChange={(e) => updateField('assessment', 'primary_diagnosis', e.target.value)}
            className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="text-[11px] text-primary-400 font-medium">Razonamiento clínico</label>
          <textarea
            value={a?.clinical_reasoning || ''}
            onChange={(e) => updateField('assessment', 'clinical_reasoning', e.target.value)}
            className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
            rows={2}
          />
        </div>
      </section>

      {/* PLAN */}
      <section className="space-y-2">
        <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
          Plan (P)
        </h4>
        {/* Medicamentos */}
        {p?.medications && p.medications.length > 0 && (
          <div className="bg-primary-50 rounded-lg p-3">
            <span className="text-[11px] text-primary-400 font-medium">Medicamentos</span>
            <div className="mt-1 space-y-1">
              {p.medications.map((med, i) => (
                <div key={i} className="text-sm text-primary-800 flex items-start gap-1">
                  <span className="text-primary-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                  <span>
                    <strong>{med.name}</strong> {med.dose} — {med.route} — {med.frequency}
                    {med.duration && ` (${med.duration})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Estudios */}
        {p?.studies_ordered && p.studies_ordered.length > 0 && (
          <div>
            <label className="text-[11px] text-primary-400 font-medium">Estudios solicitados</label>
            <p className="text-sm text-primary-800 mt-0.5">{p.studies_ordered.join(', ')}</p>
          </div>
        )}
        <div>
          <label className="text-[11px] text-primary-400 font-medium">Seguimiento</label>
          <textarea
            value={p?.follow_up || ''}
            onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
            className="w-full text-sm p-2 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
            rows={2}
          />
        </div>
      </section>

      {/* Botón Firmar */}
      {currentNote.status !== 'signed' && (
        <button
          onClick={handleSign}
          className="w-full bg-success-500 hover:bg-success-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Firmar y Guardar Nota
        </button>
      )}

      {currentNote.status === 'signed' && (
        <div className="bg-success-50 text-success-600 text-sm p-3 rounded-xl text-center font-medium">
          ✅ Nota firmada por {currentNote.doctorName} — {currentNote.signedAt && new Date(currentNote.signedAt).toLocaleString('es-MX')}
        </div>
      )}
    </div>
  );
}
