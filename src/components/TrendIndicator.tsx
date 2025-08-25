import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import React from 'react';

type Direction = 'up' | 'down' | 'neutral';

export function TrendIndicator({
  direction,
  value,
  className = ''
}: {
  direction: Direction;
  value?: string | number;
  className?: string;
}) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;
  const color = direction === 'up' ? 'text-green-success' : direction === 'down' ? 'text-red-danger' : 'text-muted-foreground';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {value !== undefined && value !== null && <span className="leading-none">{value}</span>}
    </span>
  );
}
