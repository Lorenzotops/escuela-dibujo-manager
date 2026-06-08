import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface DashboardData {
  activeStudents: number;
  pausedStudents: number;
  bajasThisMonth: number;
  pendingPayments: number;
  overduePayments: number;
  invoicesThisMonth: number;
  attendanceToday: number;
  monthIncome: number;
  groups: Array<{ id: number; name: string; dayOfWeek: string; startTime: string; endTime: string; teacher: string; maxCapacity: number; enrolled: number; available: number }>;
}

export default function Dashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const mes = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize hidden sm:block">{mes}</p>
      </div>

      {/* Alerta de pagos atrasados */}
      {data.overduePayments > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => navigate('/pagos?status=atrasado')}>
          <span className="text-2xl">🔴</span>
          <div>
            <p className="font-semibold text-red-800">¡{data.overduePayments} pagos atrasados!</p>
            <p className="text-sm text-red-600">Haz clic para ver quién debe cuotas anteriores</p>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎓" label="Alumnos activos" value={data.activeStudents} color="blue" onClick={() => navigate('/alumnos?status=activo')} />
        <StatCard icon="⏸️" label="En pausa" value={data.pausedStudents} color="yellow" onClick={() => navigate('/alumnos?status=pausa')} />
        <StatCard icon="⚠️" label="Pagos pendientes" value={data.pendingPayments} color="orange" onClick={() => navigate('/pagos?status=pendiente')} />
        <StatCard icon="🧾" label="Facturas del mes" value={data.invoicesThisMonth} color="purple" onClick={() => navigate('/facturas')} />
        <StatCard icon="✅" label="Presentes hoy" value={data.attendanceToday} color="green" onClick={() => navigate('/asistencia/pasar-lista')} />
        <StatCard icon="📤" label="Bajas este mes" value={data.bajasThisMonth} color="red" onClick={() => navigate('/bajas')} />
        <StatCard icon="💰" label="Ingresos del mes" value={`${data.monthIncome.toFixed(2)} €`} color="green" onClick={() => navigate('/estadisticas')} />
        <StatCard icon="👥" label="Grupos activos" value={data.groups.length} color="blue" onClick={() => navigate('/grupos')} />
      </div>

      {/* Grupos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Grupos y plazas disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.groups.map(g => (
            <div key={g.id} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/grupos`)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{g.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${g.available > 3 ? 'bg-green-100 text-green-700' : g.available > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {g.available > 0 ? `${g.available} libres` : 'Completo'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{g.dayOfWeek} · {g.startTime} - {g.endTime}</p>
              <p className="text-xs text-gray-400 mt-1">Prof: {g.teacher}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{g.enrolled} inscritos</span>
                  <span>{g.maxCapacity} máx</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${g.available === 0 ? 'bg-red-500' : g.available <= 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${(g.enrolled / g.maxCapacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <QuickAction icon="🎓" label="Nuevo alumno"    color="blue"   onClick={() => navigate('/alumnos/nuevo')} />
          <QuickAction icon="✅" label="Pasar lista"     color="green"  onClick={() => navigate('/asistencia/pasar-lista')} />
          <QuickAction icon="💰" label="Registrar pago"  color="orange" onClick={() => navigate('/pagos/nuevo')} />
          <QuickAction icon="🧾" label="Generar factura" color="purple" onClick={() => navigate('/facturas/nueva')} />
          <QuickAction icon="🔍" label="Buscar alumno"   color="gray"   onClick={() => navigate('/alumnos')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: string; label: string; value: number | string; color: string; onClick?: () => void }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-700',
    red:    'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray:   'bg-gray-50 text-gray-700',
  };
  return (
    <div className={`card cursor-pointer hover:shadow-md transition-all ${onClick ? 'hover:-translate-y-0.5' : ''}`} onClick={onClick}>
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colors[color]}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-600 hover:bg-blue-700',
    green:  'bg-green-600 hover:bg-green-700',
    orange: 'bg-orange-500 hover:bg-orange-600',
    purple: 'bg-purple-600 hover:bg-purple-700',
    gray:   'bg-gray-600 hover:bg-gray-700',
  };
  return (
    <button onClick={onClick} className={`${colors[color]} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors font-medium text-sm`}>
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  );
}
