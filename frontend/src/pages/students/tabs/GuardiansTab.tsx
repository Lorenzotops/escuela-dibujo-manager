import React, { useState } from 'react';
import api from '../../../api/client';
import toast from 'react-hot-toast';

interface Guardian {
  id: number; fullName: string; phone: string; email: string;
  dni: string; address: string; relationship: string; notes: string; isPrimary: boolean;
}

const EMPTY: Omit<Guardian, 'id'> = {
  fullName: '', phone: '', email: '', dni: '', address: '',
  relationship: 'madre', notes: '', isPrimary: true,
};

export default function GuardiansTab({ studentId, guardians, isAdmin, onRefresh }: {
  studentId: number; guardians: Guardian[]; isAdmin: boolean; onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Guardian | null>(null);
  const [form,    setForm]      = useState<Omit<Guardian, 'id'>>(EMPTY);
  const [saving,  setSaving]    = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const openEdit = (g: Guardian) => { setEditing(g); setForm(g); setShowForm(true); };
  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) { toast.error('Nombre y teléfono obligatorios'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/guardians/${editing.id}`, form);
        toast.success('Tutor actualizado');
      } else {
        await api.post('/guardians', { ...form, studentId });
        toast.success('Tutor añadido');
      }
      setShowForm(false); onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const remove = async (gId: number) => {
    if (!window.confirm('¿Eliminar este tutor?')) return;
    await api.delete(`/guardians/${gId}`);
    toast.success('Tutor eliminado');
    onRefresh();
  };

  const sendWhatsApp = (g: Guardian) => {
    const phone = g.phone.replace(/\s/g, '').replace(/^\+/, '').replace(/^0034/, '34');
    const msg = encodeURIComponent(`Hola ${g.fullName},`);
    window.open(`https://wa.me/${phone.startsWith('34') ? phone : '34' + phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <button className="btn-primary" onClick={openNew}>+ Añadir tutor</button>
      )}

      {guardians.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">No hay tutores registrados</div>
      ) : guardians.map(g => (
        <div key={g.id} className="card">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{g.fullName}</h3>
                {g.isPrimary && <span className="badge-active text-xs">Principal</span>}
                <span className="text-xs text-gray-500 capitalize">{g.relationship}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>📞 {g.phone}</p>
                {g.email && <p>✉️ {g.email}</p>}
                {g.address && <p>📍 {g.address}</p>}
                {g.dni && <p>🪪 {g.dni}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => sendWhatsApp(g)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Abrir WhatsApp">
                💬
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => openEdit(g)} className="btn-secondary py-1 px-2 text-xs">Editar</button>
                  <button onClick={() => remove(g.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs transition-colors">🗑️</button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Editar tutor' : 'Nuevo tutor'}</h3>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Nombre completo *</label>
                <input className="input" value={form.fullName} onChange={set('fullName')} required />
              </div>
              <div>
                <label className="label">Relación</label>
                <select className="input" value={form.relationship} onChange={set('relationship')}>
                  <option value="madre">Madre</option>
                  <option value="padre">Padre</option>
                  <option value="tutor">Tutor/a</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input className="input" value={form.phone} onChange={set('phone')} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label">DNI</label>
                <input className="input" value={form.dni} onChange={set('dni')} />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input className="input" value={form.address} onChange={set('address')} />
              </div>
              <div>
                <label className="label">Observaciones</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(prev => ({ ...prev, isPrimary: e.target.checked }))} />
                Tutor principal
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
