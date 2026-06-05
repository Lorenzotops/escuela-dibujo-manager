import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface Group { id: number; name: string; available: number; }

const HOW_FOUND_OPTIONS = [
  { value: 'referido',  label: 'Referido por alguien' },
  { value: 'redes',     label: 'Redes sociales' },
  { value: 'pasando',   label: 'Pasando por la calle' },
  { value: 'colegio',   label: 'Recomendado por el colegio' },
  { value: 'otro',      label: 'Otro' },
];

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [groups,   setGroups]   = useState<Group[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    fullName: '', birthDate: '', dni: '', address: '',
    school: '', howFoundUs: '', referredBy: '', enrollmentReason: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    currentGroupId: '', notes: '', status: 'activo',
  });

  useEffect(() => {
    api.get('/groups').then(r => setGroups(r.data));
    if (isEdit) {
      setLoading(true);
      api.get(`/students/${id}`)
        .then(r => {
          const s = r.data;
          setForm({
            fullName: s.fullName || '',
            birthDate: s.birthDate ? s.birthDate.split('T')[0] : '',
            dni: s.dni || '',
            address: s.address || '',
            school: s.school || '',
            howFoundUs: s.howFoundUs || '',
            referredBy: s.referredBy || '',
            enrollmentReason: s.enrollmentReason || '',
            enrollmentDate: s.enrollmentDate ? s.enrollmentDate.split('T')[0] : '',
            currentGroupId: s.currentGroupId?.toString() || '',
            notes: s.notes || '',
            status: s.status || 'activo',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.birthDate) { toast.error('Nombre y fecha de nacimiento son obligatorios'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/students/${id}`, form);
        toast.success('Alumno actualizado');
      } else {
        const { data } = await api.post('/students', form);
        toast.success('Alumno creado correctamente');
        navigate(`/alumnos/${data.id}`);
        return;
      }
      navigate(`/alumnos/${id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const go = window.confirm(`Ya existe un alumno con ese nombre. ¿Quieres ver su ficha?`);
        if (go) navigate(`/alumnos/${err.response.data.existingId}`);
      } else {
        toast.error(err.response?.data?.error || 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar alumno' : 'Nuevo alumno'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos personales */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 text-lg">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div>
              <label className="label">Fecha de nacimiento *</label>
              <input type="date" className="input" value={form.birthDate} onChange={set('birthDate')} required />
            </div>
            <div>
              <label className="label">DNI (opcional)</label>
              <input className="input" value={form.dni} onChange={set('dni')} placeholder="12345678A" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input className="input" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label className="label">Colegio de procedencia</label>
              <input className="input" value={form.school} onChange={set('school')} />
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={set('status')}>
                <option value="activo">Activo</option>
                <option value="pausa">En pausa</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inscripción */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 text-lg">Inscripción</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de alta</label>
              <input type="date" className="input" value={form.enrollmentDate} onChange={set('enrollmentDate')} />
            </div>
            <div>
              <label className="label">Grupo asignado</label>
              <select className="input" value={form.currentGroupId} onChange={set('currentGroupId')}>
                <option value="">Sin grupo</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id} disabled={g.available <= 0}>
                    {g.name} {g.available <= 0 ? '(Completo)' : `(${g.available} libres)`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">¿Cómo llegó a la escuela?</label>
              <select className="input" value={form.howFoundUs} onChange={set('howFoundUs')}>
                <option value="">Seleccionar...</option>
                {HOW_FOUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Referido por</label>
              <input className="input" value={form.referredBy} onChange={set('referredBy')} placeholder="Nombre de quien refirió" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Motivo de inscripción</label>
              <textarea className="input resize-none" rows={2} value={form.enrollmentReason} onChange={set('enrollmentReason')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Observaciones</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-primary px-8" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear alumno'}
          </button>
        </div>
      </form>
    </div>
  );
}
