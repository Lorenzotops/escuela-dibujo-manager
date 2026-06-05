import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import GuardiansTab from './tabs/GuardiansTab';
import PaymentsTab  from './tabs/PaymentsTab';
import AttendanceTab from './tabs/AttendanceTab';
import WithdrawalTab from './tabs/WithdrawalTab';
import MessagesTab  from './tabs/MessagesTab';

const TABS = ['Datos', 'Tutores', 'Pagos', 'Asistencia', 'Comunicación', 'Baja'];

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Datos');

  const load = () => {
    setLoading(true);
    api.get(`/students/${id}`)
      .then(r => setStudent(r.data))
      .catch(() => toast.error('Error al cargar alumno'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;
  if (!student) return <p className="text-center text-gray-500 py-12">Alumno no encontrado</p>;

  const currentGroup = student.studentGroups?.find((sg: any) => sg.isCurrent)?.group;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/alumnos')} className="btn-secondary py-1.5 px-3 text-sm">← Volver</button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-xl">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
              <p className="text-gray-500 text-sm">
                {student.birthDate ? `${calcAge(student.birthDate)} años` : ''}
                {student.school ? ` · ${student.school}` : ''}
                {currentGroup ? ` · ${currentGroup.name}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge-${student.status}`}>{student.status}</span>
                {student.overduePayments?.length > 0 && (
                  <span className="badge-atrasado">⚠️ {student.overduePayments.length} cuota(s) atrasada(s)</span>
                )}
              </div>
            </div>
          </div>
          {isAdmin && student.status !== 'baja' && (
            <button className="btn-secondary text-sm" onClick={() => navigate(`/alumnos/${id}/editar`)}>
              ✏️ Editar
            </button>
          )}
        </div>

        {/* Alerta de pagos atrasados */}
        {student.overduePayments?.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800 text-sm">⚠️ Este alumno tiene cuotas anteriores pendientes:</p>
            <ul className="mt-1 space-y-0.5">
              {student.overduePayments.map((p: any) => (
                <li key={p.id} className="text-sm text-red-700">
                  → {new Date(p.year, p.month - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })} — {p.status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'Baja' && student.status !== 'baja' ? '📤 Dar de baja' : t}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de pestañas */}
      {tab === 'Datos' && <DatosTab student={student} />}
      {tab === 'Tutores' && <GuardiansTab studentId={Number(id)} guardians={student.guardians} isAdmin={isAdmin} onRefresh={load} />}
      {tab === 'Pagos' && <PaymentsTab studentId={Number(id)} />}
      {tab === 'Asistencia' && <AttendanceTab studentId={Number(id)} />}
      {tab === 'Comunicación' && <MessagesTab student={student} />}
      {tab === 'Baja' && <WithdrawalTab student={student} isAdmin={isAdmin} onRefresh={load} />}
    </div>
  );
}

function DatosTab({ student }: { student: any }) {
  const fields = [
    { label: 'Nombre completo',    value: student.fullName },
    { label: 'Fecha de nacimiento', value: student.birthDate ? new Date(student.birthDate).toLocaleDateString('es-ES') : '—' },
    { label: 'DNI',                value: student.dni || '—' },
    { label: 'Dirección',          value: student.address || '—' },
    { label: 'Colegio',            value: student.school || '—' },
    { label: 'Fecha de alta',      value: student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('es-ES') : '—' },
    { label: 'Cómo llegó',         value: student.howFoundUs || '—' },
    { label: 'Referido por',       value: student.referredBy || '—' },
    { label: 'Motivo de inscripción', value: student.enrollmentReason || '—' },
  ];

  const history = student.studentGroups || [];

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.label}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{f.label}</p>
            <p className="text-sm text-gray-900 mt-0.5">{f.value}</p>
          </div>
        ))}
        {student.notes && (
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Observaciones</p>
            <p className="text-sm text-gray-900 mt-0.5">{student.notes}</p>
          </div>
        )}
      </div>

      {/* Historial de grupos */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Historial de grupos</h3>
          <div className="space-y-2">
            {history.map((sg: any) => (
              <div key={sg.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{sg.group?.name}</span>
                <div className="text-gray-500 text-xs">
                  {new Date(sg.assignedAt).toLocaleDateString('es-ES')}
                  {sg.leftAt ? ` → ${new Date(sg.leftAt).toLocaleDateString('es-ES')}` : ' → Actual'}
                  {sg.isCurrent && <span className="ml-2 badge-active">actual</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
