import React from 'react';
import { MapPin, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { BRAZILIAN_ACCENTS } from '../constants/ttsData';
import { RegionalAccent } from '../types/tts';

interface RegionalAccentsBarProps {
  currentAccent?: string;
  activeSpeakerName: string;
  activeSpeakerColor: string;
  onSelectAccent: (accentId: string) => void;
  onInsertTagIntoText: (tagString: string) => void;
}

export const RegionalAccentsBar: React.FC<RegionalAccentsBarProps> = ({
  currentAccent,
  activeSpeakerName,
  activeSpeakerColor,
  onSelectAccent,
  onInsertTagIntoText
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden transition-all duration-300">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        {/* Top-left corner: Collapse Button + Icon + Title */}
        <div className="flex items-center gap-2.5">
          {/* Visual collapse button in top-left corner */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir Sotaques Regionais' : 'Recolher Sotaques Regionais'}
            title={isCollapsed ? 'Expandir menu de sotaques' : 'Recolher menu de sotaques'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm cursor-pointer hover:scale-105"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Expandir</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Recolher</span>
              </>
            )}
          </button>

          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Sotaques Regionais do Brasil
              <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                12 Sotaques Autênticos
              </span>
              {isCollapsed && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                  Recolhido
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Aplicando ao locutor ativo:{' '}
              <span className="font-semibold" style={{ color: activeSpeakerColor }}>
                {activeSpeakerName}
              </span>
              {currentAccent && (
                <span className="ml-2 font-mono text-[10px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  [{currentAccent}]
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isCollapsed ? 'Clique em Expandir para selecionar sotaques' : 'Clique para aplicar à voz ou usar no texto'}</span>
        </div>
      </div>

      {/* Grid of Brazilian regional accents (collapsible) */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 transition-all">
        {BRAZILIAN_ACCENTS.map((accent: RegionalAccent) => {
          const isSelected = currentAccent?.toLowerCase() === accent.id.toLowerCase();
          return (
            <div
              key={accent.id}
              className={`group relative flex flex-col p-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
              onClick={() => onSelectAccent(accent.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold tracking-wide ${
                    isSelected ? 'text-emerald-300' : 'text-slate-200 group-hover:text-emerald-400'
                  }`}
                >
                  [{accent.label.toLowerCase()}]
                </span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    aplicar
                  </span>
                )}
              </div>

              <span className="text-[10px] font-medium text-slate-400 truncate">
                {accent.region}
              </span>

              {/* Quick insert button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertTagIntoText(`[${accent.id}]`);
                }}
                title="Inserir tag no texto do speaker"
                className="mt-1.5 text-[9px] text-emerald-400/80 hover:text-emerald-300 font-mono text-left opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
              >
                + inserir no texto
              </button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
