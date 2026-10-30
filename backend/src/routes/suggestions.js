import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middlewares/validate.js';
import { HttpError } from '../middlewares/errors.js';
import { sanitize, onlyDigits } from '../utils/text.js';

const router = Router();

// Sugestões públicas: limite bem mais baixo que o da API em geral.
const limiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas sugestões enviadas. Tente novamente mais tarde.' }
});

const clean = (max, min = 1) => z.string().max(max).transform(sanitize).pipe(z.string().min(min));

const body = z.object({
  name: clean(150, 3),
  address: clean(250, 5),
  region: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(), // slug da região
  materials: z.array(z.enum(['pilhas', 'baterias', 'oleo-vegetal'])).min(1).max(3),
  phone: z.string().max(30).transform(onlyDigits).optional(),
  notes: clean(1000, 0).optional()
});

// Sempre entra como PENDING: nada é publicado sem aprovação administrativa.
router.post('/', limiter, validate(body, 'body'), async (req, res, next) => {
  try {
    const { region, ...rest } = req.valid.body;
    let regionId = null;
    if (region) {
      const r = await prisma.region.findUnique({ where: { slug: region } });
      if (!r) throw new HttpError(400, 'Região administrativa inválida.');
      regionId = r.id;
    }
    const created = await prisma.userSuggestion.create({
      data: {
        name: rest.name,
        address: rest.address,
        regionId,
        materialSlugs: rest.materials,
        phone: rest.phone || null,
        notes: rest.notes || null
      },
      select: { id: true, status: true }
    });
    res.status(201).json({ data: created, message: 'Sugestão recebida e aguardando análise.' });
  } catch (e) { next(e); }
});

export default router;
