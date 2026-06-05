import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Páginas
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import StudentsList  from './pages/students/StudentsList';
import StudentForm   from './pages/students/StudentForm';
import StudentDetail from './pages/students/StudentDetail';
import PaymentsList  from './pages/payments/PaymentsList';
import PaymentForm   from './pages/payments/PaymentForm';
import InvoicesList  from './pages/invoices/InvoicesList';
import InvoiceGenerator from './pages/invoices/InvoiceGenerator';
import AttendancePage   from './pages/attendance/AttendancePage';
import TakeAttendance   from './pages/attendance/TakeAttendance';
import GroupsList    from './pages/groups/GroupsList';
import GroupForm     from './pages/groups/GroupForm';
import WithdrawalsList from './pages/withdrawals/WithdrawalsList';
import Stats         from './pages/stats/Stats';
import Settings      from './pages/settings/Settings';
import Users         from './pages/users/Users';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div></div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="alumnos"           element={<StudentsList />} />
        <Route path="alumnos/nuevo"     element={<AdminRoute><StudentForm /></AdminRoute>} />
        <Route path="alumnos/:id"       element={<StudentDetail />} />
        <Route path="alumnos/:id/editar" element={<AdminRoute><StudentForm /></AdminRoute>} />
        <Route path="pagos"             element={<PaymentsList />} />
        <Route path="pagos/nuevo"       element={<AdminRoute><PaymentForm /></AdminRoute>} />
        <Route path="facturas"          element={<InvoicesList />} />
        <Route path="facturas/nueva"    element={<AdminRoute><InvoiceGenerator /></AdminRoute>} />
        <Route path="asistencia"        element={<AttendancePage />} />
        <Route path="asistencia/pasar-lista" element={<TakeAttendance />} />
        <Route path="grupos"            element={<GroupsList />} />
        <Route path="grupos/nuevo"      element={<AdminRoute><GroupForm /></AdminRoute>} />
        <Route path="grupos/:id/editar" element={<AdminRoute><GroupForm /></AdminRoute>} />
        <Route path="bajas"             element={<AdminRoute><WithdrawalsList /></AdminRoute>} />
        <Route path="estadisticas"      element={<Stats />} />
        <Route path="configuracion"     element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="usuarios"          element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
