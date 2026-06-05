import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { name: '', email: '', password: '', role: 'profesor' };

export default function Users() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState<any>(null);
  const [saving,  setSaving]  = useState(false);
  const { user: me } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (u: any) => { setEditing(u); setForm({ ...u, password: '' }); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Nombre y email son obligatorios'); return; }
    if (!editing && !form.password) { toast.error('La contraseña es obligatoria para usuarios nuevos'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, form);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/users', form);
        toast.success('Usuario creado');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u: any) => {
    if (u.id === me?.id) { toast.error('No puedes desactivarte a ti mismo'); return; }
    await api.put(`/users/${u.id}`, { ...u, active: !u.active });
    toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button className="btn-primary" onClick={openNew}>+ Nuevo usuario</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className={`${!u.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{u.name} {u.id === me?.id && <span className="text-xs text-gray-400">(tú)</span>}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={u.active ? 'badge-active' : 'badge-baja'}>{u.active ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary py-1 px-2 text-xs" onClick={() => openEdit(u)}>Editar</button>
                    {u.id !== me?.id && (
                      <button onClick={() => toggleActive(u)} className={`py-1 px-2 text-xs rounded-lg ${u.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
              <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={set('email')} required /></div>
              <div>
                <label className="label">Contraseña {editing ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input type="password" className="input" value={form.password} onChange={set('password')} />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="admin">Administrador</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
