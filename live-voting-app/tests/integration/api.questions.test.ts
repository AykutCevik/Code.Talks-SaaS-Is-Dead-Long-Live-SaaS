import { describe, it, expect } from 'vitest';

describe('GET /api/questions', () => {
  it('should return all questions ordered by order field', async () => {
    const response = await fetch('http://localhost:3000/api/questions');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data[0].order).toBe(1);
    expect(data[1].order).toBe(2);
    expect(data[2].order).toBe(3);
  });

  it('should return questions with correct structure', async () => {
    const response = await fetch('http://localhost:3000/api/questions');
    const data = await response.json();

    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('text');
    expect(data[0]).toHaveProperty('order');
    expect(data[0]).toHaveProperty('createdAt');
  });
});

