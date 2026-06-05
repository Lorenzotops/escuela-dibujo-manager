import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const now = new Date();

  const [students,      setStudents]      = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [settings,      setSettings]      = useState<any>(null);
  const [saving,        setSaving]        = useState(false);

  const [form, setForm] = useState({
    studentId: searchParams.get('studentId') || '',
    month:     now.getMonth() + 1,
    year:      now.getFullYear(),
    amount:    55,
    method:    'efectivo',
    notes:     '',
  });

  useEffect(() => {
    api.get('/settings').then(r => {
      setSettings(r.data);
      setForm(prev => ({ ...prev, amount: r.data.monthlyFee || 55 }));
    });
    if (form.studentId) loadStudent(Number(form.studentId));
  }, []);

  const loadStudent = async (id: number) => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/payments/student/${id}`),
      ]);
      setSelectedStudent(sRes.data);
      setStudentPayments(pRes.data.overdue || []);
    } catch {}
  };

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    const { data } = await api.get('/students', { params: { search: studentSearch, status: 'activo' } });
    setStudents(data);
  };

  const selectStudent = (s: any) => {
    setSelectedStudent(s);
    setForm(prev => ({ ...prev, studentId: s.id.toString() }));
    setStudents([]);
    setStudentSearch(s.fullName);
    loadStudent(s.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Selecciona un alumno'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/payments', form);
      toast.success('Pago registrado correctamente');
      navigate(`/alumnos/${form.studentId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">Registrar pago</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de alumno */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Alumno</h2>
          <div className="relative">
            <input
              className="input"
              placeholder="Buscar alumno por nombre..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
            />
            {students.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                {students.map(s => (
                  <button key={s.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm" onClick={() => selectStudent(s)}>
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-gray-400 text-xs">{s.studentGroups?.[0]?.group?.name || 'Sin grupo'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={searchStudents}>🔍 Buscar</button>

          {selectedStudent && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="font-semibold text-primary-900">{selectedStudent.fullName}</p>
              <p className="text-sm text-primary-600">{selectedStudent.studentGroups?.[0]?.group?.name || 'Sin grupo'}</p>
              {/* Alertas de cuotas atrasadas */}
              {studentPayments.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-700">⚠️ Cuotas pendientes:</p>
                  {studentPayments.map((p: any) => (
                    <p key={p.id} className="text-xs text-red-600">→ {MONTHS[p.month - 1]} {p.year} ({p.status})</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Datos del pago */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">Datos del pago</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mes</label>
              <select className="input" value={form.month} onChange={e => setForm(prev => ({ ...prev, month: Number(e.target.value) }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Año</label>
              <select className="input" value={form.year} onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Importe (€)</label>
              <input type="number" step="0.01" className="input" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="label">Método</label>
              <select className="input" value={form.method} onChange={e => setForm(prev => ({ ...prev, method: e.target.value }))}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
            {saving ? 'Registrando...' : '💰 Registrar pago'}
          </button>
        </div>
      </form>
    </div>
  );
}
