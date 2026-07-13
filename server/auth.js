import jwt from 'jsonwebtoken';
import config from './config.js';
import { one } from './db-selector.js';

export function signToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

export function requireAdmin(req, res, next) {
  const decoded = verifyToken(extractToken(req));
  if (!decoded || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  req.admin = decoded;
  next();
}

export async function requireCandidate(req, res, next) {
  try {
    const decoded = verifyToken(extractToken(req));
    if (!decoded || decoded.role !== 'candidate') {
      return res.status(401).json({ error: 'Candidate authentication required.' });
    }
    const candidate = await one(
      'SELECT id, full_name, code, banned FROM candidates WHERE id = $1',
      [decoded.id]
    );
    if (!candidate) return res.status(401).json({ error: 'Candidate not found.' });
    if (candidate.banned) return res.status(403).json({ error: 'This candidate has been banned.' });
    req.candidate = candidate;
    next();
  } catch (err) {
    next(err);
  }
}



/** Generate a guaranteed-unique 14-digit candidate code. */
export async function generateCandidateCode() {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 14; i++) code += Math.floor(Math.random() * 10).toString();
    if (code[0] === '0') code = '1' + code.slice(1);
    const exists = await one('SELECT 1 FROM candidates WHERE code = $1', [code]);
    if (!exists) return code;
  }
  throw new Error('Failed to generate a unique candidate code.');
}
