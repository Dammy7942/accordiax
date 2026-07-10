'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  label: string;
}

export function AnimatedCounter({ value, label }: Props) {
  const match = value.match(/^([\d.]+)(.*)$/);
  const isNumeric = !!match;
  const numericPart = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const isDecimal = match ? match[1].includes('.') : false;

  const [count, setCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNumeric) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
          if (prefersReduced) {
            setCount(numericPart);
            observer.disconnect();
            return;
          }
          const duration = 1400;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * numericPart);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNumeric, numericPart, triggered]);

  const displayed = isNumeric
    ? (isDecimal ? count.toFixed(1) : Math.floor(count).toString()) + suffix
    : value;

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tabular-nums">
        {displayed}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  );
}
