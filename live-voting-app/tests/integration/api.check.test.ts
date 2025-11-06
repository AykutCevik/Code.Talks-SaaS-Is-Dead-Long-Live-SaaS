import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/db';

describe('GET /api/votes/check', () => {

  it('should return hasVoted: false when fingerprint not found', async () => {
    const response = await fetch('http://localhost:3000/api/votes/check?fp=unknown-fp');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasVoted).toBe(false);
  });

  it('should return hasVoted: true when fingerprint exists', async () => {
    const fingerprint = 'test-fingerprint-voted';
    
    // Create a vote session
    await prisma.voteSession.create({
      data: {
        fingerprint,
        ipHash: 'test-hash'
      }
    });

    const response = await fetch(`http://localhost:3000/api/votes/check?fp=${fingerprint}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasVoted).toBe(true);
  });

  it('should return hasVoted: false when no fingerprint provided', async () => {
    const response = await fetch('http://localhost:3000/api/votes/check');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasVoted).toBe(false);
  });
});

