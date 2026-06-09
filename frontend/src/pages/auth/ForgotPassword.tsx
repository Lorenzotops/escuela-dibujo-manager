import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Error al enviar el email. Inténtalo de nuevo.');
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

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.jpg" alt="Escuela Lorenzo"
            style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', margin: '0 auto 12px' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f0', marginBottom: '4px' }}>
            Escuela Lorenzo
          </h1>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>📧</p>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', marginBottom: '10px' }}>
                Revisa tu email
              </h2>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                Si existe una cuenta con <strong style={{ color: '#d0d0d0' }}>{email}</strong>,
                recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p style={{ fontSize: '12px', color: '#555' }}>
                El enlace caduca en 1 hora.<br/>Revisa también tu carpeta de spam.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e0e0e0', marginBottom: '6px' }}>
                ¿Olvidaste tu contraseña?
              </h2>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
                Escribe tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="label">Tu email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  type="submit" className="btn-primary"
                  disabled={loading} style={{ minHeight: '44px' }}
                >
                  {loading ? 'Enviando…' : 'Enviar enlace'}
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
