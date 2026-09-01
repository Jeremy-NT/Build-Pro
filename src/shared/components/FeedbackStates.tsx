import React from 'react';
import { Loader2, Inbox, ArrowRight } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Synchronizing real estate secure records...', 
  fullPage = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 font-sans">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" id="loading-spinner-icon" />
      <p className="text-slate-500 text-xs font-mono tracking-tight text-center">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs max-w-md mx-auto space-y-4 font-sans animate-in fade-in duration-300" id="empty-state-card">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <div>
        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{title}</h4>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/15 transition cursor-pointer"
          id="empty-state-cta-btn"
        >
          {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
