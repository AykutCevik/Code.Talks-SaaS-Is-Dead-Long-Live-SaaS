export interface Question {
  id: string;
  text: string;
  order: number;
  createdAt?: Date;
}

export interface Vote {
  id: string;
  questionId: string;
  rating: number;
  fingerprint: string;
  ipHash: string;
  createdAt: Date;
}

export interface VoteSession {
  id: string;
  fingerprint: string;
  hasVoted: boolean;
  votedAt: Date;
  ipHash: string;
}

export interface VoteSubmission {
  questionId: string;
  rating: number;
}

export interface VoteDistribution {
  value: number;
  count: number;
}

export interface QuestionStats {
  questionId: string;
  questionText: string;
  totalVotes: number;
  average: number;
  distribution: VoteDistribution[];
}

