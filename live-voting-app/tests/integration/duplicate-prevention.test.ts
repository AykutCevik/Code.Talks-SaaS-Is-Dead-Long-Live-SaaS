import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

describe('Duplicate Vote Prevention', () => {
  let questionIds: string[];

  beforeEach(async () => {
    // Fetch existing questions
    const allQuestions = await prisma.question.findMany();
    questionIds = allQuestions.map(q => q.id);
  });

  it('should block duplicate votes using fingerprint', async () => {
    const fingerprint = 'duplicate-test-fp';
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 7
    }));

    // First vote should succeed
    const firstResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    expect(firstResponse.status).toBe(200);

    // Second vote with same fingerprint should fail
    const secondResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    expect(secondResponse.status).toBe(403);
    const errorData = await secondResponse.json();
    expect(errorData.error).toContain('bereits abgestimmt');

    // Verify only one session created
    const sessions = await prisma.voteSession.count({ where: { fingerprint } });
    expect(sessions).toBe(1);

    // Verify only 3 votes (from first submission)
    const voteCount = await prisma.vote.count({ where: { fingerprint } });
    expect(voteCount).toBe(3);
  });

  it('should allow different fingerprints to vote', async () => {
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 7
    }));

    // User 1 votes
    const response1 = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint: 'fp-user-1' })
    });

    // User 2 votes
    const response2 = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint: 'fp-user-2' })
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Verify 2 sessions
    const sessions = await prisma.voteSession.count();
    expect(sessions).toBe(2);

    // Verify 6 votes total
    const totalVotes = await prisma.vote.count();
    expect(totalVotes).toBe(6);
  });

  it('should enforce IP-based rate limiting', async () => {
    // Ensure clean state
    await prisma.vote.deleteMany({});
    await prisma.voteSession.deleteMany({});
    
    const testIp = '192.168.1.100';
    const ipHash = crypto.createHash('sha256')
      .update(testIp + (process.env.IP_SALT || ''))
      .digest('hex');

    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 5
    }));

    // Create 3 existing sessions with same IP hash
    await prisma.voteSession.createMany({
      data: [
        { fingerprint: 'ip-fp-1', ipHash },
        { fingerprint: 'ip-fp-2', ipHash },
        { fingerprint: 'ip-fp-3', ipHash },
      ]
    });

    // 4th attempt from same IP should fail
    const response = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ votes, fingerprint: 'ip-fp-4' })
    });

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('Rate-Limit');
  });

  it('should allow up to 3 votes from same IP with different fingerprints', async () => {
    const testIp = '192.168.1.200';
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 5
    }));

    // 3 votes from same IP
    const responses = await Promise.all([
      fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp
        },
        body: JSON.stringify({ votes, fingerprint: 'same-ip-fp-1' })
      }),
      fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp
        },
        body: JSON.stringify({ votes, fingerprint: 'same-ip-fp-2' })
      }),
      fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp
        },
        body: JSON.stringify({ votes, fingerprint: 'same-ip-fp-3' })
      })
    ]);

    // All 3 should succeed
    expect(responses.every(r => r.status === 200)).toBe(true);

    // 4th should fail
    const fourthResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp
      },
      body: JSON.stringify({ votes, fingerprint: 'same-ip-fp-4' })
    });

    expect(fourthResponse.status).toBe(429);
  });

  it('should check vote status correctly via check endpoint', async () => {
    const fingerprint = 'check-test-fp';

    // Initially should return false
    const checkBefore = await fetch(`http://localhost:3000/api/votes/check?fp=${fingerprint}`);
    const dataBefore = await checkBefore.json();
    expect(dataBefore.hasVoted).toBe(false);

    // Vote
    const votes = questionIds.map(id => ({ questionId: id, rating: 5 }));
    await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    // After voting should return true
    const checkAfter = await fetch(`http://localhost:3000/api/votes/check?fp=${fingerprint}`);
    const dataAfter = await checkAfter.json();
    expect(dataAfter.hasVoted).toBe(true);
  });
});

