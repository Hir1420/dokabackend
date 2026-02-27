import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import heroRoutes from './routes/hero.js';
import uploadsRoutes from './routes/uploads.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));

app.use(express.json());

// ✅ Serve uploaded files publicly
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);

// ✅ Uploads: admin only
app.use('/api/uploads', (req, res, next) => {
  return authMiddleware(req as express.Request & { user?: any }, res, () =>
    adminMiddleware(req as express.Request & { user?: any }, res, next)
  );
}, uploadsRoutes);

// Categories: GET public; POST, PUT, DELETE require admin
app.use('/api/categories', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return authMiddleware(req as express.Request & { user?: any }, res, () =>
      adminMiddleware(req as express.Request & { user?: any }, res, next)
    );
  }
  next();
}, categoriesRoutes);

// Products: GET public; POST, PUT, DELETE require admin
app.use('/api/products', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return authMiddleware(req as express.Request & { user?: any }, res, () =>
      adminMiddleware(req as express.Request & { user?: any }, res, next)
    );
  }
  next();
}, productsRoutes);

// Orders: POST create (guest or auth); GET/PATCH require auth (handled inside router)
app.use('/api/orders', ordersRoutes);

// Hero: GET public; PUT replace slides (admin)
app.use('/api/hero', heroRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running at http://localhost:${PORT}`);
});