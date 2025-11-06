import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Basic Auth mit Secret
    const secret = request.headers.get('x-admin-secret');
    
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await prisma.$transaction([
      prisma.vote.deleteMany({}),
      prisma.voteSession.deleteMany({})
    ]);
    
    return NextResponse.json({ success: true, message: 'All votes reset' });
  } catch (error) {
    console.error('Error resetting votes:', error);
    return NextResponse.json(
      { error: 'Failed to reset votes' },
      { status: 500 }
    );
  }
}

