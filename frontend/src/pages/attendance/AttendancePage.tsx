import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function AttendancePage() {
  const navigate = useNavigate();
  const [groups,  setGroups]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get('/groups').then(r => setGroups(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Botón principal */}
      <div
        className="card bg-primary-600 text-white cursor-pointer hover:bg-primary-700 transition-colors p-6 flex items-center gap-4"
        onClick={() => navigate('/asistencia/pasar-lista')}
      >
        <div className="text-4xl">✅</div>
        <div>
          <h2 className="text-xl font-bold">Pasar lista ahora</h2>
          <p className="text-primary-100 text-sm mt-0.5">Selecciona grupo y marca presentes / ausentes</p>
        </div>
        <span className="ml-auto text-2xl opacity-70">→</span>
      </div>

      {/* Pasar lista por grupo rápido */}
      {!loading && groups.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Acceso rápido por grupo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {groups.map(g => (
              <div
                key={g.id}
                className="card cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
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
  );
}
