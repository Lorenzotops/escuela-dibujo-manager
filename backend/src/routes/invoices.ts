import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

async function getNextInvoiceNumber(): Promise<string> {
  const settings = await prisma.settings.findFirst();
  const prefix  = settings?.invoicePrefix || 'FAC';
  const counter = settings?.invoiceCounter || 1;
  const number  = String(counter).padStart(4, '0');
  await prisma.settings.updateMany({ data: { invoiceCounter: counter + 1 } });
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${number}`;
}

// GET /api/invoices
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, status, month, year } = req.query;
    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    if (status)    where.status    = status;
    if (month)     where.billedMonth = Number(month);
    if (year)      where.billedYear  = Number(year);

    const invoices = await prisma.invoice.findMany({
      where,
      include: { student: { select: { id: true, fullName: true } } },
      orderBy: { issueDate: 'desc' },
    });
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        student: {
          include: {
            guardians: { where: { isPrimary: true } },
          },
        },
        payment: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });

    const settings = await prisma.settings.findFirst();
    res.json({ invoice, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices — Generar factura individual
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentId, paymentId, billedMonth, billedYear,
      amount, concept, notes, guardianName, guardianDni,
    } = req.body;

    const invoiceNumber = await getNextInvoiceNumber();
    const settings = await prisma.settings.findFirst();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: Number(studentId),
        paymentId: paymentId ? Number(paymentId) : null,
        billedMonth: Number(billedMonth),
        billedYear: Number(billedYear),
        amount: Number(amount) || settings?.monthlyFee || 55,
        concept: concept || 'Cuota mensual Escuela de Dibujo',
        notes: notes || '',
        guardianName: guardianName || '',
        guardianDni: guardianDni || '',
        status: paymentId ? 'pagada' : 'emitida',
      },
    });

    // Si está vinculada a un pago, vincular
    if (paymentId) {
      await prisma.payment.update({
        where: { id: Number(paymentId) },
        data: { status: 'pagado', paidAt: new Date() },
      });
    }

    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/invoices/batch — Generar facturas en lote
router.post('/batch', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;

    const activeStudents = await prisma.student.findMany({
      where: { status: 'activo' },
      include: {
        guardians: { where: { isPrimary: true } },
        payments: { where: { month: Number(month), year: Number(year) } },
      },
    });

    const settings = await prisma.settings.findFirst();
    const created: any[] = [];

    for (const student of activeStudents) {
      // No duplicar si ya existe factura para este mes/año
      const existing = await prisma.invoice.findFirst({
        where: { studentId: student.id, billedMonth: Number(month), billedYear: Number(year), status: { not: 'anulada' } },
      });
      if (existing) continue;

      const payment = student.payments[0];
      const invoiceNumber = await getNextInvoiceNumber();
      const guardian = student.guardians[0];

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          paymentId: payment?.id || null,
          billedMonth: Number(month),
          billedYear: Number(year),
          amount: payment?.amount || settings?.monthlyFee || 55,
          concept: 'Cuota mensual Escuela de Dibujo',
          guardianName: guardian?.fullName || '',
          guardianDni: guardian?.dni || '',
          status: payment?.status === 'pagado' ? 'pagada' : 'emitida',
        },
      });
      created.push(invoice);
    }

    res.json({ message: `${created.length} facturas generadas`, invoices: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id/cancel — Anular factura
router.put('/:id/cancel', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const updated = await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: { status: 'anulada', notes: notes || 'Factura anulada' },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/invoices/:id/reissue — Reemitir factura
router.put('/:id/reissue', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const original = await prisma.invoice.findUnique({ where: { id: Number(req.params.id) } });
    if (!original) return res.status(404).json({ error: 'Factura no encontrada' });

    // Anular la original
    await prisma.invoice.update({
      where: { id: original.id },
      data: { status: 'anulada', notes: 'Anulada por reemisión' },
    });

    // Crear nueva con número nuevo (sin spread de objeto Prisma)
    const invoiceNumber = await getNextInvoiceNumber();
    const reissued = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId:    original.studentId,
        paymentId:    original.paymentId,
        concept:      original.concept,
        billedMonth:  original.billedMonth,
        billedYear:   original.billedYear,
        amount:       original.amount,
        guardianName: original.guardianName,
        guardianDni:  original.guardianDni,
        status:       'emitida',
        issueDate:    new Date(),
        notes:        `Reemisión de ${original.invoiceNumber}`,
      },
    });

    res.json(reissued);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
