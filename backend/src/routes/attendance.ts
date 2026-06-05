import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ─── RUTAS ESPECÍFICAS PRIMERO (antes de /:groupId) ──────────────────────────

// GET /api/attendance/student/:studentId — Historial de un alumno
router.get('/student/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    const where: any = { studentId: Number(req.params.studentId) };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date  = { gte: start, lte: end };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 60,
    });

    const stats = {
      total:       attendance.length,
      presente:    attendance.filter(a => a.status === 'presente').length,
      ausente:     attendance.filter(a => a.status === 'ausente').length,
      justificado: attendance.filter(a => a.status === 'justificado').length,
    };

    res.json({ attendance, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/absences/frequent — Alumnos que faltan mucho
router.get('/absences/frequent', async (_req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        status: 'ausente',
        date: { gte: thirtyDaysAgo },
      },
      _count: { studentId: true },
      orderBy: { _count: { studentId: 'desc' } },
      having: { studentId: { _count: { gt: 3 } } },
    });

    const studentsWithAbsences = await Promise.all(
      result.map(async r => {
        const student = await prisma.student.findUnique({
          where: { id: r.studentId },
          select: { id: true, fullName: true, currentGroupId: true },
        });
        return { student, absences: r._count.studentId };
      })
    );

    res.json(studentsWithAbsences);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/absence-notification — Padre avisa ausencia
router.post('/absence-notification', async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, date, reason } = req.body;
    const notification = await prisma.absenceNotification.create({
      data: {
        studentId: Number(studentId),
        date: new Date(date),
        reason: reason || '',
      },
    });
    res.status(201).json(notification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance — Guardar/actualizar asistencia de una clase
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, date, records } = req.body;
    // records = [{ studentId, status, notes }]

    const dateObj = new Date(date);
    const start   = new Date(dateObj); start.setHours(0, 0, 0, 0);
    const end     = new Date(dateObj); end.setHours(23, 59, 59, 999);

    const saved = [];
    for (const record of records) {
      const existing = await prisma.attendance.findFirst({
        where: { studentId: record.studentId, date: { gte: start, lte: end } },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: record.status, notes: record.notes || '' },
        });
        saved.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            groupId:   Number(groupId),
            date:      start,
            status:    record.status,
            notes:     record.notes || '',
          },
        });
        saved.push(created);
      }
    }

    res.json({ saved: saved.length, records: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RUTA GENÉRICA AL FINAL (captura /:groupId) ───────────────────────────────

// GET /api/attendance/:groupId?date=YYYY-MM-DD — Asistencia de un grupo en una fecha
router.get('/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    const dateStr = req.query.date as string;
    const date    = dateStr ? new Date(dateStr) : new Date();
    const start   = new Date(date); start.setHours(0, 0, 0, 0);
    const end     = new Date(date); end.setHours(23, 59, 59, 999);

    const studentGroups = await prisma.studentGroup.findMany({
      where: { groupId, isCurrent: true },
      include: {
        student: {
          include: {
            attendance: {
              where: { date: { gte: start, lte: end } },
            },
          },
        },
      },
    });

    const students = studentGroups
      .filter(sg => sg.student.status === 'activo')
      .map(sg => ({
        student:    sg.student,
        attendance: sg.student.attendance[0] || null,
      }));

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
