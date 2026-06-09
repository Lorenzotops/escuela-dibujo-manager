import React, { useEffect, useState } from 'react';
import api from '../../api/client';

interface MessageReply {
  id: number;
  body: string;
  createdAt: string;
  fromUser: { name: string; role: string };
}

interface Message {
  id: number;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  fromUser: { name: string; email: string };
  student: { fullName: string } | null;
  replies: MessageReply[];
}

export default function MessagesList() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [selected,    setSelected]    = useState<Message | null>(null);
  const [reply,       setReply]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);

  const loadMessages = () =>
    api.get('/messages').then(r => {
      setMessages(r.data);
      setLoading(false);
    });

  useEffect(() => { loadMessages(); }, []);

  const handleSelectMessage = async (m: Message) => {
    setSelected(m);
    setReply('');
    if (!m.read) {
      await api.patch(`/messages/${m.id}/read`);
      setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, read: true } : msg));
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${selected.id}/reply`, { body: reply });
      setReply('');
      const r = await api.get('/messages');
      setMessages(r.data);
      const updated = r.data.find((m: Message) => m.id === selected.id);
      if (updated) setSelected(updated);
    } finally {
      setSending(false);
    }
  };

  const unread = messages.filter(m => !m.read).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div style={{ padding: '0' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f0' }}>Mensajes</h1>
        {unread > 0 && (
          <span style={{
            background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 700,
            padding: '2px 8px', borderRadius: '99px',
          }}>
            {unread} nuevo{unread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</p>
          <p style={{ color: '#555', fontSize: '14px' }}>No hay mensajes de las familias aún</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 160px)', minHeight: '400px' }}>

          {/* Lista */}
          <div style={{
            width: '320px', flexShrink: 0, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            {messages.map(m => (
              <div
                key={m.id}
                onClick={() => handleSelectMessage(m)}
                style={{
                  padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                  background: selected?.id === m.id ? 'rgba(124,58,237,0.15)' : '#161616',
                  border: `1px solid ${selected?.id === m.id ? '#7c3aed' : '#1e1e1e'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ fontSize: '13px', fontWeight: m.read ? 500 : 700, color: m.read ? '#d0d0d0' : '#f0f0f0' }}>
                    {!m.read && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', marginRight: '6px', verticalAlign: 'middle' }} />}
                    {m.fromUser.name}
                  </p>
                  <span style={{ fontSize: '11px', color: '#444' }}>
                    {new Date(m.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '2px' }}>{m.subject}</p>
                {m.student && <p style={{ fontSize: '11px', color: '#555' }}>🎓 {m.student.fullName}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    {m.body}
                  </p>
                  {m.replies.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#4ade80', flexShrink: 0 }}>✓ {m.replies.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detalle */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: '#444', fontSize: '14px' }}>Selecciona un mensaje para leerlo</p>
              </div>
            ) : (
              <div className="card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

                {/* Cabecera mensaje */}
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1e1e1e' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f0f0', marginBottom: '8px' }}>
                    {selected.subject}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      De: <strong style={{ color: '#d0d0d0' }}>{selected.fromUser.name}</strong> ({selected.fromUser.email})
                    </p>
                    {selected.student && (
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Sobre: <strong style={{ color: '#d0d0d0' }}>🎓 {selected.student.fullName}</strong>
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#444' }}>
                      {new Date(selected.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Cuerpo + hilo */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {/* Mensaje original */}
                  <div style={{ background: '#111', borderRadius: '10px', padding: '14px 16px', border: '1px solid #1e1e1e' }}>
                    <p style={{ fontSize: '11px', color: '#555', marginBottom: '6px', fontWeight: 600 }}>
                      {selected.fromUser.name} · Familia
                    </p>
                    <p style={{ fontSize: '14px', color: '#d0d0d0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.body}</p>
                  </div>

                  {/* Respuestas */}
                  {selected.replies.map(r => (
                    <div key={r.id} style={{
                      background: 'rgba(124,58,237,0.08)', borderRadius: '10px',
                      padding: '14px 16px', border: '1px solid rgba(124,58,237,0.2)',
                      marginLeft: '16px',
                    }}>
                      <p style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '6px', fontWeight: 600 }}>
                        {r.fromUser.name} · {r.fromUser.role === 'admin' ? 'Administración' : 'Profesor/a'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#d0d0d0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.body}</p>
                      <p style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>
                        {new Date(r.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Formulario de respuesta */}
                <form onSubmit={handleReply} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <textarea
                    className="input"
                    placeholder="Escribe tu respuesta…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={3}
                    required
                    style={{ flex: 1, resize: 'none' }}
                  />
                  <button
                    type="submit" className="btn-primary"
                    disabled={sending || !reply.trim()}
                    style={{ minHeight: '44px', padding: '0 20px', flexShrink: 0 }}
                  >
                    {sending ? '…' : 'Responder'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
