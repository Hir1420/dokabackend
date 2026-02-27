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

function productToResponse(p: {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: { slug: string };
  brand: string;
  images: string;
  stock: number;
  rating: number;
  reviewCount: number;
  features: string | null;
  specs: string | null;
  trending: boolean;
  featured: boolean;
}) {
  const images = parseJson<string[]>(p.images) || [];
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    category: p.category.slug,
    brand: p.brand,
    images,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    features: parseJson<string[]>(p.features) ?? undefined,
    specs: parseJson<Record<string, string>>(p.specs) ?? undefined,
    trending: p.trending,
    featured: p.featured,
  };
}

// GET all products (optional ?categoryId=slug & search= & trending=1 & featured=1)
router.get('/', async (req, res) => {
  const categorySlug = req.query.categoryId as string | undefined;
  const search = (req.query.search as string)?.trim();
  const trending = req.query.trending === '1';
  const featured = req.query.featured === '1';

  let categoryId: string | undefined;
  if (categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!cat) return res.status(400).json({ error: 'Invalid category' });
    categoryId = cat.id;
  }

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(trending && { trending: true }),
      ...(featured && { featured: true }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { brand: { contains: search } },
        ],
      }),
    },
    include: { category: { select: { slug: true } } },
  });
  res.json(products.map(productToResponse));
});

// GET single product by id
router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { slug: true } } },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(productToResponse(product));
});

// POST create product (admin)
router.post('/', async (req, res) => {
  const body = req.body;
  const category = await prisma.category.findFirst({
    where: { slug: (body.category || body.categoryId || '').toString().toLowerCase() },
  });
  if (!category) return res.status(400).json({ error: 'Valid category required' });

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price) || 0,
      originalPrice: body.originalPrice != null ? parseFloat(body.originalPrice) : null,
      categoryId: category.id,
      brand: body.brand || '',
      images: JSON.stringify(Array.isArray(body.images) ? body.images : (body.images || '').split(',').map((s: string) => s.trim()).filter(Boolean)),
      stock: parseInt(body.stock, 10) || 0,
      rating: parseFloat(body.rating) || 0,
      reviewCount: parseInt(body.reviewCount, 10) || 0,
      features: body.features ? JSON.stringify(body.features) : null,
      specs: body.specs ? JSON.stringify(body.specs) : null,
      trending: Boolean(body.trending),
      featured: Boolean(body.featured),
    },
    include: { category: { select: { slug: true } } },
  });
  res.status(201).json(productToResponse(product));
});

// PUT update product (admin)
router.put('/:id', async (req, res) => {
  const body = req.body;
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  let categoryId = existing.categoryId;
  if (body.category || body.categoryId) {
    const slug = (body.category || body.categoryId).toString().toLowerCase();
    const cat = await prisma.category.findFirst({ where: { slug } });
    if (cat) categoryId = cat.id;
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.description != null && { description: body.description }),
      ...(body.price != null && { price: parseFloat(body.price) }),
      ...(body.originalPrice != null && { originalPrice: body.originalPrice === '' ? null : parseFloat(body.originalPrice) }),
      ...(categoryId && { categoryId }),
      ...(body.brand != null && { brand: body.brand }),
      ...(body.images != null && {
        images: JSON.stringify(
          Array.isArray(body.images)
            ? body.images
            : String(body.images)
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
        ),
      }),
      ...(body.stock != null && { stock: parseInt(body.stock, 10) }),
      ...(body.rating != null && { rating: parseFloat(body.rating) }),
      ...(body.reviewCount != null && { reviewCount: parseInt(body.reviewCount, 10) }),
      ...(body.features != null && { features: body.features ? JSON.stringify(body.features) : null }),
      ...(body.specs != null && { specs: body.specs ? JSON.stringify(body.specs) : null }),
      ...(body.trending != null && { trending: Boolean(body.trending) }),
      ...(body.featured != null && { featured: Boolean(body.featured) }),
    },
    include: { category: { select: { slug: true } } },
  });
  res.json(productToResponse(product));
});

// DELETE product (admin)
router.delete('/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
