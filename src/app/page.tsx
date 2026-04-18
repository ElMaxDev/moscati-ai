// ============================================
// DASHBOARD PRINCIPAL — DUEÑO: Cris (P3)
// Pantalla 1: Grid de pacientes + alertas + stats
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientCard from '@/components/PatientCard';
import AlertBanner from '@/components/AlertBanner';
import StatsBar from '@/components/StatsBar';
import type { Patient, Alert } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar pacientes
  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, alertsRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/alerts'),
        ]);
        const patientsData = await patientsRes.json();
        const alertsData = await alertsRes.json();

        if (patientsData.success) setPatients(patientsData.data);
        if (alertsData.success) setAlerts(alertsData.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar pacientes
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const criticalCount = patients.filter(p => p.status === 'critical').length;
  const warningCount = patients.filter(p => p.status === 'warning').length;

  // Handlers
  const handleSelectPatient = (patient: Patient) => {
    router.push(`/consulta?patientId=${patient._id}`);
  };

  const handleDischarge = (patient: Patient) => {
    router.push(`/egreso?patientId=${patient._id}`);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a._id !== alertId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton stats */}
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-primary-100 p-3 h-20 animate-pulse" />
          ))}
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-primary-100 p-4 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Alertas */}
      <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Stats */}
      <StatsBar
        totalPatients={patients.length}
        criticalCount={criticalCount}
        warningCount={warningCount}
        dischargedToday={0}
        pendingNotes={patients.filter(p => p.status !== 'discharged').length}
      />

      {/* Header con búsqueda */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Pacientes activos</h2>
          <p className="text-sm text-primary-400">{patients.length} pacientes en el sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar paciente o cama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 w-64"
            />
          </div>
          {/* Botón nueva consulta */}
          <button
            onClick={() => router.push('/consulta')}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nueva consulta
          </button>
        </div>
      </div>

      {/* Grid de pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((patient) => (
          <PatientCard
            key={patient._id}
            patient={patient}
            onSelect={handleSelectPatient}
            onDischarge={handleDischarge}
          />
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-primary-400">
          <p className="text-lg">No se encontraron pacientes</p>
          <p className="text-sm mt-1">Verifica la búsqueda o agrega un nuevo paciente</p>
        </div>
      )}
    </div>
  );
}
