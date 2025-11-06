import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        votes: true
      },
      orderBy: { order: 'asc' }
    });
    
    const stats = questions.map(q => {
      // Berechne Durchschnitt
      const average = q.votes.length > 0
        ? q.votes.reduce((sum, v) => sum + v.rating, 0) / q.votes.length
        : 0;
      
      // Erstelle Distribution (Bins für 0-10)
      const distribution = Array.from({ length: 11 }, (_, i) => ({
        value: i,
        count: q.votes.filter(v => Math.round(v.rating) === i).length
      }));
      
      return {
        questionId: q.id,
        questionText: q.text,
        totalVotes: q.votes.length,
        average: Math.round(average * 10) / 10, // 1 Dezimalstelle
        distribution
      };
    });
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

