import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stats/dashboard — Datos para el dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth  = new Date(year, month, 0, 23, 59, 59);
    const today        = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd     = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      activeStudents,
      pausedStudents,
      bajasThisMonth,
      pendingPayments,
      overduePayments,
      invoicesThisMonth,
      attendanceToday,
      groups,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'activo' } }),
      prisma.student.count({ where: { status: 'pausa' } }),
      prisma.withdrawal.count({ where: { withdrawalDate: { gte: firstOfMonth, lte: lastOfMonth } } }),
      prisma.payment.count({ where: { status: 'pendiente', year, month } }),
      prisma.payment.count({ where: { status: 'atrasado' } }),
      prisma.invoice.count({ where: { issueDate: { gte: firstOfMonth, lte: lastOfMonth }, status: { not: 'anulada' } } }),
      prisma.attendance.count({ where: { date: { gte: today, lte: todayEnd }, status: 'presente' } }),
      prisma.group.findMany({
        where: { active: true },
        include: { studentGroups: { where: { isCurrent: true } } },
      }),
    ]);

    const groupsInfo = groups.map(g => ({
      id: g.id,
      name: g.name,
      dayOfWeek: g.dayOfWeek,
      startTime: g.startTime,
      endTime: g.endTime,
      teacher: g.teacher,
      maxCapacity: g.maxCapacity,
      enrolled: g.studentGroups.length,
      available: g.maxCapacity - g.studentGroups.length,
    }));

    // Ingresos del mes
    const monthIncome = await prisma.payment.aggregate({
      where: { status: 'pagado', year, month },
      _sum: { amount: true },
    });

    res.json({
      activeStudents,
      pausedStudents,
      bajasThisMonth,
      pendingPayments,
      overduePayments,
      invoicesThisMonth,
      attendanceToday,
      monthIncome: monthIncome._sum.amount || 0,
      groups: groupsInfo,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/overview — Estadísticas generales
router.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    const now  = new Date();
    const year = now.getFullYear();

    // Altas por mes (año actual)
    const enrollments = await prisma.student.groupBy({
      by: ['enrollmentDate'],
      where: { enrollmentDate: { gte: new Date(year, 0, 1) } },
      _count: true,
    });

    // Bajas por mes (año actual)
    const withdrawals = await prisma.withdrawal.findMany({
      where: { withdrawalDate: { gte: new Date(year, 0, 1) } },
      select: { withdrawalDate: true, reason: true },
    });

    // Motivos de baja
    const withdrawalReasons = await prisma.withdrawal.groupBy({
      by: ['reason'],
      _count: { reason: true },
    });

    // Alumnos por colegio
    const bySchool = await prisma.student.groupBy({
      by: ['school'],
      where: { status: 'activo' },
      _count: { school: true },
      orderBy: { _count: { school: 'desc' } },
    });

    // Cómo llegaron
    const howFoundUs = await prisma.student.groupBy({
      by: ['howFoundUs'],
      where: { status: 'activo' },
      _count: { howFoundUs: true },
    });

    // Ingresos por mes (año actual)
    const incomeByMonth = await prisma.payment.groupBy({
      by: ['month', 'year'],
      where: { status: 'pagado', year },
      _sum: { amount: true },
      orderBy: { month: 'asc' },
    });

    // Alumnos por grupo
    const groups = await prisma.group.findMany({
      where: { active: true },
      include: { studentGroups: { where: { isCurrent: true } } },
    });

    res.json({
      enrollments,
      withdrawals,
      withdrawalReasons: withdrawalReasons.map(r => ({ reason: r.reason, count: r._count.reason })),
      bySchool: bySchool.map(s => ({ school: s.school || 'Sin especificar', count: s._count.school })),
      howFoundUs: howFoundUs.map(h => ({ source: h.howFoundUs || 'otro', count: h._count.howFoundUs })),
      incomeByMonth: incomeByMonth.map(i => ({ month: i.month, year: i.year, total: i._sum.amount || 0 })),
      groupStats: groups.map(g => ({
        name: g.name,
        enrolled: g.studentGroups.length,
        maxCapacity: g.maxCapacity,
        available: g.maxCapacity - g.studentGroups.length,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
