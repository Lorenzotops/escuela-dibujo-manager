import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/guardians/student/:studentId
router.get('/student/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    const guardians = await prisma.guardian.findMany({
      where: { studentId: Number(req.params.studentId) },
      orderBy: { isPrimary: 'desc' },
    });
    res.json(guardians);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guardians
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, fullName, dni, phone, email, address, relationship, notes, isPrimary } = req.body;

    // Si es primario, desmarcar el anterior
    if (isPrimary) {
      await prisma.guardian.updateMany({
        where: { studentId: Number(studentId) },
        data: { isPrimary: false },
      });
    }

    const guardian = await prisma.guardian.create({
      data: {
        studentId: Number(studentId),
        fullName, dni: dni || '', phone, email: email || '',
        address: address || '', relationship: relationship || 'madre',
        notes: notes || '', isPrimary: isPrimary !== false,
      },
    });

    res.status(201).json(guardian);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guardians/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { fullName, dni, phone, email, address, relationship, notes, isPrimary } = req.body;

    if (isPrimary) {
      const guardian = await prisma.guardian.findUnique({ where: { id } });
      if (guardian) {
        await prisma.guardian.updateMany({
          where: { studentId: guardian.studentId },
          data: { isPrimary: false },
        });
      }
    }

    const updated = await prisma.guardian.update({
      where: { id },
      data: { fullName, dni, phone, email, address, relationship, notes, isPrimary },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/guardians/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.guardian.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Tutor eliminado' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
