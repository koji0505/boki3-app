'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Problem } from '@/types';
import problemsData from '@/data/problems.json';

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const problemId = parseInt(id, 10);

  // Read from sessionStorage first, fall back to problemsData
  let problems: Problem[] = problemsData as Problem[];
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('problems');
    if (saved) {
      problems = JSON.parse(saved);
    }
  }

  const problem = problems.find((p) => p.id === problemId);

  if (!problem) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">問題が見つかりません</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            戻る
          </button>
        </div>
      </main>
    );
  }

  const debitAccount = problem.accountOptions.find(
    (opt) => opt.symbol === problem.correctAnswer.debitSymbol
  );
  const creditAccount = problem.accountOptions.find(
    (opt) => opt.symbol === problem.correctAnswer.creditSymbol
  );

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">問題{problem.id} - 解答・解説</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="font-bold text-lg mb-3">問題</h2>
          <p className="mb-4">{problem.question}</p>

          <h2 className="font-bold text-lg mb-3">正解の仕訳</h2>
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">借方</th>
                <th className="border border-gray-300 px-4 py-2">金額</th>
                <th className="border border-gray-300 px-4 py-2">貸方</th>
                <th className="border border-gray-300 px-4 py-2">金額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  {debitAccount?.name || problem.correctAnswer.debitSymbol}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {problem.correctAnswer.debitAmount.toLocaleString()}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {creditAccount?.name || problem.correctAnswer.creditSymbol}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {problem.correctAnswer.creditAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <h2 className="font-bold text-lg mb-3">解説</h2>
          <p className="text-gray-700">{problem.explanation}</p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          問題一覧に戻る
        </button>
      </div>
    </main>
  );
}
