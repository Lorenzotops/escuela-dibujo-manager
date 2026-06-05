import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

const REASON_LABELS: Record<string, string> = {
  tiempo:     'Falta de tiempo',
  economico:  'Problemas económicos',
  residencia: 'Cambio de residencia',
  gusto:      'No le gustó',
  horario:    'Cambio de horario',
  otro:       'Otro',
};

export default function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/withdrawals')
      .then(r => setWithdrawals(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reactivate = async (studentId: number, name: string) => {
    if (!window.confirm(`¿Reactivar a ${name}?`)) return;
    await api.put(`/withdrawals/${studentId}/reactivate`);
    toast.success('Alumno reactivado');
    load();
  };

  // Estadísticas de motivos
  const reasonCounts: Record<string, number> = {};
  withdrawals.forEach(w => {
    reasonCounts[w.reason] = (reasonCounts[w.reason] || 0) + 1;
  });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bajas</h1>

      {/* Resumen motivos */}
      {withdrawals.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Motivos de baja</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(reasonCounts).map(([reason, count]) => (
              <div key={reason} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-800">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{REASON_LABELS[reason] || reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {withdrawals.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          <p className="text-4xl mb-3">📤</p>
          <p>No hay bajas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600" onClick={() => navigate(`/alumnos/${w.studentId}`)}>
                    {w.student.fullName}
                  </span>
                  {w.reactivatedAt && <span className="badge-active text-xs">Reactivado</span>}
                  {w.contactLater && !w.reactivatedAt && <span className="badge-pendiente text-xs">Contactar</span>}
                </div>
                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                  <p>Baja: {new Date(w.withdrawalDate).toLocaleDateString('es-ES')}</p>
                  <p>Motivo: {REASON_LABELS[w.reason] || w.reason}</p>
                  {w.notes && <p>Obs: {w.notes}</p>}
                </div>
                {w.student.guardians?.[0] && (
                  <div className="mt-2 flex gap-2">
                    <p className="text-xs text-gray-400">{w.student.guardians[0].fullName} · {w.student.guardians[0].phone}</p>
                    {w.contactLater && (
                      <button
                        className="text-xs text-green-600 hover:text-green-700"
                        onClick={() => {
                          const phone = w.student.guardians[0].phone.replace(/\s/g, '');
                          window.open(`https://wa.me/34${phone}`, '_blank');
                        }}
                      >
                        💬 WhatsApp
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!w.reactivatedAt && (
                <button className="btn-success text-sm whitespace-nowrap" onClick={() => reactivate(w.studentId, w.student.fullName)}>
                  🔄 Reactivar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
