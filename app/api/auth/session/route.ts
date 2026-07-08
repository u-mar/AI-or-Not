import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/server-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getRequestSession(req);
  return NextResponse.json({ session });
}
