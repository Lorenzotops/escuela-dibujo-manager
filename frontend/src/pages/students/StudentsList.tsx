import React, { useEffect, useState } from 'react';
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
  const [students, setStudents] = useState<Student[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/students', { params });
      setStudents(data);
    } catch {
      toast.error('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchStudents(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/alumnos/nuevo')}>
            <span>+</span> Nuevo alumno
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Buscar por nombre, DNI, tutor, teléfono, colegio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausa">En pausa</option>
            <option value="baja">Baja</option>
          </select>
          <button type="submit" className="btn-primary whitespace-nowrap">🔍 Buscar</button>
        </form>
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Colegio</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Grupo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Tutor</th>
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
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{s.school || '—'}</td>
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
