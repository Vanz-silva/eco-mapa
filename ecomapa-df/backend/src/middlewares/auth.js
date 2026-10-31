import jwt from 'jsonwebtoken';
import { env, isAllowedOrigin } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from './errors.js';

export const COOKIE = 'eco_admin';

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
  path: '/api'
});

export const signSession = (user) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: `${env.JWT_EXPIRES_HOURS}h`, algorithm: 'HS256' });

// A sessão é revalidada no banco a cada requisição: desativar um usuário vale na hora.
export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new HttpError(401, 'Não autenticado.');
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      throw new HttpError(401, 'Sessão expirada. Entre novamente.');
    }
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) throw new HttpError(401, 'Não autenticado.');
    req.admin = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (e) { next(e); }
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.admin.role) ? next() : next(new HttpError(403, 'Você não tem permissão para esta ação.'));

// Proteção extra contra CSRF: requisições que alteram dados só valem vindas de origens autorizadas.
export function originGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !isAllowedOrigin(origin)) return next(new HttpError(403, 'Origem não permitida.'));
  next();
}
