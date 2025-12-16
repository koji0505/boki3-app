export interface AccountOption {
  symbol: string;
  name: string;
}

export interface JournalEntry {
  debitSymbol: string;
  debitAmount: number;
  creditSymbol: string;
  creditAmount: number;
}

export interface Problem {
  id: number;
  question: string;
  accountOptions: AccountOption[];
  correctAnswer: JournalEntry;
  explanation: string;
}

export interface UserAnswer {
  debitSymbol: string;
  debitAmount: string;
  creditSymbol: string;
  creditAmount: string;
}

export type JudgementResult = 'correct' | 'incorrect' | null;
