import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Create order (from checkout) - optional auth
router.post('/', async (req, res) => {
  const body = req.body;
  const items = body.items as Array<{ productId: string; quantity: number; price: number }>;
  const shipping = body.shippingAddress as {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  if (!items?.length || !shipping?.fullName || !shipping.email || !shipping.address) {
    return res.status(400).json({ error: 'Items and shipping address required' });
  }

  const user = (req as unknown as { user?: AuthPayload }).user;
  let total = 0;
  const orderItems: { productId: string; quantity: number; price: number }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
    const qty = Math.max(1, parseInt(String(item.quantity), 10));
    const price = product.price;
    total += price * qty;
    orderItems.push({ productId: product.id, quantity: qty, price });
  }

  const order = await prisma.order.create({
    data: {
      userId: user?.userId || null,
      status: 'pending',
      total,
      fullName: shipping.fullName,
      email: shipping.email,
      address: shipping.address,
      city: shipping.city || '',
      state: shipping.state || '',
      zipCode: shipping.zipCode || '',
      country: shipping.country || '',
      items: {
        create: orderItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });
  res.status(201).json(order);
});

// List my orders (authenticated)
router.get('/my', authMiddleware, async (req, res) => {
  const user = (req as unknown as { user: AuthPayload }).user;
  const orders = await prisma.order.findMany({
    where: { userId: user.userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// List all orders (admin)
router.get('/', authMiddleware, async (req, res) => {
  const user = (req as unknown as { user: AuthPayload }).user;
  if (!user.isAdmin) return res.status(403).json({ error: 'Admin required' });
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: { select: { email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// Get one order (admin or owner)
router.get('/:id', authMiddleware, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } }, user: { select: { email: true, name: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const user = (req as unknown as { user: AuthPayload }).user;
  if (!user.isAdmin && order.userId !== user.userId) return res.status(403).json({ error: 'Forbidden' });
  res.json(order);
});

// Update order status (admin)
router.patch('/:id', authMiddleware, async (req, res) => {
  const user = (req as unknown as { user: AuthPayload }).user;
  if (!user.isAdmin) return res.status(403).json({ error: 'Admin required' });
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered'];
  if (!status || !valid.includes(status)) return res.status(400).json({ error: 'Valid status required' });
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: { include: { product: true } } },
  });
  res.json(order);
});

export default router;
