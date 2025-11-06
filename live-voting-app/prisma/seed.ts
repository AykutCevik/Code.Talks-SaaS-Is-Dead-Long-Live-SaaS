import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
  {
    text: "Wie sehr hat euch der Vortrag gefallen?",
    order: 1
  },
  {
    text: "Sollten neue SaaS-Produkte als Monolith starten?",
    order: 2
  },
  {
    text: "Werdet ihr jetzt häufiger Vibe Coden?",
    order: 3
  }
];

async function main() {
  console.log('Seeding database...');
  
  // Clear existing data
  await prisma.vote.deleteMany({});
  await prisma.voteSession.deleteMany({});
  await prisma.question.deleteMany({});
  
  // Seed questions
  for (const question of questions) {
    await prisma.question.create({
      data: question
    });
  }
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

