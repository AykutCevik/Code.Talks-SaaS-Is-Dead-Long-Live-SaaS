import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';

describe('GET /api/votes/stats', () => {
  let questionIds: string[];

  beforeEach(async () => {
    // Fetch existing questions
    const allQuestions = await prisma.question.findMany();
    questionIds = allQuestions.map(q => q.id);
  });

  it('should return stats with correct structure', async () => {
    const response = await fetch('http://localhost:3000/api/votes/stats');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    
    expect(data[0]).toHaveProperty('questionId');
    expect(data[0]).toHaveProperty('questionText');
    expect(data[0]).toHaveProperty('totalVotes');
    expect(data[0]).toHaveProperty('average');
    expect(data[0]).toHaveProperty('distribution');
    expect(data[0].distribution).toHaveLength(11); // 0-10
  });

  it('should calculate correct average', async () => {
    // Add votes: 5, 7, 9 -> average = 7.0
    await prisma.vote.createMany({
      data: [
        { questionId: questionIds[0], rating: 5, fingerprint: 'fp1', ipHash: 'hash1' },
        { questionId: questionIds[0], rating: 7, fingerprint: 'fp2', ipHash: 'hash2' },
        { questionId: questionIds[0], rating: 9, fingerprint: 'fp3', ipHash: 'hash3' },
      ]
    });

    const response = await fetch('http://localhost:3000/api/votes/stats');
    const data = await response.json();

    expect(data[0].totalVotes).toBe(3);
    expect(data[0].average).toBe(7.0);
  });

  it('should calculate correct distribution', async () => {
    // Add votes: 5, 5, 7
    await prisma.vote.createMany({
      data: [
        { questionId: questionIds[0], rating: 5, fingerprint: 'fp1', ipHash: 'hash1' },
        { questionId: questionIds[0], rating: 5, fingerprint: 'fp2', ipHash: 'hash2' },
        { questionId: questionIds[0], rating: 7, fingerprint: 'fp3', ipHash: 'hash3' },
      ]
    });

    const response = await fetch('http://localhost:3000/api/votes/stats');
    const data = await response.json();

    const dist = data[0].distribution;
    
    // Find the distribution for value 5
    const value5 = dist.find((d: any) => d.value === 5);
    expect(value5.count).toBe(2);

    // Find the distribution for value 7
    const value7 = dist.find((d: any) => d.value === 7);
    expect(value7.count).toBe(1);
  });

  it('should handle questions with no votes', async () => {
    const response = await fetch('http://localhost:3000/api/votes/stats');
    const data = await response.json();

    expect(data[0].totalVotes).toBe(0);
    expect(data[0].average).toBe(0);
    expect(data[0].distribution.every((d: any) => d.count === 0)).toBe(true);
  });

  it('should order questions by order field', async () => {
    const response = await fetch('http://localhost:3000/api/votes/stats');
    const data = await response.json();

    expect(data[0].questionText).toBe('Question 1');
    expect(data[1].questionText).toBe('Question 2');
    expect(data[2].questionText).toBe('Question 3');
  });
});

