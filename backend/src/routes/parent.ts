import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware: solo padres pueden acceder a estas rutas
const requirePadre = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'padre') {
    return res.status(403).json({ error: 'Acceso solo para tutores/padres' });
  }
  next();
};

// Helper: devuelve los studentIds vinculados al padre autenticado
async function getChildrenIds(email: string): Promise<number[]> {
  const guardians = await prisma.guardian.findMany({
    where: { email },
    select: { studentId: true },
  });
  return guardians.map(g => g.studentId);
}

// ─── GET /api/parent/children ─────────────────────────────────────────────────
// Devuelve los alumnos vinculados al tutor autenticado
router.get('/children', authenticate, requirePadre, async (req: AuthRequest, res: Response) => {
  try {
    const childIds = await getChildrenIds(req.user!.email);
    if (childIds.length === 0) {
      return res.json([]);
    }

    const students = await prisma.student.findMany({
      where: { id: { in: childIds } },
      include: {
        guardians: { where: { email: req.user!.email }, select: { fullName: true, relationship: true } },
        studentGroups: {
          where: { isCurrent: true },
          include: { group: { select: { name: true, dayOfWeek: true, startTime: true, endTime: true, teacher: true } } },
        },
      },
    });

    // Añadir resumen de pagos pendientes
    const result = await Promise.all(students.map(async (s) => {
      const pendingPayments = await prisma.payment.findMany({
        where: { studentId: s.id, status: { in: ['pendiente', 'atrasado'] } },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      });
      const currentGroup = s.studentGroups[0]?.group ?? null;
      return {
        id: s.id,
        fullName: s.fullName,
        birthDate: s.birthDate,
        enrollmentDate: s.enrollmentDate,
        status: s.status,
        notes: s.notes,
        currentGroup,
        pendingCount: pendingPayments.length,
        nextPending: pendingPayments[0] ?? null,
      };
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/parent/children/:studentId/payments ────────────────────────────
router.get('/children/:studentId/payments', authenticate, requirePadre, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const childIds = await getChildrenIds(req.user!.email);
    if (!childIds.includes(studentId)) {
      return res.status(403).json({ error: 'No tienes acceso a este alumno' });
    }

    const payments = await prisma.payment.findMany({
      where: { studentId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/parent/children/:studentId/attendance ─────────────────────────
router.get('/children/:studentId/attendance', authenticate, requirePadre, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const childIds = await getChildrenIds(req.user!.email);
    if (!childIds.includes(studentId)) {
      return res.status(403).json({ error: 'No tienes acceso a este alumno' });
    }

    // Últimos 90 días
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const records = await prisma.attendance.findMany({
      where: { studentId, date: { gte: since } },
      orderBy: { date: 'desc' },
      include: { group: { select: { name: true } } },
    });

    const total     = records.length;
    const presente  = records.filter(r => r.status === 'presente').length;
    const ausente   = records.filter(r => r.status === 'ausente').length;
    const justificado = records.filter(r => r.status === 'justificado').length;

    res.json({ summary: { total, presente, ausente, justificado }, records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
