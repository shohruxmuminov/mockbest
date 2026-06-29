import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import config from './config.js';
import db from './db.js';

const googleClient = config.googleClientId
  ? new OAuth2Client(config.googleClientId)
  : null;

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

export function requireCandidate(req, res, next) {
  const decoded = verifyToken(extractToken(req));
  if (!decoded || decoded.role !== 'candidate') {
    return res.status(401).json({ error: 'Candidate authentication required.' });
  }
  // Re-check the candidate still exists and is not banned on every request.
  const candidate = db
    .prepare('SELECT id, full_name, code, banned FROM candidates WHERE id = ?')
    .get(decoded.id);
  if (!candidate) {
    return res.status(401).json({ error: 'Candidate not found.' });
  }
  if (candidate.banned) {
    return res.status(403).json({ error: 'This candidate has been banned.' });
  }
  req.candidate = candidate;
  next();
}

/**
 * Verify a Google Sign-In ID token and ensure it belongs to the single
 * authorized admin account. Returns the verified email or throws.
 */
export async function verifyGoogleAdmin(credential) {
  if (!googleClient) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  const email = (payload?.email || '').toLowerCase();
  if (!payload?.email_verified) {
    throw new Error('Google account email is not verified.');
  }
  if (email !== config.adminEmail) {
    const err = new Error('This Google account is not authorized for admin access.');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return { email, name: payload.name, picture: payload.picture };
}

/**
 * Generate a guaranteed-unique 14-digit candidate code.
 */
export function generateCandidateCode() {
  const exists = db.prepare('SELECT 1 FROM candidates WHERE code = ?');
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 14; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    // Avoid a leading zero so it always reads as a clean 14-digit number.
    if (code[0] === '0') code = '1' + code.slice(1);
    if (!exists.get(code)) return code;
  }
  throw new Error('Failed to generate a unique candidate code.');
}
