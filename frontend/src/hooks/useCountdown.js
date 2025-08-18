import { useState, useEffect } from "react";

export default function useCountdown(start, isActive) {
  const [countdown, setCountdown] = useState(start);

  useEffect(() => {
    if (!isActive) return;

    setCountdown(start);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [start, isActive]);

  return countdown;
}
