import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/groups
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: { active: true },
      include: {
        studentGroups: {
          where: { isCurrent: true },
          include: { student: { select: { id: true, fullName: true, status: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const groupsWithCapacity = groups.map(g => ({
      ...g,
      enrolled: g.studentGroups.filter(sg => sg.student.status === 'activo').length,
      available: g.maxCapacity - g.studentGroups.filter(sg => sg.student.status === 'activo').length,
    }));

    res.json(groupsWithCapacity);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        studentGroups: {
          where: { isCurrent: true },
          include: {
            student: {
              include: {
                guardians: { where: { isPrimary: true } },
                payments: {
                  where: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
                },
              },
            },
          },
        },
      },
    });
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, dayOfWeek, startTime, endTime, teacher, maxCapacity, notes } = req.body;
    const group = await prisma.group.create({
      data: {
        name, dayOfWeek, startTime, endTime, teacher,
        maxCapacity: Number(maxCapacity) || 15,
        notes: notes || '',
      },
    });
    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/groups/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, dayOfWeek, startTime, endTime, teacher, maxCapacity, notes, active } = req.body;
    const updated = await prisma.group.update({
      where: { id: Number(req.params.id) },
      data: { name, dayOfWeek, startTime, endTime, teacher, maxCapacity: Number(maxCapacity), notes, active },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/assign  — Cambiar alumno de grupo
router.post('/:id/assign', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const groupId = Number(req.params.id);
    const { studentId } = req.body;

    // Verificar cupo
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const enrolled = await prisma.studentGroup.count({
      where: { groupId, isCurrent: true },
    });

    if (enrolled >= group.maxCapacity) {
      return res.status(400).json({ error: `El grupo "${group.name}" está completo (${group.maxCapacity} alumnos máximo)` });
    }

    // Cerrar asignación anterior
    await prisma.studentGroup.updateMany({
      where: { studentId: Number(studentId), isCurrent: true },
      data: { isCurrent: false, leftAt: new Date() },
    });

    // Nueva asignación
    const sg = await prisma.studentGroup.create({
      data: { studentId: Number(studentId), groupId, isCurrent: true },
    });

    // Actualizar currentGroupId en el alumno
    await prisma.student.update({
      where: { id: Number(studentId) },
      data: { currentGroupId: groupId },
    });

    res.json(sg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
