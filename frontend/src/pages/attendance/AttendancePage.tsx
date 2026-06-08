import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

type TabType = 'pasar' | 'hoy' | 'historial';

export default function AttendancePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('pasar');
  const [groups,  setGroups]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  // Hoy
  const [todayData, setTodayData] = useState<Record<number, any[]>>({});
  const [todayLoading, setTodayLoading] = useState(false);

  // Historial
  const [histGroup, setHistGroup] = useState('');
  const [histDate,  setHistDate]  = useState(today);
  const [histData,  setHistData]  = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    api.get('/groups').then(r => {
      setGroups(r.data);
      if (r.data.length > 0) setHistGroup(r.data[0].id.toString());
    }).finally(() => setLoading(false));
  }, []);

  // Cargar asistencia de hoy al cambiar a la pestaña
  useEffect(() => {
    if (tab === 'hoy' && groups.length > 0) loadToday();
  }, [tab, groups]);

  const loadToday = async () => {
    setTodayLoading(true);
    try {
      const results = await Promise.all(
        groups.map(g => api.get(`/attendance/${g.id}`, { params: { date: today } }).then(r => ({ groupId: g.id, data: r.data })))
      );
      const map: Record<number, any[]> = {};
      results.forEach(r => { map[r.groupId] = r.data; });
      setTodayData(map);
    } catch {}
    finally { setTodayLoading(false); }
  };

  const loadHistorial = async () => {
    if (!histGroup) return;
    setHistLoading(true);
    try {
      const { data } = await api.get(`/attendance/${histGroup}`, { params: { date: histDate } });
      setHistData(data);
    } catch {}
    finally { setHistLoading(false); }
  };

  useEffect(() => {
    if (tab === 'historial' && histGroup) loadHistorial();
  }, [tab, histGroup, histDate]);

  const statusStyle = (status: string) => {
    if (status === 'presente')    return { color: 'var(--green)',  background: 'var(--green-bg)',  border: '1px solid var(--green-b)' };
    if (status === 'ausente')     return { color: 'var(--red)',    background: 'var(--red-bg)',    border: '1px solid var(--red-b)' };
    if (status === 'justificado') return { color: 'var(--yellow)', background: 'var(--yellow-bg)', border: '1px solid var(--yellow-b)' };
    return {};
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'pasar',    label: '✓ Pasar lista' },
    { key: 'hoy',      label: '📅 Hoy' },
    { key: 'historial',label: '📖 Historial' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--accent-t)' : 'var(--text-2)',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PASAR LISTA ── */}
      {tab === 'pasar' && (
        <div className="space-y-4">
          <div
            className="card cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)', border: 'none', padding: '24px' }}
            onClick={() => navigate('/asistencia/pasar-lista')}
          >
            <div className="flex items-center gap-4">
              <div style={{ fontSize: '36px' }}>✅</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Pasar lista ahora</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '2px' }}>Selecciona grupo y marca presentes / ausentes</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '22px', color: 'rgba(255,255,255,0.5)' }}>→</span>
            </div>
          </div>

          {!loading && groups.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Acceso rápido por grupo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {groups.map(g => (
                  <div
                    key={g.id}
                    className="card cursor-pointer"
                    style={{ transition: 'all 0.15s' }}
                    onClick={() => navigate(`/asistencia/pasar-lista?groupId=${g.id}&date=${today}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{g.name}</h3>
                      <span className="text-xs text-gray-400">{g.enrolled} alumnos</span>
                    </div>
                    <p className="text-xs text-gray-500">{g.dayOfWeek}</p>
                    <p className="text-xs text-gray-400">{g.startTime} - {g.endTime}</p>
                    <p className="text-xs text-gray-400 mt-1">Prof: {g.teacher}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HOY ── */}
      {tab === 'hoy' && (
        <div className="space-y-4">
          {todayLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
          ) : groups.map(g => {
            const records: any[] = todayData[g.id] || [];
            const presentes   = records.filter(r => r.attendance?.status === 'presente').length;
            const ausentes    = records.filter(r => r.attendance?.status === 'ausente').length;
            const justificados = records.filter(r => r.attendance?.status === 'justificado').length;
            const sinRegistro = records.filter(r => !r.attendance).length;
            const total = records.length;

            return (
              <div key={g.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{g.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{g.dayOfWeek} · {g.startTime} - {g.endTime}</p>
                  </div>
                  <button
                    className="btn-secondary text-xs py-1 px-3"
                    onClick={() => navigate(`/asistencia/pasar-lista?groupId=${g.id}&date=${today}`)}
                  >
                    {sinRegistro === total && total > 0 ? '+ Pasar lista' : '✏️ Editar'}
                  </button>
                </div>

                {total === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin alumnos en este grupo</p>
                ) : sinRegistro === total ? (
                  <p className="text-sm text-center py-3" style={{ color: 'var(--text-3)' }}>Lista no pasada hoy</p>
                ) : (
                  <>
                    {/* Resumen */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Presentes',    val: presentes,   color: 'var(--green)',  bg: 'var(--green-bg)' },
                        { label: 'Ausentes',     val: ausentes,    color: 'var(--red)',    bg: 'var(--red-bg)' },
                        { label: 'Justificados', val: justificados,color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: item.bg }}>
                          <p className="text-xl font-bold" style={{ color: item.color }}>{item.val}</p>
                          <p className="text-xs mt-0.5" style={{ color: item.color, opacity: 0.8 }}>{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Lista de alumnos */}
                    <div className="space-y-1.5">
                      {records.map(({ student, attendance }: any) => (
                        <div key={student.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-t)' }}>
                              {student.fullName?.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-800">{student.fullName}</span>
                          </div>
                          {attendance ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={statusStyle(attendance.status)}>
                              {attendance.status}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === 'historial' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Grupo</label>
              <select className="input w-48" value={histGroup} onChange={e => setHistGroup(e.target.value)}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input w-44" value={histDate} onChange={e => setHistDate(e.target.value)} max={today} />
            </div>
            <button className="btn-primary" onClick={loadHistorial}>Ver</button>
          </div>

          {histLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
          ) : histData.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p>No hay registros para esta fecha</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <span className="text-sm font-medium text-gray-600">
                  {groups.find(g => g.id === Number(histGroup))?.name} — {new Date(histDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span style={{ color: 'var(--green)' }}>✓ {histData.filter((r: any) => r.attendance?.status === 'presente').length} presentes</span>
                  <span style={{ color: 'var(--red)' }}>✗ {histData.filter((r: any) => r.attendance?.status === 'ausente').length} ausentes</span>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-sub)' }}>
                {histData.map(({ student, attendance }: any) => (
                  <div key={student.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent-t)' }}>
                        {student.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-800">{student.fullName}</span>
                    </div>
                    {attendance ? (
                      <div className="text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize" style={statusStyle(attendance.status)}>
                          {attendance.status}
                        </span>
                        {attendance.notes && <p className="text-xs text-gray-400 mt-1">{attendance.notes}</p>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin registro</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
