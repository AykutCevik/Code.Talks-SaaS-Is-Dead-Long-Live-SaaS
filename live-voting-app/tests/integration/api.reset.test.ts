import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';

describe('POST /api/admin/reset', () => {
  let questionIds: string[];

  beforeEach(async () => {
    // Fetch existing questions
    const allQuestions = await prisma.question.findMany();
    questionIds = allQuestions.map(q => q.id);

    // Add some test votes
    await prisma.vote.createMany({
      data: [
        { questionId: questionIds[0], rating: 5, fingerprint: 'fp1', ipHash: 'hash1' },
        { questionId: questionIds[1], rating: 7, fingerprint: 'fp1', ipHash: 'hash1' },
        { questionId: questionIds[2], rating: 9, fingerprint: 'fp1', ipHash: 'hash1' },
      ]
    });

    await prisma.voteSession.create({
      data: { fingerprint: 'fp1', ipHash: 'hash1' }
    });
  });

  it('should reject requests without valid secret', async () => {
    const response = await fetch('http://localhost:3000/api/admin/reset', {
      method: 'POST',
      headers: { 'x-admin-secret': 'wrong-secret' }
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should successfully reset all votes with valid secret', async () => {
    // Verify we have data before reset
    const votesBefore = await prisma.vote.count();
    const sessionsBefore = await prisma.voteSession.count();
    expect(votesBefore).toBeGreaterThan(0);
    expect(sessionsBefore).toBeGreaterThan(0);

    const response = await fetch('http://localhost:3000/api/admin/reset', {
      method: 'POST',
      headers: { 'x-admin-secret': process.env.ADMIN_SECRET || 'demo-secret-change-in-production' }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify data is deleted
    const votesAfter = await prisma.vote.count();
    const sessionsAfter = await prisma.voteSession.count();
    expect(votesAfter).toBe(0);
    expect(sessionsAfter).toBe(0);
  });

  it('should not delete questions on reset', async () => {
    const questionsBefore = await prisma.question.count();
    expect(questionsBefore).toBe(3);

    await fetch('http://localhost:3000/api/admin/reset', {
      method: 'POST',
      headers: { 'x-admin-secret': process.env.ADMIN_SECRET || 'demo-secret-change-in-production' }
    });

    const questionsAfter = await prisma.question.count();
    expect(questionsAfter).toBe(3);
  });
});

