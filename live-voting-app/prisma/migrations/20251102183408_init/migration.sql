-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoteSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "hasVoted" BOOLEAN NOT NULL DEFAULT true,
    "votedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Vote_fingerprint_idx" ON "Vote"("fingerprint");

-- CreateIndex
CREATE INDEX "Vote_ipHash_idx" ON "Vote"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "VoteSession_fingerprint_key" ON "VoteSession"("fingerprint");
