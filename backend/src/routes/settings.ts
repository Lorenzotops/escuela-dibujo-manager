import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router  = Router();
const prisma  = new PrismaClient();

router.use(authenticate);

// GET /api/settings
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { schoolName, address, phone, email, cifNif, monthlyFee, invoicePrefix, invoiceFooter } = req.body;
    const settings = await prisma.settings.findFirst();

    const updated = settings
      ? await prisma.settings.update({
          where: { id: settings.id },
          data: { schoolName, address, phone, email, cifNif, monthlyFee: Number(monthlyFee), invoicePrefix, invoiceFooter },
        })
      : await prisma.settings.create({
          data: { schoolName, address, phone, email, cifNif, monthlyFee: Number(monthlyFee), invoicePrefix, invoiceFooter },
        });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/logo — Guardar logo como base64 en la BD (no filesystem)
router.post('/logo', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { logoBase64 } = req.body;
    if (!logoBase64) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    // Validar que es una imagen base64 válida
    if (!logoBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Formato de imagen no válido' });
    }

    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data: { logoUrl: logoBase64 } });
    } else {
      await prisma.settings.create({ data: { logoUrl: logoBase64 } });
    }

    res.json({ logoUrl: logoBase64 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
