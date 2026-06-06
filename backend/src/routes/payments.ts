import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// Helper: genera el siguiente número de factura
async function getNextInvoiceNumber(): Promise<string> {
  const settings = await prisma.settings.findFirst();
  const prefix  = settings?.invoicePrefix || 'FAC';
  const counter = settings?.invoiceCounter || 1;
  await prisma.settings.updateMany({ data: { invoiceCounter: counter + 1 } });
  return `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;
}

// Helper: crea o actualiza factura automática para un pago
async function createAutoInvoice(paymentId: number) {
  const existing = await prisma.invoice.findFirst({
    where: { paymentId, status: { not: 'anulada' } },
  });
  // Si ya existe y está emitida, actualizarla a pagada
  if (existing) {
    if (existing.status === 'emitida') {
      await prisma.invoice.update({ where: { id: existing.id }, data: { status: 'pagada' } });
    }
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: {
        include: { guardians: { where: { isPrimary: true } } },
      },
    },
  });
  if (!payment) return;

  const guardian = payment.student.guardians[0];
  const invoiceNumber = await getNextInvoiceNumber();

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      studentId:   payment.studentId,
      paymentId:   payment.id,
      billedMonth: payment.month,
      billedYear:  payment.year,
      amount:      payment.amount,
      concept:     'Cuota mensual Escuela de Dibujo',
      guardianName: guardian?.fullName || '',
      guardianDni:  guardian?.dni || '',
      status:      'pagada',
      issueDate:   new Date(),
    },
  });
}

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

      // Actualizar factura si existe, o crear una nueva
      const invoiceExists = await prisma.invoice.findFirst({ where: { paymentId: existing.id, status: { not: 'anulada' } } });
      if (invoiceExists) {
        await prisma.invoice.updateMany({ where: { paymentId: existing.id }, data: { status: 'pagada' } });
      } else {
        await createAutoInvoice(existing.id);
      }

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

    // Crear factura automáticamente
    await createAutoInvoice(payment.id);

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

    // Si se marca como pagado, actualizar factura existente o crear nueva
    if (status === 'pagado') {
      await prisma.invoice.updateMany({
        where: { paymentId: updated.id, status: 'emitida' },
        data: { status: 'pagada' },
      });
      await createAutoInvoice(updated.id);
    }

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
