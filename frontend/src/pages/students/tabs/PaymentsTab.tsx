import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PaymentsTab({ studentId }: { studentId: number }) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/payments/student/${studentId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Historial de pagos</h3>
        <button className="btn-primary text-sm" onClick={() => navigate(`/pagos/nuevo?studentId=${studentId}`)}>
          + Registrar pago
        </button>
      </div>

      {data.overdue?.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800 mb-2">⚠️ Cuotas pendientes:</p>
          {data.overdue.map((p: any) => (
            <div key={p.id} className="flex justify-between items-center text-sm text-red-700">
              <span>{MONTH_NAMES[p.month - 1]} {p.year}</span>
              <span className={`badge-${p.status}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Mes</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Importe</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha pago</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.payments.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin pagos registrados</td></tr>
            ) : data.payments.map((p: any) => (
              <tr key={p.id} className={p.status === 'atrasado' ? 'bg-red-50' : p.status === 'pendiente' ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-3 font-medium">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                <td className="px-4 py-3">{p.amount.toFixed(2)} €</td>
                <td className="px-4 py-3 text-gray-500">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-ES') : '—'}
                </td>
                <td className="px-4 py-3"><span className={`badge-${p.status}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
