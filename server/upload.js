import path from 'path';
import multer from 'multer';
import { customAlphabet } from 'nanoid';
import config from './config.js';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = (file.fieldname || 'file').replace(/[^a-z0-9]/gi, '');
    cb(null, `${base}-${Date.now()}-${nanoid()}${ext}`);
  },
});

// Intentionally permissive: the platform must never block valid PDF / HTML /
// audio uploads. We only sanity-check by field, with a generous size limit.
export const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes },
});
