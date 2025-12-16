import { JournalEntry, UserAnswer, JudgementResult } from '@/types';

export function judgeAnswer(
  userAnswer: UserAnswer,
  correctAnswer: JournalEntry
): JudgementResult {
  const debitAmountNum = parseInt(userAnswer.debitAmount, 10);
  const creditAmountNum = parseInt(userAnswer.creditAmount, 10);

  if (
    isNaN(debitAmountNum) ||
    isNaN(creditAmountNum) ||
    !userAnswer.debitSymbol ||
    !userAnswer.creditSymbol
  ) {
    return null;
  }

  const isCorrect =
    userAnswer.debitSymbol === correctAnswer.debitSymbol &&
    debitAmountNum === correctAnswer.debitAmount &&
    userAnswer.creditSymbol === correctAnswer.creditSymbol &&
    creditAmountNum === correctAnswer.creditAmount;

  return isCorrect ? 'correct' : 'incorrect';
}
