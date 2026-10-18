import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ConversionStatus } from '../types/tts';

interface ProgressBarProps {
  status: ConversionStatus;
  progress: number;
  message: string;
  error?: string;
  onRetry?: () => void;
  duration?: number;
  modelUsed?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  status,
  progress,
  message,
  error,
  onRetry,
  duration,
  modelUsed
}) => {
  // Config per status
  const getStatusBadge = () => {
    switch (status) {
      case 'aguardando':
        return {
          label: 'aguardando',
          text: 'Aguardando',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Clock,
          barGradient: 'from-amber-500 to-amber-600'
        };
      case 'convertendo':
        return {
          label: 'convertendo',
          text: 'Convertendo',
          badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: Loader2,
          barGradient: 'from-indigo-500 via-purple-500 to-pink-500',
          spin: true
        };
      case 'concluído':
        return {
          label: 'concluído',
          text: 'Concluído',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          barGradient: 'from-emerald-500 to-teal-400'
        };
      case 'erro':
        return {
          label: 'erro',
          text: 'Erro',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: AlertTriangle,
          barGradient: 'from-rose-500 to-red-600'
        };
      default:
        return {
          label: 'aguardando',
          text: 'Aguardando',
          badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: Clock,
          barGradient: 'from-slate-500 to-slate-600'
        };
    }
  };

  const statusConfig = getStatusBadge();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm shadow-xl">
      {/* Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Status Badge with label */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusConfig.badgeBg}`}
          >
            <StatusIcon
              className={`w-3.5 h-3.5 ${
                statusConfig.spin ? 'animate-spin' : ''
              }`}
            />
            Status: {statusConfig.label}
          </span>

          {modelUsed && (
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              • {modelUsed}
            </span>
          )}
        </div>

        {/* Percentage or duration */}
        <div className="flex items-center gap-3">
          {status === 'concluído' && duration && (
            <span className="text-xs text-emerald-400 font-mono font-medium">
              Duração: {duration.toFixed(1)}s
            </span>
          )}
          <span className="text-sm font-mono font-bold text-slate-100">
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${
            statusConfig.barGradient
          } transition-all duration-300 ease-out relative ${
            status === 'convertendo' ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
        >
          {status === 'convertendo' && (
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:200%_100%]" />
          )}
        </div>
      </div>

      {/* Message / Error Details */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span
          className={`font-medium truncate ${
            status === 'erro' ? 'text-rose-400' : 'text-slate-300'
          }`}
        >
          {status === 'erro' ? error || message : message}
        </span>

        {status === 'erro' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors ml-2 cursor-pointer flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tentar Novamente</span>
          </button>
        )}
      </div>
    </div>
  );
};
