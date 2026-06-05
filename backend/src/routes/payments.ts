import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/payments
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, status, groupId } = req.query;

    const where: any = {};
    if (month) where.month = Number(month);
    if (year)  where.year  = Number(year);
    if (status) where.status = status;
    if (groupId) {
      where.student = { currentGroupId: Number(groupId) };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, currentGroupId: true,
            guardians: { where: { isPrimary: true }, select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { student: { fullName: 'asc' } }],
    });

    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/pending — Resumen de deudas
router.get('/pending', async (_req: AuthRequest, res: Response) => {
  try {
    const debtors = await prisma.student.findMany({
      where: {
        status: 'activo',
        payments: { some: { status: { in: ['pendiente', 'atrasado'] } } },
      },
      include: {
        guardians: { where: { isPrimary: true } },
        payments: {
          where: { status: { in: ['pendiente', 'atrasado'] } },
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(debtors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/student/:studentId
router.get('/student/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { studentId: Number(req.params.studentId) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Detectar cuotas atrasadas
    const overdue = payments.filter(p => p.status === 'atrasado' || p.status === 'pendiente');

    res.json({ payments, overdue });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments — Registrar pago
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, month, year, amount, method, notes } = req.body;

    // Verificar si ya existe
    const existing = await prisma.payment.findFirst({
      where: { studentId: Number(studentId), month: Number(month), year: Number(year) },
    });
    if (existing) {
      if (existing.status === 'pagado') {
        return res.status(409).json({ error: `Ya se registró el pago de este mes para este alumno` });
      }
      // Actualizar el existente
      const updated = await prisma.payment.update({
        where: { id: existing.id },
        data: {
          amount: Number(amount),
          paidAt: new Date(),
          method: method || 'efectivo',
          status: 'pagado',
          notes: notes || '',
        },
      });

      // Actualizar factura si existe
      await prisma.invoice.updateMany({
        where: { paymentId: existing.id },
        data: { status: 'pagada' },
      });

      return res.json(updated);
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        paidAt: new Date(),
        method: method || 'efectivo',
        status: 'pagado',
        notes: notes || '',
      },
    });

    res.status(201).json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, status, paidAt, notes, method } = req.body;
    const updated = await prisma.payment.update({
      where: { id: Number(req.params.id) },
      data: {
        amount: amount !== undefined ? Number(amount) : undefined,
        status,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        notes,
        method,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/generate-monthly — Generar cuotas pendientes del mes para todos los activos
router.post('/generate-monthly', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, amount } = req.body;

    const activeStudents = await prisma.student.findMany({
      where: { status: 'activo' },
      select: { id: true },
    });

    const settings = await prisma.settings.findFirst();
    const fee = amount || settings?.monthlyFee || 55;

    let created = 0;
    for (const s of activeStudents) {
      const existing = await prisma.payment.findFirst({
        where: { studentId: s.id, month: Number(month), year: Number(year) },
      });
      if (!existing) {
        await prisma.payment.create({
          data: {
            studentId: s.id,
            month: Number(month),
            year: Number(year),
            amount: Number(fee),
            status: 'pendiente',
          },
        });
        created++;
      }
    }

    res.json({ message: `${created} cuotas generadas para ${month}/${year}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
