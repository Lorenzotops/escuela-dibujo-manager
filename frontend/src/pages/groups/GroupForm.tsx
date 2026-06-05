import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

export default function GroupForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', dayOfWeek: '', startTime: '17:00', endTime: '19:00',
    teacher: '', maxCapacity: 15, notes: '', active: true,
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/groups/${id}`).then(r => {
        const g = r.data;
        setForm({
          name: g.name, dayOfWeek: g.dayOfWeek, startTime: g.startTime,
          endTime: g.endTime, teacher: g.teacher, maxCapacity: g.maxCapacity,
          notes: g.notes, active: g.active,
        });
      });
    }
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.teacher) { toast.error('Nombre y profesor son obligatorios'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/groups/${id}`, form);
        toast.success('Grupo actualizado');
      } else {
        await api.post('/groups', form);
        toast.success('Grupo creado');
      }
      navigate('/grupos');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/grupos')} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar grupo' : 'Nuevo grupo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Nombre del grupo *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="Ej: Grupo Tarde A" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Días</label>
            <input className="input" value={form.dayOfWeek} onChange={set('dayOfWeek')} placeholder="Ej: Lunes, Miércoles" />
          </div>
          <div>
            <label className="label">Profesor/a *</label>
            <input className="input" value={form.teacher} onChange={set('teacher')} required />
          </div>
          <div>
            <label className="label">Hora de inicio</label>
            <input type="time" className="input" value={form.startTime} onChange={set('startTime')} />
          </div>
          <div>
            <label className="label">Hora de fin</label>
            <input type="time" className="input" value={form.endTime} onChange={set('endTime')} />
          </div>
          <div>
            <label className="label">Cupo máximo</label>
            <input type="number" className="input" value={form.maxCapacity} onChange={set('maxCapacity')} min={1} />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="active" className="text-sm text-gray-700">Grupo activo</label>
          </div>
        </div>
        <div>
          <label className="label">Observaciones</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/grupos')}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear grupo'}
          </button>
        </div>
      </form>
    </div>
  );
}
