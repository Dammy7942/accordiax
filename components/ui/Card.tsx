'use client';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = true }: CardProps) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-200 ${hover ? 'hover:shadow-md hover:-translate-y-1' : ''} ${className}`}>
      {children}
    </div>
  );
};