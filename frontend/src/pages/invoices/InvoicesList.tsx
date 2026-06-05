import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/pdf';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function InvoicesList() {
  const now = new Date();
  const [invoices,  setInvoices]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [month,     setMonth]     = useState(now.getMonth() + 1);
  const [year,      setYear]      = useState(now.getFullYear());
  const [status,    setStatus]    = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/invoices', { params: { month, year, status: status || undefined } })
      .then(r => setInvoices(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year, status]);

  const generateBatch = async () => {
    if (!window.confirm(`¿Generar facturas para TODOS los alumnos activos de ${MONTHS[month - 1]} ${year}?`)) return;
    setBatchLoading(true);
    try {
      const { data } = await api.post('/invoices/batch', { month, year });
      toast.success(data.message);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar facturas');
    } finally { setBatchLoading(false); }
  };

  const downloadPDF = async (invoice: any) => {
    try {
      const { data } = await api.get(`/invoices/${invoice.id}`);
      generateInvoicePDF(data.invoice, data.settings);
    } catch (err: any) {
      toast.error('Error al generar PDF');
    }
  };

  const cancel = async (id: number) => {
    if (!window.confirm('¿Anular esta factura?')) return;
    await api.put(`/invoices/${id}/cancel`);
    toast.success('Factura anulada');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={generateBatch} disabled={batchLoading}>
              {batchLoading ? 'Generando...' : '📋 Generar facturas del mes'}
            </button>
            <button className="btn-primary" onClick={() => navigate('/facturas/nueva')}>+ Nueva factura</button>
          </div>
        )}
      </div>

      <div className="card flex flex-wrap gap-3">
        <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="emitida">Emitidas</option>
          <option value="pagada">Pagadas</option>
          <option value="anulada">Anuladas</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-600">
            {invoices.length} facturas
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Número</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Alumno</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Mes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Importe</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay facturas para este periodo</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${inv.status === 'anulada' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium cursor-pointer hover:text-primary-600" onClick={() => navigate(`/alumnos/${inv.studentId}`)}>
                      {inv.student.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{MONTHS[inv.billedMonth - 1]} {inv.billedYear}</td>
                    <td className="px-4 py-3 font-medium">{inv.amount.toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <span className={`badge-${inv.status === 'emitida' ? 'pendiente' : inv.status === 'pagada' ? 'pagado' : 'baja'}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => downloadPDF(inv)} className="btn-secondary py-1 px-2 text-xs" title="Descargar PDF">📄 PDF</button>
                        {isAdmin && inv.status !== 'anulada' && (
                          <button onClick={() => cancel(inv.id)} className="text-red-500 hover:bg-red-50 p-1 rounded text-xs">✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
