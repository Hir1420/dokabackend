import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function parseJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// GET all categories (public)
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(
    categories.map((c) => ({
      id: c.slug,
      name: c.name,
      image: c.image,
      productCount: c._count.products,
    }))
  );
});

// GET one category by slug (public)
router.get('/:slug', async (req, res) => {
  const cat = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: true } } },
  });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  res.json({
    id: cat.slug,
    name: cat.name,
    image: cat.image,
    productCount: cat._count.products,
  });
});

// POST create category (admin only - middleware applied in index)
router.post('/', async (req, res) => {
  const { slug, name, image } = req.body;
  if (!slug || !name || !image) {
    return res.status(400).json({ error: 'slug, name and image required' });
  }
  const category = await prisma.category.create({
    data: { slug: String(slug).toLowerCase().replace(/\s+/g, '-'), name, image },
  });
  res.status(201).json({
    id: category.slug,
    name: category.name,
    image: category.image,
    productCount: 0,
  });
});

// PUT update category (admin)
router.put('/:slug', async (req, res) => {
  const { name, image } = req.body;
  const category = await prisma.category.update({
    where: { slug: req.params.slug },
    data: { ...(name != null && { name }), ...(image != null && { image }) },
    include: { _count: { select: { products: true } } },
  });
  res.json({
    id: category.slug,
    name: category.name,
    image: category.image,
    productCount: category._count.products,
  });
});

// DELETE category (admin)
router.delete('/:slug', async (req, res) => {
  await prisma.category.delete({ where: { slug: req.params.slug } });
  res.status(204).send();
});

export default router;
