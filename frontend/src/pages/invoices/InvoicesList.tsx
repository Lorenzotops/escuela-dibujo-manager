import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { generateInvoicePDF, generateCombinedInvoicesPDF } from '../../utils/pdf';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function InvoicesList() {
  const now = new Date();
  const [invoices,      setInvoices]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [month,         setMonth]         = useState(now.getMonth() + 1);
  const [year,          setYear]          = useState(now.getFullYear());
  const [status,        setStatus]        = useState('');
  const [batchLoading,  setBatchLoading]  = useState(false);
  const [selected,      setSelected]      = useState<Set<number>>(new Set());
  const [downloading,   setDownloading]   = useState(false);
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const load = () => {
    setLoading(true);
    setSelected(new Set());
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
    } catch {
      toast.error('Error al generar PDF');
    }
  };

  const cancel = async (id: number) => {
    if (!window.confirm('¿Anular esta factura?')) return;
    await api.put(`/invoices/${id}/cancel`);
    toast.success('Factura anulada');
    load();
  };

  // Selección
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map(i => i.id)));
    }
  };

  // Descarga combinada
  const downloadSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) { toast.error('Selecciona al menos una factura'); return; }
    setDownloading(true);
    toast.loading(`Preparando ${ids.length} facturas...`, { id: 'dl' });
    try {
      const results = await Promise.all(ids.map(id => api.get(`/invoices/${id}`)));
      const invoicesWithSettings = results.map(r => ({ invoice: r.data.invoice, settings: r.data.settings }));
      const filename = `facturas-${MONTHS[month - 1]}-${year}-seleccion.pdf`;
      generateCombinedInvoicesPDF(invoicesWithSettings, filename);
      toast.success(`${ids.length} facturas descargadas`, { id: 'dl' });
    } catch {
      toast.error('Error al descargar', { id: 'dl' });
    } finally { setDownloading(false); }
  };

  const downloadAll = async () => {
    if (invoices.length === 0) { toast.error('No hay facturas para descargar'); return; }
    setDownloading(true);
    toast.loading(`Preparando ${invoices.length} facturas...`, { id: 'dla' });
    try {
      const results = await Promise.all(invoices.map(inv => api.get(`/invoices/${inv.id}`)));
      const invoicesWithSettings = results.map(r => ({ invoice: r.data.invoice, settings: r.data.settings }));
      const filename = `facturas-${MONTHS[month - 1]}-${year}-completo.pdf`;
      generateCombinedInvoicesPDF(invoicesWithSettings, filename);
      toast.success(`${invoices.length} facturas descargadas`, { id: 'dla' });
    } catch {
      toast.error('Error al descargar', { id: 'dla' });
    } finally { setDownloading(false); }
  };

  const allSelected = invoices.length > 0 && selected.size === invoices.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm" onClick={generateBatch} disabled={batchLoading}>
              {batchLoading ? 'Generando...' : '📋 Generar facturas del mes'}
            </button>
            <button className="btn-primary" onClick={() => navigate('/facturas/nueva')}>+ Nueva factura</button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap gap-3 items-center">
        <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="input w-40" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="emitida">Emitidas</option>
          <option value="pagada">Pagadas</option>
          <option value="anulada">Anuladas</option>
        </select>

        {/* Botones de descarga masiva */}
        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <button
              className="btn-primary text-sm"
              onClick={downloadSelected}
              disabled={downloading}
            >
              {downloading ? '...' : `⬇ Descargar selección (${selected.size})`}
            </button>
          )}
          <button
            className="btn-secondary text-sm"
            onClick={downloadAll}
            disabled={downloading || invoices.length === 0}
            title="Descargar todas las facturas visibles como un solo PDF"
          >
            {downloading ? '...' : `⬇ Descargar todo (${invoices.length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <span className="text-sm font-medium text-gray-600">{invoices.length} facturas</span>
            {invoices.length > 0 && (
              <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors" onClick={toggleAll}>
                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded"
                      title="Seleccionar todo"
                    />
                  </th>
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
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay facturas para este periodo</td></tr>
                ) : invoices.map(inv => (
                  <tr
                    key={inv.id}
                    className={`transition-colors ${inv.status === 'anulada' ? 'opacity-50' : ''} ${selected.has(inv.id) ? '' : 'hover:bg-gray-50'}`}
                    style={selected.has(inv.id) ? { background: 'rgba(124,58,237,0.06)' } : {}}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="w-4 h-4 rounded"
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
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
                        <button onClick={() => downloadPDF(inv)} className="btn-secondary py-1 px-2 text-xs">📄 PDF</button>
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
