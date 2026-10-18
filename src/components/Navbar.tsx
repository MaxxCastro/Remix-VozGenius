import React from 'react';
import { Volume2, Sparkles, BookOpen } from 'lucide-react';
import { PRESET_SCENES } from '../constants/ttsData';

interface NavbarProps {
  onSelectPreset: (presetId: string) => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectPreset, hasApiKey }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                VozGenius AI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Puter.js • Edge TTS • Gemini
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Estúdio Multi-Speaker & Gateway Livre de IA (OpenAI TTS, Edge Neural, ElevenLabs)
            </p>
          </div>
        </div>

        {/* Preset Presets & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Presets */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Exemplos Prontos</span>
              <span className="sm:hidden">Exemplos</span>
            </button>
            <div className="absolute right-0 mt-2 w-72 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Carregar Roteiro de Exemplo
              </div>
              {PRESET_SCENES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors group/item"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover/item:text-indigo-400">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Engine indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] text-slate-300 font-mono">
              {hasApiKey ? 'Gemini 3.8 Conectado' : 'Modo Preview'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
