import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
  if (!ok) return cb(new Error('Only image files are allowed'));
  return cb(null, true);
},
});

// POST /api/uploads (admin only, applied in index.ts)
router.post('/', upload.array('files', 8), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ status: true, urls });
});

export default router;