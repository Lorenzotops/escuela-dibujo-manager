import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function ResetPassword() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: '380px' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</p>
          <h2 style={{ color: '#e0e0e0', marginBottom: '8px' }}>Enlace no válido</h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
            Este enlace de recuperación no es válido o ha caducado.
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-block', padding: '10px 20px' }}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (password.length < 6)  return setError('Mínimo 6 caracteres');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'El enlace no es válido o ha caducado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.jpg" alt="Escuela Lorenzo"
            style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', margin: '0 auto 12px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f0' }}>Escuela Lorenzo</h1>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', marginBottom: '10px' }}>
                Contraseña actualizada
              </h2>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Redirigiendo al inicio de sesión…
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', marginBottom: '6px' }}>
                Nueva contraseña
              </h2>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
                Elige una contraseña segura de al menos 6 caracteres.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label">Nueva contraseña</label>
                  <input
                    className="input" type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required style={{ marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label className="label">Confirmar contraseña</label>
                  <input
                    className="input" type="password"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required style={{ marginTop: '4px' }}
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
                  type="submit" className="btn-primary"
                  disabled={loading} style={{ minHeight: '44px' }}
                >
                  {loading ? 'Guardando…' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#555' }}>
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
