import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET hero slides (public)
router.get('/', async (_req, res) => {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  res.json(
    slides.map((s) => ({
      id: s.id,
      image: s.image,
      title: s.title,
      subtitle: s.subtitle,
      cta: s.cta ?? undefined,
      link: s.link ?? undefined,
    }))
  );
});

// PUT replace all hero slides (admin)
router.put(
  '/',
  (req, res, next) => authMiddleware(req as any, res, () => adminMiddleware(req as any, res, next)),
  async (req, res) => {
    const body = Array.isArray(req.body) ? req.body : req.body.slides;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Expected array of slides' });
    }
    await prisma.heroSlide.deleteMany({});
    const created = await Promise.all(
      body.map((s: { image: string; title: string; subtitle: string; cta?: string; link?: string }, i: number) =>
        prisma.heroSlide.create({
          data: {
            image: s.image || '',
            title: s.title || '',
            subtitle: s.subtitle || '',
            cta: s.cta ?? null,
            link: s.link ?? null,
            sortOrder: i,
          },
        })
      )
    );
    res.json(
      created.map((s) => ({
        id: s.id,
        image: s.image,
        title: s.title,
        subtitle: s.subtitle,
        cta: s.cta ?? undefined,
        link: s.link ?? undefined,
      }))
    );
  }
);

export default router;
