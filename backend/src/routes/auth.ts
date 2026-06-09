import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendWelcomeParent, sendPasswordReset } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register-parent
// Permite a un tutor registrarse si su email ya está en la BD como Guardian
router.post('/register-parent', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar que el email existe como tutor en el sistema
    const guardian = await prisma.guardian.findFirst({
      where: { email },
      include: { student: { select: { fullName: true } } },
    });
    if (!guardian) {
      return res.status(403).json({
        error: 'Tu email no está registrado en la escuela. Contacta con la administración.',
      });
    }

    // Verificar que no tiene ya una cuenta
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este email. Inicia sesión.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'padre', active: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    // Email de bienvenida (no bloqueante — si falla el email la cuenta igual se crea)
    sendWelcomeParent(email, name, guardian.student.fullName).catch(e =>
      console.error('Error enviando email de bienvenida:', e.message)
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
// Genera un token de reseteo y envía el email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Siempre responder con éxito para no revelar si el email existe
    if (!user || !user.active) {
      return res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
    }

    // Invalidar tokens anteriores del mismo email
    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Crear nuevo token (expira en 1 hora)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

    // Enviar email
    await sendPasswordReset(email, user.name, token);

    res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
  } catch (err: any) {
    console.error('Error en forgot-password:', err.message);
    // No exponer detalles del error
    res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
  }
});

// POST /api/auth/reset-password
// Valida el token y actualiza la contraseña
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token y contraseña requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'El enlace no es válido o ha caducado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email: resetToken.email }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
