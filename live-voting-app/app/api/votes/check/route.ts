import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.nextUrl.searchParams.get('fp');
    
    if (!fingerprint) {
      return NextResponse.json({ hasVoted: false });
    }
    
    const session = await prisma.voteSession.findUnique({
      where: { fingerprint }
    });
    
    return NextResponse.json({ hasVoted: !!session });
  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ hasVoted: false });
  }
}

