import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function Loading({ size = 'md', text }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-orange-500 ${sizes[size]}`} />
      {text && <p className="text-sm font-medium text-gray-600 animate-pulse">{text}</p>}
    </div>
  );
}
