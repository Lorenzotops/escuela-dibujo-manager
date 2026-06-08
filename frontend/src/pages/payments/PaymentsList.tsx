import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PaymentsList() {
  const now = new Date();
  const [searchParams] = useSearchParams();
  const [payments, setPayments]   = useState<any[]>([]);
  const [debtors,  setDebtors]    = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [month,    setMonth]      = useState(now.getMonth() + 1);
  const [year,     setYear]       = useState(now.getFullYear());
  const [status,   setStatus]     = useState(searchParams.get('status') || '');
  const [view,     setView]       = useState<'lista' | 'deudores'>('lista');

  // Modal generar cuotas
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth,   setGenMonth]   = useState(now.getMonth() + 1);
  const [genYear,    setGenYear]    = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [paymentsRes, debtorsRes] = await Promise.all([
        api.get('/payments', { params: { month, year, status } }),
        api.get('/payments/pending'),
      ]);
      setPayments(paymentsRes.data);
      setDebtors(debtorsRes.data);
    } catch {
      toast.error('Error al cargar pagos');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [month, year, status]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/payments/generate-monthly', { month: genMonth, year: genYear });
      toast.success(res.data.message);
      setShowGenerateModal(false);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar cuotas');
    } finally { setGenerating(false); }
  };

  const markPaid = async (payment: any) => {
    try {
      await api.put(`/payments/${payment.id}`, { status: 'pagado', paidAt: new Date().toISOString() });
      toast.success('Pago marcado como recibido');
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Modal generar cuotas */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold">⚡ Generar cuotas del mes</h2>
            <p className="text-sm text-gray-400">
              Crea cuotas en estado <span className="badge-pendiente">pendiente</span> para todos los alumnos activos que aún no tengan registro ese mes.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Mes</label>
                <select className="input w-full" value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">Año</label>
                <select className="input w-full" value={genYear} onChange={e => setGenYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setShowGenerateModal(false)} disabled={generating}>
                Cancelar
              </button>
              <button className="btn-primary flex-1" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generando...' : '⚡ Generar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => { setGenMonth(month); setGenYear(year); setShowGenerateModal(true); }}>
              ⚡ Generar cuotas
            </button>
            <button className="btn-primary" onClick={() => navigate('/pagos/nuevo')}>+ Registrar pago</button>
          </div>
        )}
      </div>

      {/* Alerta deudores */}
      {debtors.length > 0 && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => setView('deudores')}
        >
          <span className="text-xl">🔴</span>
          <div>
            <p className="font-semibold text-red-800">{debtors.length} alumnos con cuotas atrasadas</p>
            <p className="text-sm text-red-600">Haz clic para ver el detalle</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setView('lista')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'lista' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Lista de pagos
        </button>
        <button onClick={() => setView('deudores')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'deudores' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Deudores ({debtors.length})
        </button>
      </div>

      {view === 'lista' ? (
        <>
          {/* Filtros */}
          <div className="card flex flex-wrap gap-3">
            <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="input w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pendientes</option>
              <option value="atrasado">Atrasados</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-600">
                {MONTHS[month - 1]} {year} — {payments.length} registros
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Alumno</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Importe</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Fecha pago</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                      {isAdmin && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay pagos registrados</td></tr>
                    ) : payments.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === 'atrasado' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="cursor-pointer" onClick={() => navigate(`/alumnos/${p.student.id}`)}>
                            <p className="font-medium text-gray-900 hover:text-primary-600">{p.student.fullName}</p>
                            <p className="text-xs text-gray-400">{p.student.guardians?.[0]?.phone || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{p.amount.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('es-ES') : '—'}
                        </td>
                        <td className="px-4 py-3"><span className={`badge-${p.status}`}>{p.status}</span></td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            {p.status !== 'pagado' && (
                              <button className="btn-success py-1 px-2 text-xs" onClick={() => markPaid(p)}>
                                ✓ Cobrado
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Vista deudores */
        <div className="space-y-3">
          {debtors.length === 0 ? (
            <div className="card text-center text-gray-400 py-12">
              <p className="text-4xl mb-3">✅</p>
              <p>¡Todos al día con los pagos!</p>
            </div>
          ) : debtors.map(s => (
            <div key={s.id} className="card border-l-4 border-red-400">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600" onClick={() => navigate(`/alumnos/${s.id}`)}>
                    {s.fullName}
                  </p>
                  <p className="text-sm text-gray-500">{s.guardians?.[0]?.phone || ''}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.payments.map((p: any) => (
                      <span key={p.id} className={`badge-${p.status} text-xs`}>
                        {MONTHS[p.month - 1]} {p.year}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button className="btn-primary text-sm" onClick={() => navigate(`/pagos/nuevo?studentId=${s.id}`)}>
                      💰 Cobrar
                    </button>
                  )}
                  {s.guardians?.[0]?.phone && (
                    <button
                      className="btn-success text-sm"
                      onClick={() => {
                        const phone = s.guardians[0].phone.replace(/\s/g, '');
                        const msg = `Hola ${s.guardians[0].fullName}, te recordamos que quedan pendientes cuotas de ${s.payments.map((p: any) => MONTHS[p.month - 1]).join(', ')} de ${s.fullName}. Puedes pasar por la escuela cuando te venga bien. ¡Gracias!`;
                        window.open(`https://wa.me/34${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                    >
                      💬 WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
