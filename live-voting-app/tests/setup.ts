import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import { waitForServer } from './integration/test-helper';

beforeAll(async () => {
  // Use dev database for integration tests
  process.env.DATABASE_URL = 'file:./dev.db';
  process.env.ADMIN_SECRET = 'demo-secret-change-in-production';
  process.env.IP_SALT = 'random-salt-for-ip-hashing-change-this';
  
  // Wait for dev server to be ready
  try {
    await waitForServer('http://localhost:3000/api/questions', 5);
  } catch (e) {
    console.warn('Dev server may not be running. Some tests may fail.');
  }
  
  // Ensure we have test questions - only clean votes/sessions
  await prisma.vote.deleteMany({});
  await prisma.voteSession.deleteMany({});
  
  // Ensure we have test questions - DON'T modify existing question texts
  const questionCount = await prisma.question.count();
  if (questionCount === 0) {
    // Only create questions if none exist - preserve original texts if they do
    await prisma.question.createMany({
      data: [
        { text: 'Question 1', order: 1 },
        { text: 'Question 2', order: 2 },
        { text: 'Question 3', order: 3 },
      ]
    });
  }
  // If questions exist, leave them as-is (preserve original texts)
}, 60000); // 60 second timeout

afterEach(async () => {
  // Only clean up votes and sessions, NOT questions
  await prisma.vote.deleteMany({});
  await prisma.voteSession.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

