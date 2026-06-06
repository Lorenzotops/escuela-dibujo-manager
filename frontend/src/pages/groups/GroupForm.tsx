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

  // Gestión de alumnos
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const loadGroup = () => {
    api.get(`/groups/${id}`).then(r => {
      const g = r.data;
      setForm({
        name: g.name, dayOfWeek: g.dayOfWeek, startTime: g.startTime,
        endTime: g.endTime, teacher: g.teacher, maxCapacity: g.maxCapacity,
        notes: g.notes, active: g.active,
      });
      setGroupStudents(g.students || g.studentGroups?.filter((sg: any) => sg.isCurrent).map((sg: any) => sg.student) || []);
    });
  };

  useEffect(() => {
    if (isEdit) loadGroup();
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

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    try {
      const { data } = await api.get('/students', { params: { search: studentSearch, status: 'activo' } });
      const currentIds = new Set(groupStudents.map((s: any) => s.id));
      setSearchResults(data.filter((s: any) => !currentIds.has(s.id)));
    } catch { toast.error('Error al buscar'); }
  };

  const addStudent = async (student: any) => {
    setAssigningId(student.id);
    try {
      await api.post(`/groups/${id}/assign`, { studentId: student.id });
      toast.success(`${student.fullName} añadido al grupo`);
      setSearchResults([]);
      setStudentSearch('');
      loadGroup();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al añadir');
    } finally { setAssigningId(null); }
  };

  const removeStudent = async (student: any) => {
    if (!window.confirm(`¿Quitar a ${student.fullName} de este grupo?`)) return;
    try {
      await api.put(`/students/${student.id}`, { currentGroupId: null });
      toast.success(`${student.fullName} quitado del grupo`);
      loadGroup();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al quitar');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/grupos')} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar grupo' : 'Nuevo grupo'}</h1>
      </div>

      {/* Formulario del grupo */}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Datos del grupo</h2>
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
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate('/grupos')}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear grupo'}
          </button>
        </div>
      </form>

      {/* Gestión de alumnos — solo en modo edición */}
      {isEdit && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Alumnos del grupo</h2>
            <span className="text-sm text-gray-400">{groupStudents.length} / {form.maxCapacity}</span>
          </div>

          {/* Lista de alumnos actuales */}
          {groupStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin alumnos asignados</p>
          ) : (
            <div className="space-y-2">
              {groupStudents.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-t)' }}>
                      {s.fullName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{s.fullName}</span>
                  </div>
                  <button
                    onClick={() => removeStudent(s)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-b)' }}
                    title="Quitar del grupo"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Añadir alumno */}
          {groupStudents.length < form.maxCapacity && (
            <div>
              <label className="label">Añadir alumno</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Buscar alumno por nombre..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchStudents())}
                />
                <button type="button" className="btn-secondary px-4" onClick={searchStudents}>Buscar</button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {searchResults.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-sub)' }}>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{s.fullName}</span>
                        <span className="text-xs text-gray-400 ml-2">{s.studentGroups?.[0]?.group?.name ? `→ ${s.studentGroups[0].group.name}` : 'Sin grupo'}</span>
                      </div>
                      <button
                        onClick={() => addStudent(s)}
                        disabled={assigningId === s.id}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        {assigningId === s.id ? '...' : '+ Añadir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {groupStudents.length >= form.maxCapacity && (
            <p className="text-sm text-center py-2 rounded-lg" style={{ color: 'var(--yellow)', background: 'var(--yellow-bg)' }}>
              ⚠️ Grupo lleno ({form.maxCapacity}/{form.maxCapacity})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
