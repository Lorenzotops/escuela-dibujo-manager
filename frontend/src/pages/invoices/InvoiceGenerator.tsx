import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/pdf';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function InvoiceGenerator() {
  const navigate = useNavigate();
  const now = new Date();
  const [students, setStudents]   = useState<any[]>([]);
  const [search,   setSearch]     = useState('');
  const [selected, setSelected]   = useState<any>(null);
  const [settings, setSettings]   = useState<any>(null);
  const [saving,   setSaving]     = useState(false);
  const [form, setForm] = useState({
    studentId:    '',
    billedMonth:  now.getMonth() + 1,
    billedYear:   now.getFullYear(),
    amount:       55,
    concept:      'Cuota mensual Escuela de Dibujo',
    notes:        '',
    guardianName: '',
    guardianDni:  '',
  });

  useEffect(() => {
    api.get('/settings').then(r => {
      setSettings(r.data);
      setForm(prev => ({ ...prev, amount: r.data.monthlyFee || 55 }));
    });
  }, []);

  const searchStudents = async () => {
    if (!search.trim()) return;
    const { data } = await api.get('/students', { params: { search, status: 'activo' } });
    setStudents(data);
  };

  const selectStudent = (s: any) => {
    setSelected(s);
    setStudents([]);
    setSearch(s.fullName);
    const guardian = s.guardians?.[0];
    setForm(prev => ({
      ...prev,
      studentId: s.id.toString(),
      guardianName: guardian?.fullName || '',
      guardianDni:  guardian?.dni || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Selecciona un alumno'); return; }
    setSaving(true);
    try {
      const { data: newInvoice } = await api.post('/invoices', form);
      toast.success(`Factura ${newInvoice.invoiceNumber} generada`);
      // Generar PDF automáticamente
      const { data: invoiceDetail } = await api.get(`/invoices/${newInvoice.id}`);
      generateInvoicePDF(invoiceDetail.invoice, invoiceDetail.settings);
      navigate('/facturas');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/facturas')} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">Generar factura</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Alumno</h2>
          <div className="relative">
            <input className="input" placeholder="Buscar alumno..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchStudents())} />
            {students.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                {students.map(s => (
                  <button key={s.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => selectStudent(s)}>
                    {s.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={searchStudents}>🔍 Buscar</button>
          {selected && <div className="p-3 bg-primary-50 rounded-lg text-sm font-medium text-primary-900">{selected.fullName}</div>}
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Datos de la factura</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mes facturado</label>
              <select className="input" value={form.billedMonth} onChange={e => setForm(p => ({ ...p, billedMonth: Number(e.target.value) }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Año</label>
              <select className="input" value={form.billedYear} onChange={e => setForm(p => ({ ...p, billedYear: Number(e.target.value) }))}>
                {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Concepto</label>
              <input className="input" value={form.concept} onChange={set('concept')} />
            </div>
            <div>
              <label className="label">Importe (€)</label>
              <input type="number" step="0.01" className="input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="label">Nombre del tutor (para la factura)</label>
            <input className="input" value={form.guardianName} onChange={set('guardianName')} />
          </div>
          <div>
            <label className="label">DNI del tutor</label>
            <input className="input" value={form.guardianDni} onChange={set('guardianDni')} />
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/facturas')}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
            {saving ? 'Generando...' : '🧾 Generar y descargar PDF'}
          </button>
        </div>
      </form>
    </div>
  );
}
