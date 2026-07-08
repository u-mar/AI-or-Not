import { NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config';
import { createSession, registerUser } from '@/lib/server-data';
import { setServerSession } from '@/lib/server-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await registerUser(body?.name ?? '', body?.email ?? '', body?.password ?? '');
    const session = createSession(user, APP_CONFIG.sessionDays);
    await setServerSession(session);
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
