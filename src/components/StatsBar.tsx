// ============================================
// STATS BAR — DUEÑO: Cris (P3)
// Barra de estadísticas rápidas del dashboard
// ============================================
'use client';

interface StatsBarProps {
  totalPatients: number;
  criticalCount: number;
  warningCount: number;
  dischargedToday: number;
  pendingNotes: number;
}

export default function StatsBar({ totalPatients, criticalCount, warningCount, dischargedToday, pendingNotes }: StatsBarProps) {
  const stats = [
    { label: 'Pacientes activos', value: totalPatients, icon: '🏥', color: 'text-primary-700' },
    { label: 'Críticos', value: criticalCount, icon: '🔴', color: 'text-danger-600' },
    { label: 'En vigilancia', value: warningCount, icon: '🟡', color: 'text-warning-600' },
    { label: 'Egresos hoy', value: dischargedToday, icon: '✅', color: 'text-success-600' },
    { label: 'Notas pendientes', value: pendingNotes, icon: '📝', color: 'text-primary-500' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-primary-100 p-3 text-center">
          <span className="text-lg">{stat.icon}</span>
          <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          <p className="text-[11px] text-primary-400 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
