import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const REASON_LABELS: Record<string, string> = {
  tiempo:'Falta de tiempo', economico:'Problemas económicos', residencia:'Cambio de residencia',
  gusto:'No le gustó', horario:'Cambio de horario', otro:'Otro',
};
const HOW_LABELS: Record<string, string> = {
  referido:'Referido', redes:'Redes sociales', pasando:'Pasando por la calle', colegio:'Recomendado por colegio', otro:'Otro',
};

export default function Stats() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/overview')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  const maxIncome = Math.max(...data.incomeByMonth.map((i: any) => i.total), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>

      {/* Ingresos por mes */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Ingresos por mes (año actual)</h2>
        <div className="flex items-end gap-2 h-32">
          {data.incomeByMonth.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos de ingresos</p>
          ) : data.incomeByMonth.map((item: any) => (
            <div key={`${item.month}-${item.year}`} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">{item.total > 0 ? `${item.total}€` : ''}</span>
              <div
                className="w-full bg-primary-500 rounded-t-md transition-all"
                style={{ height: `${(item.total / maxIncome) * 100}px`, minHeight: item.total > 0 ? '4px' : '0' }}
              />
              <span className="text-xs text-gray-400">{MONTHS[item.month - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grupos */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Alumnos por grupo</h2>
        <div className="space-y-3">
          {data.groupStats.map((g: any) => (
            <div key={g.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{g.name}</span>
                <span className="text-gray-500">{g.enrolled}/{g.maxCapacity}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-primary-500" style={{ width: `${(g.enrolled / g.maxCapacity) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivos de baja */}
      {data.withdrawalReasons.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Motivos de baja</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.withdrawalReasons.map((r: any) => (
              <div key={r.reason} className="p-3 bg-red-50 rounded-xl">
                <p className="text-xl font-bold text-red-700">{r.count}</p>
                <p className="text-xs text-red-500 mt-0.5">{REASON_LABELS[r.reason] || r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cómo llegaron */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Cómo llegaron a la escuela</h2>
        <div className="space-y-2">
          {data.howFoundUs.map((h: any) => {
            const total = data.howFoundUs.reduce((sum: number, x: any) => sum + x.count, 0);
            return (
              <div key={h.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{HOW_LABELS[h.source] || h.source || 'No especificado'}</span>
                  <span className="text-gray-500">{h.count} ({total > 0 ? Math.round(h.count / total * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-purple-500" style={{ width: `${total > 0 ? (h.count / total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colegios */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Alumnos por colegio</h2>
        <div className="space-y-2">
          {data.bySchool.filter((s: any) => s.school).map((s: any) => (
            <div key={s.school} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{s.school}</span>
              <span className="font-semibold text-gray-900">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
