import React, { useEffect, useState } from 'react';
import api from '../../../api/client';

const STATUS_COLOR: Record<string, string> = {
  presente:    'bg-green-100 text-green-700',
  ausente:     'bg-red-100 text-red-700',
  justificado: 'bg-yellow-100 text-yellow-700',
};

export default function AttendanceTab({ studentId }: { studentId: number }) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attendance/student/${studentId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-green-600">{data.stats.presente}</p>
          <p className="text-xs text-gray-500 mt-1">Presentes</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-red-500">{data.stats.ausente}</p>
          <p className="text-xs text-gray-500 mt-1">Ausentes</p>
        </div>
        <div className="card text-center p-4">
          <p className="text-2xl font-bold text-yellow-500">{data.stats.justificado}</p>
          <p className="text-xs text-gray-500 mt-1">Justificados</p>
        </div>
      </div>

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.attendance.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">Sin registros de asistencia</td></tr>
            ) : data.attendance.map((a: any) => (
              <tr key={a.id}>
                <td className="px-4 py-3">{new Date(a.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
