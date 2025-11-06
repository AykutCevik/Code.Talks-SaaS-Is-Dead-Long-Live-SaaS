import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  let lastVoteCount = 0;
  
  const stream = new ReadableStream({
    async start(controller) {
      // Initial data senden
      const stats = await getStats();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
      lastVoteCount = await getTotalVoteCount();
      
      // Polling alle 1 Sekunde
      const interval = setInterval(async () => {
        try {
          const currentVoteCount = await getTotalVoteCount();
          
          // Nur Update senden wenn neue Votes
          if (currentVoteCount > lastVoteCount) {
            const stats = await getStats();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
            lastVoteCount = currentVoteCount;
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 1000);
      
      // Cleanup bei Connection-Close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function getStats() {
  const questions = await prisma.question.findMany({
    include: { votes: true },
    orderBy: { order: 'asc' }
  });
  
  return questions.map(q => {
    const average = q.votes.length > 0
      ? q.votes.reduce((sum, v) => sum + v.rating, 0) / q.votes.length
      : 0;
    
    const distribution = Array.from({ length: 11 }, (_, i) => ({
      value: i,
      count: q.votes.filter(v => Math.round(v.rating) === i).length
    }));
    
    return {
      questionId: q.id,
      questionText: q.text,
      totalVotes: q.votes.length,
      average: Math.round(average * 10) / 10,
      distribution
    };
  });
}

async function getTotalVoteCount() {
  return await prisma.vote.count();
}

