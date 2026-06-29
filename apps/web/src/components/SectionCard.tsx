import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

export function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}
