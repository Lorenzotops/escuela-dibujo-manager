import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/withdrawals
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        student: {
          include: { guardians: { where: { isPrimary: true } } },
        },
      },
      orderBy: { withdrawalDate: 'desc' },
    });
    res.json(withdrawals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/withdrawals — Dar de baja a un alumno
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, withdrawalDate, reason, notes, contactLater } = req.body;

    // Verificar que el alumno existe
    const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Cambiar estado del alumno
    await prisma.student.update({
      where: { id: Number(studentId) },
      data: { status: 'baja' },
    });

    // Cerrar asignación de grupo
    await prisma.studentGroup.updateMany({
      where: { studentId: Number(studentId), isCurrent: true },
      data: { isCurrent: false, leftAt: new Date() },
    });

    // Crear registro de baja
    const withdrawal = await prisma.withdrawal.upsert({
      where: { studentId: Number(studentId) },
      update: {
        withdrawalDate: new Date(withdrawalDate),
        reason,
        notes: notes || '',
        contactLater: contactLater || false,
        reactivatedAt: null,
      },
      create: {
        studentId: Number(studentId),
        withdrawalDate: new Date(withdrawalDate),
        reason,
        notes: notes || '',
        contactLater: contactLater || false,
      },
    });

    res.status(201).json(withdrawal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/withdrawals/:studentId/reactivate — Reactivar alumno
router.put('/:studentId/reactivate', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const { groupId } = req.body;

    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: 'activo',
        currentGroupId: groupId ? Number(groupId) : null,
      },
    });

    await prisma.withdrawal.update({
      where: { studentId },
      data: { reactivatedAt: new Date() },
    });

    if (groupId) {
      await prisma.studentGroup.create({
        data: { studentId, groupId: Number(groupId), isCurrent: true },
      });
    }

    res.json({ message: 'Alumno reactivado correctamente' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
