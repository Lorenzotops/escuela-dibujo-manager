import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/students
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, groupId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (groupId) where.currentGroupId = Number(groupId);
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { dni: { contains: String(search) } },
        { school: { contains: String(search) } },
        { guardians: { some: { fullName: { contains: String(search) } } } },
        { guardians: { some: { phone: { contains: String(search) } } } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        guardians: { where: { isPrimary: true } },
        studentGroups: {
          where: { isCurrent: true },
          include: { group: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        guardians: true,
        studentGroups: { include: { group: true }, orderBy: { assignedAt: 'desc' } },
        payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
        invoices: { orderBy: { issueDate: 'desc' } },
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        withdrawal: true,
      },
    });
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Calcular cuotas atrasadas
    const now = new Date();
    const overduePayments = student.payments.filter(p => p.status === 'atrasado' || p.status === 'pendiente');

    res.json({ ...student, overduePayments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName, birthDate, dni, address, school, howFoundUs,
      referredBy, enrollmentReason, enrollmentDate, currentGroupId, notes,
    } = req.body;

    // Evitar duplicados por nombre
    const existing = await prisma.student.findFirst({
      where: { fullName: { equals: fullName } },
    });
    if (existing) {
      return res.status(409).json({ error: `Ya existe un alumno con el nombre "${fullName}"`, existingId: existing.id });
    }

    const student = await prisma.student.create({
      data: {
        fullName,
        birthDate: new Date(birthDate),
        dni: dni || '',
        address: address || '',
        school: school || '',
        howFoundUs: howFoundUs || '',
        referredBy: referredBy || '',
        enrollmentReason: enrollmentReason || '',
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        currentGroupId: currentGroupId ? Number(currentGroupId) : null,
        notes: notes || '',
      },
    });

    // Asignar al grupo si se especificó
    if (currentGroupId) {
      await prisma.studentGroup.create({
        data: {
          studentId: student.id,
          groupId: Number(currentGroupId),
          isCurrent: true,
        },
      });
    }

    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      fullName, birthDate, dni, address, school, howFoundUs,
      referredBy, enrollmentReason, currentGroupId, notes, status,
    } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Si cambia de grupo, actualizar historial
    if (currentGroupId && currentGroupId !== student.currentGroupId) {
      // Cerrar grupo anterior
      await prisma.studentGroup.updateMany({
        where: { studentId: id, isCurrent: true },
        data: { isCurrent: false, leftAt: new Date() },
      });
      // Abrir grupo nuevo
      await prisma.studentGroup.create({
        data: { studentId: id, groupId: Number(currentGroupId), isCurrent: true },
      });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        fullName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        dni, address, school, howFoundUs, referredBy, enrollmentReason,
        currentGroupId: currentGroupId ? Number(currentGroupId) : null,
        notes, status,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Alumno eliminado' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
