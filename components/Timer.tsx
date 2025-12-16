'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  isRunning: boolean;
  timeLimit: number;
  onTimeout: () => void;
}

export default function Timer({ isRunning, timeLimit, onTimeout }: TimerProps) {
  const [remainingTime, setRemainingTime] = useState(timeLimit * 60);

  useEffect(() => {
    setRemainingTime(timeLimit * 60);
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeout]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="text-2xl font-bold">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
