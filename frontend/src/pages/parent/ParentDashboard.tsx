import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Group {
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacher: string;
}

interface Payment {
  id: number;
  month: number;
  year: number;
  amount: number;
  status: string;
  paidAt: string | null;
  notes: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  group: { name: string };
}

interface AttendanceSummary {
  summary: { total: number; presente: number; ausente: number; justificado: number };
  records: AttendanceRecord[];
}

interface Child {
  id: number;
  fullName: string;
  status: string;
  enrollmentDate: string;
  currentGroup: Group | null;
  pendingCount: number;
  nextPending: Payment | null;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function monthLabel(m: number, y: number) {
  return `${MONTHS[m - 1]} ${y}`;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pagado:    { label: 'Pagado',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    pendiente: { label: 'Pendiente', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
    atrasado:  { label: 'Atrasado',  color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  };
  const s = map[status] ?? { label: status, color: '#888', bg: 'rgba(136,136,136,0.1)' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
      fontSize: '11px', fontWeight: 600, color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

function attendanceBadge(status: string) {
  const map: Record<string, { icon: string; color: string }> = {
    presente:    { icon: '✓', color: '#4ade80' },
    ausente:     { icon: '✗', color: '#f87171' },
    justificado: { icon: 'J', color: '#facc15' },
  };
  const s = map[status] ?? { icon: '?', color: '#888' };
  return (
    <span style={{
      width: '22px', height: '22px', borderRadius: '6px', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', fontSize: '11px',
      fontWeight: 700, color: s.color,
      background: s.color + '1a',
    }}>
      {s.icon}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { user } = useAuth();

  const [children,    setChildren]    = useState<Child[]>([]);
  const [selected,    setSelected]    = useState<Child | null>(null);
  const [payments,    setPayments]    = useState<Payment[]>([]);
  const [attendance,  setAttendance]  = useState<AttendanceSummary | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'pagos' | 'asistencia'>('pagos');

  // Cargar hijos al montar
  useEffect(() => {
    api.get('/parent/children')
      .then(r => {
        setChildren(r.data);
        if (r.data.length > 0) setSelected(r.data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Cargar pagos y asistencia cuando cambia el hijo seleccionado
  useEffect(() => {
    if (!selected) return;
    setPayments([]);
    setAttendance(null);

    api.get(`/parent/children/${selected.id}/payments`).then(r => setPayments(r.data));
    api.get(`/parent/children/${selected.id}/attendance`).then(r => setAttendance(r.data));
  }, [selected]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</p>
        <h2 style={{ color: '#e0e0e0', marginBottom: '8px' }}>Sin alumnos vinculados</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Tu email no tiene alumnos asociados en el sistema.<br />
          Contacta con la administración de la escuela.
        </p>
      </div>
    );
  }

  const pendingPayments = payments.filter(p => p.status !== 'pagado');
  const paidPayments    = payments.filter(p => p.status === 'pagado');

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f0', marginBottom: '4px' }}>
          Hola, {user?.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#666', fontSize: '13px' }}>
          Panel de seguimiento de tu familia en Escuela Lorenzo
        </p>
      </div>

      {/* Selector de hijo (si hay más de uno) */}
      {children.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelected(child)}
              style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: '1px solid',
                borderColor: selected?.id === child.id ? '#7c3aed' : '#1e1e1e',
                background: selected?.id === child.id ? 'rgba(124,58,237,0.15)' : '#161616',
                color: selected?.id === child.id ? '#a78bfa' : '#888',
                cursor: 'pointer', transition: 'all 0.15s ease',
                minHeight: '44px',
              }}
            >
              🎓 {child.fullName.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          {/* Tarjeta del alumno */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
              }}>
                🎨
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f0f0', marginBottom: '4px' }}>
                  {selected.fullName}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selected.status === 'activo'
                    ? <span className="badge-active">Activo</span>
                    : selected.status === 'pausa'
                    ? <span className="badge-pausa">En pausa</span>
                    : <span className="badge-baja">Baja</span>
                  }
                  {selected.currentGroup && (
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {selected.currentGroup.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del grupo */}
            {selected.currentGroup && (
              <div style={{
                marginTop: '16px', padding: '12px', borderRadius: '8px',
                background: '#111', border: '1px solid #1e1e1e',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              }}>
                <div>
                  <p className="label">Grupo</p>
                  <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>
                    {selected.currentGroup.name}
                  </p>
                </div>
                <div>
                  <p className="label">Horario</p>
                  <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>
                    {selected.currentGroup.startTime} – {selected.currentGroup.endTime}
                  </p>
                </div>
                <div>
                  <p className="label">Días</p>
                  <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>
                    {selected.currentGroup.dayOfWeek}
                  </p>
                </div>
                <div>
                  <p className="label">Profesor/a</p>
                  <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>
                    {selected.currentGroup.teacher}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alerta de cuotas pendientes */}
          {selected.pendingCount > 0 && selected.nextPending && (
            <div style={{
              background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <p style={{ color: '#facc15', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>
                  {selected.pendingCount === 1
                    ? 'Tienes 1 cuota pendiente'
                    : `Tienes ${selected.pendingCount} cuotas pendientes`}
                </p>
                <p style={{ color: '#a08000', fontSize: '12px' }}>
                  Próxima: {monthLabel(selected.nextPending.month, selected.nextPending.year)} — {selected.nextPending.amount.toFixed(2)} €
                </p>
              </div>
            </div>
          )}

          {/* Pestañas */}
          <div style={{
            display: 'flex', borderBottom: '1px solid #1e1e1e', marginBottom: '16px',
            overflowX: 'auto',
          }}>
            {(['pagos', 'asistencia'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 16px', fontSize: '13px', fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? '#a78bfa' : '#666',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
                  marginBottom: '-1px', whiteSpace: 'nowrap',
                  minHeight: '44px',
                }}
              >
                {t === 'pagos' ? '◈ Pagos' : '✓ Asistencia'}
              </button>
            ))}
          </div>

          {/* ── Tab Pagos ── */}
          {tab === 'pagos' && (
            <div>
              {payments.length === 0 ? (
                <p style={{ color: '#555', textAlign: 'center', padding: '32px', fontSize: '14px' }}>
                  Sin registros de pago aún
                </p>
              ) : (
                <>
                  {/* Pendientes primero */}
                  {pendingPayments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p className="label" style={{ marginBottom: '8px' }}>Cuotas pendientes</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pendingPayments.map(p => (
                          <div key={p.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: 500 }}>
                                {monthLabel(p.month, p.year)}
                              </p>
                              {p.notes && <p style={{ color: '#555', fontSize: '12px' }}>{p.notes}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {statusBadge(p.status)}
                              <p style={{ color: '#e0e0e0', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                                {p.amount.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pagados */}
                  {paidPayments.length > 0 && (
                    <div>
                      <p className="label" style={{ marginBottom: '8px' }}>Historial de pagos</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {paidPayments.map(p => (
                          <div key={p.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: 500 }}>
                                {monthLabel(p.month, p.year)}
                              </p>
                              {p.paidAt && (
                                <p style={{ color: '#555', fontSize: '12px' }}>
                                  Pagado el {new Date(p.paidAt).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {statusBadge(p.status)}
                              <p style={{ color: '#e0e0e0', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                                {p.amount.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab Asistencia ── */}
          {tab === 'asistencia' && (
            <div>
              {!attendance ? (
                <p style={{ color: '#555', textAlign: 'center', padding: '32px', fontSize: '14px' }}>
                  Cargando asistencia…
                </p>
              ) : (
                <>
                  {/* Resumen */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { label: 'Presencias', value: attendance.summary.presente, color: '#4ade80' },
                      { label: 'Ausencias',  value: attendance.summary.ausente,  color: '#f87171' },
                      { label: 'Justificadas', value: attendance.summary.justificado, color: '#facc15' },
                    ].map(s => (
                      <div key={s.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>
                          {s.value}
                        </p>
                        <p className="label" style={{ marginTop: '2px' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Lista últimos 90 días */}
                  <p className="label" style={{ marginBottom: '8px' }}>Últimos 90 días</p>
                  {attendance.records.length === 0 ? (
                    <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                      Sin registros de asistencia aún
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {attendance.records.map(r => (
                        <div key={r.id} className="card" style={{
                          padding: '10px 14px', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div>
                            <p style={{ color: '#d0d0d0', fontSize: '13px', fontWeight: 500 }}>
                              {new Date(r.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <p style={{ color: '#555', fontSize: '12px' }}>{r.group.name}</p>
                          </div>
                          {attendanceBadge(r.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
