import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── POST /api/messages ── Padre envía mensaje ────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'padre') {
      return res.status(403).json({ error: 'Solo los tutores pueden enviar mensajes' });
    }
    const { subject, body, studentId } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: 'Asunto y mensaje son obligatorios' });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: req.user!.id,
        studentId: studentId || null,
        subject,
        body,
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        student:  { select: { id: true, fullName: true } },
        replies:  { include: { fromUser: { select: { id: true, name: true, role: true } } } },
      },
    });
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages ── Admin/profesor: todos los mensajes ──────────────────
//                          Padre: solo sus mensajes
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role, id } = req.user!;
    const isPadre = role === 'padre';

    const messages = await prisma.message.findMany({
      where: isPadre ? { fromUserId: id } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        student:  { select: { id: true, fullName: true } },
        replies:  {
          orderBy: { createdAt: 'asc' },
          include: { fromUser: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/unread-count ── Número de mensajes no leídos ───────────
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.user!;
    if (role === 'padre') return res.json({ count: 0 });

    const count = await prisma.message.count({ where: { read: false } });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/messages/:id ── Detalle de un mensaje ──────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { role, id: userId } = req.user!;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        student:  { select: { id: true, fullName: true } },
        replies:  {
          orderBy: { createdAt: 'asc' },
          include: { fromUser: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' });
    if (role === 'padre' && message.fromUserId !== userId) {
      return res.status(403).json({ error: 'Sin acceso' });
    }

    // Marcar como leído si es admin/profesor
    if (role !== 'padre' && !message.read) {
      await prisma.message.update({ where: { id }, data: { read: true } });
    }

    res.json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/messages/:id/reply ── Admin/profesor responde ─────────────────
router.post('/:id/reply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role, id: userId } = req.user!;
    if (role === 'padre') {
      return res.status(403).json({ error: 'Solo admin o profesores pueden responder' });
    }

    const messageId = parseInt(req.params.id);
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'La respuesta no puede estar vacía' });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const reply = await prisma.messageReply.create({
      data: { messageId, fromUserId: userId, body },
      include: { fromUser: { select: { id: true, name: true, role: true } } },
    });

    // Marcar el mensaje como leído al responder
    await prisma.message.update({ where: { id: messageId }, data: { read: true } });

    res.status(201).json(reply);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/messages/:id/read ── Marcar como leído ───────────────────────
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'padre') return res.status(403).json({ error: 'Sin acceso' });
    const id = parseInt(req.params.id);
    await prisma.message.update({ where: { id }, data: { read: true } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
