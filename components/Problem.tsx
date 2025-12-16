'use client';

import { Problem as ProblemType, UserAnswer, JudgementResult } from '@/types';
import { useRouter } from 'next/navigation';

interface ProblemProps {
  problem: ProblemType;
  answer: UserAnswer;
  judgement: JudgementResult;
  onAnswerChange: (answer: UserAnswer) => void;
  onJudge: () => void;
}

export default function Problem({
  problem,
  answer,
  judgement,
  onAnswerChange,
  onJudge,
}: ProblemProps) {
  const router = useRouter();

  const handleChange = (field: keyof UserAnswer, value: string) => {
    onAnswerChange({ ...answer, [field]: value });
  };

  return (
    <div className="border border-gray-300 p-4 mb-4 rounded">
      <h3 className="font-bold mb-2">問題{problem.id}</h3>
      <p className="mb-3">{problem.question}</p>

      <div className="mb-3">
        <div className="font-semibold mb-1">勘定科目:</div>
        <div className="flex flex-wrap gap-2">
          {problem.accountOptions.map((option) => (
            <span key={option.symbol} className="text-sm">
              {option.symbol}: {option.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="font-semibold mb-1">借方</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="記号"
              className="border border-gray-300 px-2 py-1 w-16"
              value={answer.debitSymbol}
              onChange={(e) => handleChange('debitSymbol', e.target.value.toUpperCase())}
            />
            <input
              type="number"
              placeholder="金額"
              className="border border-gray-300 px-2 py-1 flex-1"
              value={answer.debitAmount}
              onChange={(e) => handleChange('debitAmount', e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">貸方</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="記号"
              className="border border-gray-300 px-2 py-1 w-16"
              value={answer.creditSymbol}
              onChange={(e) => handleChange('creditSymbol', e.target.value.toUpperCase())}
            />
            <input
              type="number"
              placeholder="金額"
              className="border border-gray-300 px-2 py-1 flex-1"
              value={answer.creditAmount}
              onChange={(e) => handleChange('creditAmount', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onJudge}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          判定
        </button>
        <button
          onClick={() => router.push(`/answer/${problem.id}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          正解
        </button>
        {judgement && (
          <span
            className={`font-bold ${
              judgement === 'correct' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {judgement === 'correct' ? '○ 正解' : '× 不正解'}
          </span>
        )}
      </div>
    </div>
  );
}
