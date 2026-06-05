import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes       from './routes/auth';
import studentRoutes    from './routes/students';
import guardianRoutes   from './routes/guardians';
import groupRoutes      from './routes/groups';
import paymentRoutes    from './routes/payments';
import invoiceRoutes    from './routes/invoices';
import attendanceRoutes from './routes/attendance';
import withdrawalRoutes from './routes/withdrawals';
import statsRoutes      from './routes/stats';
import settingsRoutes   from './routes/settings';
import usersRoutes      from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (Postman, apps móviles) y orígenes permitidos
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (logos subidos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── RUTAS ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/students',    studentRoutes);
app.use('/api/guardians',   guardianRoutes);
app.use('/api/groups',      groupRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/invoices',    invoiceRoutes);
app.use('/api/attendance',  attendanceRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/users',       usersRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── MANEJO DE ERRORES ────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🎨 Escuela de Dibujo Manager API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
