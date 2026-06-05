import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

type AttStatus = 'presente' | 'ausente' | 'justificado';

const STATUS_COLORS: Record<AttStatus, string> = {
  presente:    'bg-green-600 text-white',
  ausente:     'bg-red-500 text-white',
  justificado: 'bg-yellow-500 text-white',
};
const STATUS_IDLE: Record<AttStatus, string> = {
  presente:    'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
  ausente:     'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  justificado: 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100',
};

export default function TakeAttendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [groups,    setGroups]    = useState<any[]>([]);
  const [groupId,   setGroupId]   = useState(searchParams.get('groupId') || '');
  const [date,      setDate]      = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [students,  setStudents]  = useState<Array<{ student: any; attendance: any | null }>>([]);
  const [records,   setRecords]   = useState<Record<number, { status: AttStatus; notes: string }>>({});
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    api.get('/groups').then(r => setGroups(r.data));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    api.get(`/attendance/${groupId}`, { params: { date } })
      .then(r => {
        setStudents(r.data);
        const initialRecords: Record<number, { status: AttStatus; notes: string }> = {};
        r.data.forEach(({ student, attendance }: any) => {
          initialRecords[student.id] = {
            status: attendance?.status || 'presente',
            notes:  attendance?.notes || '',
          };
        });
        setRecords(initialRecords);
      })
      .finally(() => setLoading(false));
  }, [groupId, date]);

  const setStatus = (studentId: number, status: AttStatus) => {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setAll = (status: AttStatus) => {
    const updated: typeof records = {};
    Object.keys(records).forEach(k => { updated[Number(k)] = { ...records[Number(k)], status }; });
    setRecords(updated);
  };

  const save = async () => {
    if (!groupId) { toast.error('Selecciona un grupo'); return; }
    setSaving(true);
    try {
      const recordsArr = Object.entries(records).map(([studentId, rec]) => ({
        studentId: Number(studentId),
        status: rec.status,
        notes: rec.notes,
      }));
      await api.post('/attendance', { groupId: Number(groupId), date, records: recordsArr });
      toast.success('✅ Lista guardada correctamente');
      navigate('/asistencia');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const selectedGroup = groups.find(g => g.id === Number(groupId));
  const presentCount  = Object.values(records).filter(r => r.status === 'presente').length;
  const absentCount   = Object.values(records).filter(r => r.status === 'ausente').length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/asistencia')} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-900">Pasar lista</h1>
      </div>

      {/* Selector de grupo y fecha */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Grupo</label>
            <select className="input" value={groupId} onChange={e => setGroupId(e.target.value)}>
              <option value="">Seleccionar grupo...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} — {g.dayOfWeek}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        {selectedGroup && (
          <p className="mt-2 text-sm text-gray-500">
            {selectedGroup.startTime} - {selectedGroup.endTime} · Prof: {selectedGroup.teacher} · {students.length} alumnos
          </p>
        )}
      </div>

      {/* Lista de alumnos */}
      {groupId && (
        <>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
          ) : students.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">No hay alumnos en este grupo</div>
          ) : (
            <>
              {/* Marcar todos */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Marcar todos:</span>
                <button onClick={() => setAll('presente')} className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100">✓ Todos presentes</button>
                <button onClick={() => setAll('ausente')} className="text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100">✗ Todos ausentes</button>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 text-center bg-green-50 border-green-200">
                  <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                  <p className="text-xs text-green-600">Presentes</p>
                </div>
                <div className="card p-3 text-center bg-red-50 border-red-200">
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-xs text-red-500">Ausentes</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">{students.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>

              {/* Alumnos */}
              <div className="space-y-2">
                {students.map(({ student }) => {
                  const rec = records[student.id] || { status: 'presente' as AttStatus, notes: '' };
                  return (
                    <div key={student.id} className={`card p-4 transition-all border-l-4 ${rec.status === 'presente' ? 'border-green-400' : rec.status === 'ausente' ? 'border-red-400' : 'border-yellow-400'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-600 text-sm">
                            {student.fullName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{student.fullName}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {(['presente', 'ausente', 'justificado'] as AttStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => setStatus(student.id, s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${rec.status === s ? STATUS_COLORS[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {s.charAt(0).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="btn-primary w-full py-4 text-base font-semibold"
              >
                {saving ? 'Guardando...' : '✅ Guardar lista de hoy'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
