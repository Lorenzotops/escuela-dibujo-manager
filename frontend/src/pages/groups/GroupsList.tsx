import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function GroupsList() {
  const [groups,  setGroups]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/groups')
      .then(r => setGroups(r.data))
      .catch(() => toast.error('Error al cargar grupos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Grupos y horarios</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => navigate('/grupos/nuevo')}>+ Nuevo grupo</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map(g => {
          const pct = g.enrolled / g.maxCapacity;
          const barColor = pct >= 1 ? 'bg-red-500' : pct >= 0.8 ? 'bg-yellow-500' : 'bg-green-500';
          return (
            <div key={g.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-bold text-gray-900 text-lg">{g.name}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${g.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {g.available > 0 ? `${g.available} plazas libres` : 'Completo'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <p>📅 {g.dayOfWeek}</p>
                <p>🕐 {g.startTime} - {g.endTime}</p>
                <p>👩‍🏫 {g.teacher}</p>
              </div>
              {/* Barra de capacidad */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{g.enrolled} inscritos</span>
                  <span>{g.maxCapacity} máx</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 1) * 100}%` }} />
                </div>
              </div>
              {/* Alumnos */}
              {g.studentGroups?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-400 mb-2 uppercase">Alumnos</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {g.studentGroups.filter((sg: any) => sg.student.status === 'activo').map((sg: any) => (
                      <div key={sg.student.id}
                        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => navigate(`/alumnos/${sg.student.id}`)}>
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                          {sg.student.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{sg.student.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-end">
                  <button className="btn-secondary text-sm" onClick={() => navigate(`/grupos/${g.id}/editar`)}>
                    ✏️ Editar grupo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
