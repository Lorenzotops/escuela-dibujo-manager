import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// Navegación para ADMIN
const adminSections = [
  {
    label: 'Principal',
    items: [
      { to: '/',             label: 'Dashboard',      icon: '⬡', end: true },
      { to: '/alumnos',      label: 'Alumnos',        icon: '🎓' },
      { to: '/grupos',       label: 'Grupos',         icon: '👥' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/asistencia',   label: 'Asistencia',     icon: '✓' },
      { to: '/pagos',        label: 'Pagos',          icon: '◈' },
      { to: '/facturas',     label: 'Facturación',    icon: '◻' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/estadisticas', label: 'Estadísticas',   icon: '▲' },
      { to: '/bajas',        label: 'Bajas',          icon: '↗' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/configuracion',label: 'Configuración',  icon: '◎' },
      { to: '/usuarios',     label: 'Usuarios',       icon: '◯' },
    ],
  },
];

// Navegación para PROFESOR — solo sus 3 funciones permitidas
const profesorSections = [
  {
    label: 'Mis acciones',
    items: [
      { to: '/asistencia',    label: 'Asistencia',     icon: '✓' },
      { to: '/alumnos/nuevo', label: 'Nuevo alumno',   icon: '🎓' },
      { to: '/pagos/nuevo',   label: 'Registrar pago', icon: '◈' },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = isAdmin ? adminSections : profesorSections;

  const renderNavItem = (item: { to: string; label: string; icon: string; end?: boolean }) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onClose}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '7px 8px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#a78bfa' : '#888',
          background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
          textDecoration: 'none',
          transition: 'all 0.12s ease',
          marginBottom: '1px',
          borderLeft: isActive ? '2px solid #7c3aed' : '2px solid transparent',
        })}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          if (!el.style.background.includes('rgba(124,58,237,0.12)')) {
            el.style.background = 'rgba(255,255,255,0.04)';
            el.style.color = '#c0c0c0';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          if (!el.style.background.includes('rgba(124,58,237,0.12)')) {
            el.style.background = 'transparent';
            el.style.color = '#888';
          }
        }}
      >
        <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
          {item.icon}
        </span>
        {item.label}
      </NavLink>
    </li>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        style={{
          width: '220px',
          minWidth: '220px',
          background: '#0f0f0f',
          borderRight: '1px solid #1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="lg:static lg:translate-x-0"
      >
        {/* ── Logo ── */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Logo imagen — coloca logo.png en frontend/public/ */}
            <img
              src="/logo.jpg"
              alt="Logo Escuela Lorenzo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Fallback si no hay logo.png */}
            <div style={{
              width: '40px', height: '40px', display: 'none', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              borderRadius: '10px', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
            }}>
              🎨
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '13px', color: '#f0f0f0', lineHeight: 1.2 }}>
                Escuela Lorenzo
              </p>
              <p style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>
                {isAdmin ? 'Administración' : 'Profesor'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {sections.map((section) => (
            <div key={section.label} style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '10px', fontWeight: 600, color: '#3a3a3a',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '0 8px', marginBottom: '4px',
              }}>
                {section.label}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.items.map(renderNavItem)}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── User / Logout ── */}
        <div style={{ padding: '12px 8px 16px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px', borderRadius: '8px', marginBottom: '6px',
            background: '#141414', border: '1px solid #1e1e1e',
          }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontWeight: 700,
              fontSize: '12px', flexShrink: 0,
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '10px', color: '#555', textTransform: 'capitalize' }}>
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 8px', borderRadius: '8px', fontSize: '12px',
              fontWeight: 500, color: '#666', background: 'transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.12s ease', textAlign: 'left',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#666';
            }}
          >
            <span style={{ fontSize: '13px' }}>⏻</span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
