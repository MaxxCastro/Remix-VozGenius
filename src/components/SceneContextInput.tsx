import React from 'react';
import { Clapperboard, Sparkles } from 'lucide-react';

interface SceneContextInputProps {
  sceneContext: string;
  onChangeSceneContext: (value: string) => void;
}

const QUICK_CONTEXT_PRESETS = [
  '🎙️ Estúdio de podcast profissional com diálogo dinâmico e amigável.',
  '⚡ Comercial de rádio com energia lá em cima e ritmo acelerado.',
  '🌧️ Cena dramática de suspense e mistério em noite chuvosa.',
  '🎧 Audiolivro com narração imersiva, dicção cinematográfica e pausas expressivas.',
  '☕ Conversa calorosa e descontraída em um café tradicional brasileiro.'
];

export const SceneContextInput: React.FC<SceneContextInputProps> = ({
  sceneContext,
  onChangeSceneContext
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30">
            <Clapperboard className="w-4 h-4" />
          </div>
          Contexto Geral da Cena & Ambientação Narrativa
        </label>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          Orienta o modelo Gemini TTS
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        Descreva o ambiente físico, a energia da cena e o estilo narrativo geral para guiar a interpretação da inteligência artificial.
      </p>

      <div className="relative">
        <textarea
          rows={2}
          value={sceneContext}
          onChange={(e) => onChangeSceneContext(e.target.value)}
          placeholder="Ex: Estúdio de podcast moderno, diálogo descontraído e amigável entre amigos com risos naturais e alta clareza..."
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-pink-500/50 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-pink-500/50 leading-relaxed resize-none"
        />
      </div>

      {/* Quick context presets */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-slate-500 whitespace-nowrap text-[10px] font-semibold uppercase">
          Sugestões Rápidas:
        </span>
        {QUICK_CONTEXT_PRESETS.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChangeSceneContext(preset.replace(/^[^\s]+\s/, ''))}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 whitespace-nowrap text-[11px] transition-colors cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
