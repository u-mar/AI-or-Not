import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { Session } from './auth';

const SESSION_COOKIE = 'ai_or_not_session';
const SECRET = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ai-or-not-dev-secret';

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function serializeSession(session: Session) {
  const payload = encodeBase64Url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function parseSessionCookie(raw: string | undefined | null): Session | null {
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const source = Buffer.from(signature);
  const target = Buffer.from(expected);
  if (source.length !== target.length || !timingSafeEqual(source, target)) {
    return null;
  }

  try {
    const session = JSON.parse(decodeBase64Url(payload)) as Session;
    if (!session.userId || !session.expiresAt) return null;
    if (new Date(session.expiresAt) < new Date()) return null;
    return session;
  } catch {
    return null;
  }
}

export function getRequestSession(req: NextRequest): Session | null {
  return parseSessionCookie(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function clearServerSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}

export async function setServerSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, serializeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(session.expiresAt),
  });
}
