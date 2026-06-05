import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router  = Router();
const prisma  = new PrismaClient();

// Configurar multer para subir logo
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `logo${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

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

// POST /api/settings/logo — Subir logo
router.post('/logo', requireAdmin, upload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const logoUrl = `/uploads/${req.file.filename}`;
    const settings = await prisma.settings.findFirst();

    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data: { logoUrl } });
    }

    res.json({ logoUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
