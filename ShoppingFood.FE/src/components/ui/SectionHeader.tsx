import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
  icon: React.ReactNode;
  title: string;
  sub: string;
  action: string;
  onActionClick?: () => void;
}

export function SectionHeader({ icon, title, sub, action, onActionClick }: Props) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{sub}</p>
        </div>
      </div>
      <button 
        onClick={onActionClick}
        className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors"
      >
        {action} <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
