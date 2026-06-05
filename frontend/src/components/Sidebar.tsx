import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/',            label: 'Dashboard',       icon: '📊', end: true },
  { to: '/alumnos',     label: 'Alumnos',          icon: '🎓' },
  { to: '/pagos',       label: 'Pagos',            icon: '💰' },
  { to: '/facturas',    label: 'Facturación',      icon: '🧾' },
  { to: '/asistencia',  label: 'Asistencia',       icon: '✅' },
  { to: '/grupos',      label: 'Grupos',           icon: '👥' },
  { to: '/bajas',       label: 'Bajas',            icon: '📤', adminOnly: true },
  { to: '/estadisticas',label: 'Estadísticas',     icon: '📈' },
  { to: '/configuracion',label:'Configuración',    icon: '⚙️',  adminOnly: true },
  { to: '/usuarios',    label: 'Usuarios',         icon: '👤', adminOnly: true },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl">
            🎨
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Escuela de Dibujo</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
