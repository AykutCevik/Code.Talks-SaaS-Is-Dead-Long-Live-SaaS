import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

describe('POST /api/votes', () => {
  let questionIds: string[];

  beforeEach(async () => {
    // Fetch existing questions (created in test setup)
    const allQuestions = await prisma.question.findMany();
    questionIds = allQuestions.map(q => q.id);
  });

  it('should successfully submit valid votes', async () => {
    const fingerprint = 'test-fingerprint-1';
    const votes = questionIds.map((id, index) => ({
      questionId: id,
      rating: 5 + index
    }));

    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify votes are stored
    const storedVotes = await prisma.vote.findMany({
      where: { fingerprint }
    });
    expect(storedVotes).toHaveLength(3);
  });

  it('should prevent duplicate votes with same fingerprint', async () => {
    const fingerprint = 'test-fingerprint-2';
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 7
    }));

    // First vote
    await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    // Second vote with same fingerprint
    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('bereits abgestimmt');
  });

  it('should enforce IP rate limiting', async () => {
    // Ensure clean state
    await prisma.vote.deleteMany({});
    await prisma.voteSession.deleteMany({});
    
    const testIp = 'test-ip';
    const ipHash = crypto.createHash('sha256')
      .update(testIp + (process.env.IP_SALT || ''))
      .digest('hex');
    
    // Create 3 vote sessions with same IP
    await prisma.voteSession.createMany({
      data: [
        { fingerprint: 'fp1', ipHash },
        { fingerprint: 'fp2', ipHash },
        { fingerprint: 'fp3', ipHash },
      ]
    });

    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 5
    }));

    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ votes, fingerprint: 'fp4' })
    });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('Rate-Limit');
  });

  it('should reject invalid rating values', async () => {
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 15 // Invalid: > 10
    }));

    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint: 'test-fp' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Rating must be 0-10');
  });

  it('should reject incomplete vote data', async () => {
    const votes = [
      { questionId: questionIds[0], rating: 5 }
      // Missing 2 votes
    ];

    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint: 'test-fp' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid data');
  });

  it('should reject missing fingerprint', async () => {
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 5
    }));

    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes }) // No fingerprint
    });

    expect(response.status).toBe(400);
  });
});

