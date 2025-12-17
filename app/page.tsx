'use client';

import { useState, useCallback, useEffect } from 'react';
import Timer from '@/components/Timer';
import Problem from '@/components/Problem';
import { Problem as ProblemType, UserAnswer, JudgementResult } from '@/types';
import { judgeAnswer } from '@/lib/judgement';
import problemsData from '@/data/problems.json';

export default function Home() {
  const [timeLimit, setTimeLimit] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [problems, setProblems] = useState<ProblemType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('problems');
      if (saved) return JSON.parse(saved);
    }
    return problemsData;
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [aiProvider, setAiProvider] = useState<'groq' | 'gemini'>('groq');
  const [answers, setAnswers] = useState<UserAnswer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('answers');
      if (saved) return JSON.parse(saved);
    }
    return problemsData.map(() => ({
      debitSymbol: '',
      debitAmount: '',
      creditSymbol: '',
      creditAmount: '',
    }));
  });
  const [judgements, setJudgements] = useState<JudgementResult[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('judgements');
      if (saved) return JSON.parse(saved);
    }
    return problemsData.map(() => null);
  });

  useEffect(() => {
    sessionStorage.setItem('problems', JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    sessionStorage.setItem('answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    sessionStorage.setItem('judgements', JSON.stringify(judgements));
  }, [judgements]);

  // Auto-update problems on first visit
  useEffect(() => {
    const hasLoadedBefore = sessionStorage.getItem('hasLoadedBefore');
    if (!hasLoadedBefore) {
      sessionStorage.setItem('hasLoadedBefore', 'true');
      handleUpdateProblems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeout = useCallback(() => {
    alert('時間切れです！');
    setIsRunning(false);
  }, []);

  const handleTimerReset = () => {
    setIsRunning(false);
    setTimerKey((prev) => prev + 1);
  };

  const handleClearAnswers = () => {
    setAnswers(
      problems.map(() => ({
        debitSymbol: '',
        debitAmount: '',
        creditSymbol: '',
        creditAmount: '',
      }))
    );
    setJudgements(problems.map(() => null));
  };

  const handleUpdateProblems = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    let response: Response | undefined;
    try {
      response = await fetch('/api/generate-problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: aiProvider }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      if (data.error || !data.problems) {
        throw new Error('Failed to generate problems');
      }

      setProblems(data.problems);
      setAnswers(
        data.problems.map(() => ({
          debitSymbol: '',
          debitAmount: '',
          creditSymbol: '',
          creditAmount: '',
        }))
      );
      setJudgements(data.problems.map(() => null));
      alert('問題を更新しました！');
    } catch (error) {
      console.error('Error updating problems:', error);

      // Check for specific error types
      if (response && response.status === 429) {
        alert('APIのクォータ制限に達しました。\n無料枠は1日20リクエストまでです。\nしばらく待ってから再度お試しください。');
      } else if (response && response.status === 503) {
        alert('Gemini APIサーバーが混雑しています。\n数分待ってから再度お試しください。');
      } else if (response && response.status === 408) {
        alert('リクエストがタイムアウトしました。\nもう一度お試しください。');
      } else {
        alert('更新できません。\nネットワークまたはAPIキーを確認してください。');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAnswerChange = (index: number, answer: UserAnswer) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
  };

  const handleJudgeOne = (index: number) => {
    const newJudgements = [...judgements];
    newJudgements[index] = judgeAnswer(answers[index], problems[index].correctAnswer);
    setJudgements(newJudgements);
  };

  const handleJudgeAll = () => {
    const newJudgements = problems.map((problem, index) =>
      judgeAnswer(answers[index], problem.correctAnswer)
    );
    setJudgements(newJudgements);

    const correctCount = newJudgements.filter((j) => j === 'correct').length;
    alert(`判定完了！ ${correctCount} / ${problems.length} 問正解`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Fixed Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-300 fixed h-screen p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6">タイマー・判定</h2>

          <div className="mb-6">
            <label className="flex items-center gap-2 mb-3">
              制限時間（分）:
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="border border-gray-300 px-3 py-1 w-20 rounded"
                disabled={isRunning}
              />
            </label>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsRunning(true)}
                className="px-4 py-2 rounded font-semibold flex-1 bg-green-500 hover:bg-green-600 text-white"
                disabled={isRunning}
              >
                Start
              </button>
              <button
                onClick={() => setIsRunning(false)}
                className="px-4 py-2 rounded font-semibold flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={!isRunning}
              >
                Stop
              </button>
              <button
                onClick={handleTimerReset}
                className="px-4 py-2 rounded font-semibold flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">残り時間:</span>
              <Timer
                key={timerKey}
                isRunning={isRunning}
                timeLimit={timeLimit}
                onTimeout={handleTimeout}
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6 space-y-3">
            <button
              onClick={handleJudgeAll}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700"
            >
              全問題を判定
            </button>
            <button
              onClick={handleClearAnswers}
              className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600"
            >
              解答クリア
            </button>
            <button
              onClick={handleUpdateProblems}
              disabled={isUpdating}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdating && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isUpdating ? '更新中...' : '問題の更新'}
            </button>
            <div className="mt-3">
              <label className="block text-sm font-semibold mb-2">AIプロバイダー:</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as 'groq' | 'gemini')}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="groq">Groq (推奨・無料)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="ml-80 flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">日商簿記3級 仕訳問題</h1>

          <div className="mb-6">
            {problems.map((problem, index) => (
              <Problem
                key={problem.id}
                problem={problem}
                answer={answers[index]}
                judgement={judgements[index]}
                onAnswerChange={(answer) => handleAnswerChange(index, answer)}
                onJudge={() => handleJudgeOne(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
