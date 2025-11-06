import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';

describe('Complete Voting Flow', () => {
  let questionIds: string[];

  beforeEach(async () => {
    // Fetch existing questions
    const allQuestions = await prisma.question.findMany();
    questionIds = allQuestions.map(q => q.id);
  });

  it('should complete full voting journey', async () => {
    const fingerprint = 'flow-test-fp-1';

    // 1. Load questions
    const questionsResponse = await fetch('http://localhost:3000/api/questions');
    const questions = await questionsResponse.json();
    expect(questions).toHaveLength(3);

    // 2. Check if already voted (should be false)
    const checkResponse = await fetch(`http://localhost:3000/api/votes/check?fp=${fingerprint}`);
    const checkData = await checkResponse.json();
    expect(checkData.hasVoted).toBe(false);

    // 3. Submit votes
    const votes = questions.map((q: any) => ({
      questionId: q.id,
      rating: 7
    }));

    const voteResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });

    expect(voteResponse.status).toBe(200);

    // 4. Verify votes are stored
    const storedVotes = await prisma.vote.findMany({
      where: { fingerprint }
    });
    expect(storedVotes).toHaveLength(3);
    expect(storedVotes.every(v => v.rating === 7)).toBe(true);

    // 5. Check if already voted (should be true now)
    const checkResponse2 = await fetch(`http://localhost:3000/api/votes/check?fp=${fingerprint}`);
    const checkData2 = await checkResponse2.json();
    expect(checkData2.hasVoted).toBe(true);

    // 6. Verify stats reflect the new votes
    const statsResponse = await fetch('http://localhost:3000/api/votes/stats');
    const stats = await statsResponse.json();
    expect(stats.every((s: any) => s.totalVotes === 1)).toBe(true);
    expect(stats.every((s: any) => s.average === 7.0)).toBe(true);
  });

  it('should prevent duplicate submissions in same flow', async () => {
    const fingerprint = 'flow-test-fp-2';
    const votes = questionIds.map(id => ({
      questionId: id,
      rating: 5
    }));

    // First submission
    const firstResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });
    expect(firstResponse.status).toBe(200);

    // Second submission (should fail)
    const secondResponse = await fetch('http://localhost:3000/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes, fingerprint })
    });
    expect(secondResponse.status).toBe(403);

    // Verify only 3 votes stored (from first submission)
    const storedVotes = await prisma.vote.count({ where: { fingerprint } });
    expect(storedVotes).toBe(3);
  });

  it('should handle multiple users voting simultaneously', async () => {
    const users = ['user1', 'user2', 'user3'];
    
    // Simulate multiple users voting
    const promises = users.map(async (fp, index) => {
      const votes = questionIds.map(id => ({
        questionId: id,
        rating: 5 + index
      }));

      return fetch('http://localhost:3000/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes, fingerprint: fp })
      });
    });

    const responses = await Promise.all(promises);
    
    // All should succeed
    expect(responses.every(r => r.status === 200)).toBe(true);

    // Verify all votes stored
    const totalVotes = await prisma.vote.count();
    expect(totalVotes).toBe(9); // 3 users * 3 questions

    // Verify stats
    const statsResponse = await fetch('http://localhost:3000/api/votes/stats');
    const stats = await statsResponse.json();
    expect(stats.every((s: any) => s.totalVotes === 3)).toBe(true);
  });
});

