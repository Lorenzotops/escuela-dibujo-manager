import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'tiempo',     label: 'Falta de tiempo' },
  { value: 'economico',  label: 'Problemas económicos' },
  { value: 'residencia', label: 'Cambio de residencia' },
  { value: 'gusto',      label: 'No le gustó' },
  { value: 'horario',    label: 'Cambio de horario no disponible' },
  { value: 'otro',       label: 'Otro' },
];

export default function WithdrawalTab({ student, isAdmin, onRefresh }: { student: any; isAdmin: boolean; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    withdrawalDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    contactLater: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason) { toast.error('Selecciona un motivo de baja'); return; }
    if (!window.confirm(`¿Confirmas dar de baja a ${student.fullName}?`)) return;
    setSaving(true);
    try {
      await api.post('/withdrawals', { studentId: student.id, ...form });
      toast.success('Alumno dado de baja');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`¿Reactivar a ${student.fullName}?`)) return;
    try {
      await api.put(`/withdrawals/${student.id}/reactivate`);
      toast.success('Alumno reactivado');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  // Si ya está de baja
  if (student.status === 'baja' && student.withdrawal) {
    const w = student.withdrawal;
    const reason = REASONS.find(r => r.value === w.reason)?.label || w.reason;
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-baja text-sm">Alumno de baja</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase">Fecha de baja</p>
            <p>{new Date(w.withdrawalDate).toLocaleDateString('es-ES')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase">Motivo</p>
            <p>{reason}</p>
          </div>
          {w.notes && <div className="col-span-2">
            <p className="text-xs text-gray-400 font-medium uppercase">Observaciones</p>
            <p>{w.notes}</p>
          </div>}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase">Contactar más adelante</p>
            <p>{w.contactLater ? '✅ Sí' : '❌ No'}</p>
          </div>
        </div>
        {isAdmin && !w.reactivatedAt && (
          <button className="btn-success" onClick={handleReactivate}>🔄 Reactivar alumno</button>
        )}
        {w.reactivatedAt && <p className="text-sm text-green-600">Reactivado el {new Date(w.reactivatedAt).toLocaleDateString('es-ES')}</p>}
      </div>
    );
  }

  if (!isAdmin) return <div className="card text-center text-gray-400 py-8">Solo los administradores pueden gestionar bajas</div>;

  return (
    <div className="card max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📤</span>
        <div>
          <h3 className="font-bold text-gray-900">Dar de baja a {student.fullName}</h3>
          <p className="text-sm text-gray-500">Esta acción cambiará el estado del alumno a "baja"</p>
        </div>
      </div>
      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label className="label">Fecha de baja</label>
          <input type="date" className="input" value={form.withdrawalDate} onChange={set('withdrawalDate')} required />
        </div>
        <div>
          <label className="label">Motivo de baja *</label>
          <select className="input" value={form.reason} onChange={set('reason')} required>
            <option value="">Seleccionar motivo...</option>
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} placeholder="Comentarios adicionales..." />
        </div>
        <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.contactLater} onChange={e => setForm(prev => ({ ...prev, contactLater: e.target.checked }))} className="w-4 h-4" />
          <span>Marcar para contactar más adelante</span>
        </label>
        <button type="submit" className="btn-danger w-full py-3" disabled={saving}>
          {saving ? 'Procesando...' : '📤 Confirmar baja'}
        </button>
      </form>
    </div>
  );
}
