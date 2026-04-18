// ============================================
// ALERT BANNER — DUEÑO: Cris (P3)
// Banner de alertas críticas en la parte superior
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  useEffect(() => {
    if (criticalAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % criticalAlerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [criticalAlerts.length]);

  if (criticalAlerts.length === 0) return null;

  const current = criticalAlerts[currentIndex];

  return (
    <div className={`mb-4 rounded-xl p-3 flex items-center justify-between ${
      current.severity === 'critical'
        ? 'bg-danger-50 border border-danger-200'
        : 'bg-warning-50 border border-warning-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full recording-dot ${
          current.severity === 'critical' ? 'bg-danger-500' : 'bg-warning-500'
        }`} />
        <div>
          <p className="text-sm font-medium text-primary-900">
            {current.severity === 'critical' ? '⚠️ ALERTA CRÍTICA' : '⚡ ALERTA'}: {current.patientName} — {current.bed}
          </p>
          <p className="text-xs text-primary-600 mt-0.5">{current.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {criticalAlerts.length > 1 && (
          <span className="text-xs text-primary-400">{currentIndex + 1}/{criticalAlerts.length}</span>
        )}
        <button
          onClick={() => onDismiss(current._id || '')}
          className="text-xs px-3 py-1 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
        >
          Atendida
        </button>
      </div>
    </div>
  );
}
