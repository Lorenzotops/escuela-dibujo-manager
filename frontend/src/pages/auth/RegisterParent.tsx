import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function RegisterParent() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden');
    }
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-parent', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Guardar token y redirigir al panel
      localStorage.setItem('token', data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      // Forzar recarga para que AuthContext cargue el usuario
      window.location.href = '/panel-padre';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.jpg"
            alt="Escuela Lorenzo"
            style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', margin: '0 auto 12px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f0f0f0', marginBottom: '4px' }}>
            Escuela Lorenzo
          </h1>
          <p style={{ fontSize: '13px', color: '#666' }}>Portal de familias</p>
        </div>

        {/* Tarjeta */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', marginBottom: '6px' }}>
            Crear cuenta de tutor
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
            Usa el email que facilitaste a la escuela al matricular a tu hijo/a.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="label">Tu nombre completo</label>
              <input
                className="input"
                type="text"
                placeholder="Ej: María García López"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                style={{ marginTop: '4px' }}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                style={{ marginTop: '4px' }}
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ marginTop: '4px' }}
              />
            </div>

            <div>
              <label className="label">Confirmar contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="Repite la contraseña"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
                style={{ marginTop: '4px' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#f87171',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: '4px', minHeight: '44px' }}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#555' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#3a3a3a' }}>
          ¿Problemas para acceder? Contacta con la escuela.
        </p>
      </div>
    </div>
  );
}
