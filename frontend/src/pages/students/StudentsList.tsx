import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  fullName: string;
  birthDate: string;
  school: string;
  status: string;
  currentGroupId: number | null;
  guardians: Array<{ fullName: string; phone: string }>;
  studentGroups: Array<{ group: { name: string } }>;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function StudentsList() {
  const [students,   setStudents]   = useState<Student[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<number, any>>({});
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const params: any = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [studentsRes, paymentsRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/payments', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
      ]);

      setStudents(studentsRes.data);

      const map: Record<number, any> = {};
      paymentsRes.data.forEach((p: any) => { map[p.studentId] = p; });
      setPaymentMap(map);
    } catch {
      toast.error('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const PaymentCell = ({ student }: { student: Student }) => {
    if (student.status === 'baja') return <span className="text-gray-400 text-xs">—</span>;
    const p = paymentMap[student.id];
    if (!p) return (
      <span className="badge-atrasado text-xs">Sin pago</span>
    );
    if (p.status === 'pagado') return (
      <div>
        <span className="badge-pagado text-xs">Pagado</span>
        {p.paidAt && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{new Date(p.paidAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>}
      </div>
    );
    if (p.status === 'atrasado') return <span className="badge-atrasado text-xs">Atrasado</span>;
    return <span className="badge-pendiente text-xs">Pendiente</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/alumnos/nuevo')}>
            + Nuevo alumno
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Buscar por nombre, DNI, tutor, teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausa">En pausa</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Alumno</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Edad</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Grupo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Tutor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Pago mes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No se encontraron alumnos</td></tr>
                ) : students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/alumnos/${s.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                          {s.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{calcAge(s.birthDate)} años</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {s.studentGroups[0]?.group.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {s.guardians[0] ? (
                        <div>
                          <p className="text-sm">{s.guardians[0].fullName}</p>
                          <p className="text-xs text-gray-400">{s.guardians[0].phone}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <PaymentCell student={s} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${s.status}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            {students.length} alumnos
          </div>
        </div>
      )}
    </div>
  );
}
