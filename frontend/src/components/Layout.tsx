import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0a0a0a',
      overflow: 'hidden',
    }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: '220px',
      }}
        className="lg-margin"
      >
        {/* ── Header móvil ── */}
        <header
          className="lg:hidden"
          style={{
            background: '#0f0f0f',
            borderBottom: '1px solid #1e1e1e',
            padding: '0 16px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: '36px',
              height: '36px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#a0a0a0',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}>
              🎨
            </div>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#f0f0f0' }}>
              Escuela Lorenzo
            </span>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '24px 24px',
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fix: on mobile, no left margin */}
      <style>{`
        @media (max-width: 1023px) {
          .lg-margin { margin-left: 0 !important; }
        }
        @media (min-width: 1024px) {
          aside { position: static !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
