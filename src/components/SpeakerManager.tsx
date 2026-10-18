import React from 'react';
import { Users, User, Volume2, Sliders, Sparkles, Plus, Dices, Loader2 } from 'lucide-react';
import { SpeakerConfig, GeminiVoiceName } from '../types/tts';
import { SPEAKER_COLORS } from '../constants/ttsData';

interface SpeakerManagerProps {
  speakers: SpeakerConfig[];
  activeSpeakerId: number;
  onSelectActiveSpeaker: (id: number) => void;
  onUpdateSpeaker: (id: number, updates: Partial<SpeakerConfig>) => void;
  onAppendSpeakerBlock: (speakerId: number) => void;
  onRandomizeSpeakers?: () => void;
  isRandomizingSpeakers?: boolean;
}

const PREBUILT_VOICES: Array<{
  name: GeminiVoiceName;
  gender: 'Feminino' | 'Masculino';
  timbre: string;
}> = [
  { name: 'Kore', gender: 'Feminino', timbre: 'Voz feminina clara, expressiva e envolvente' },
  { name: 'Puck', gender: 'Masculino', timbre: 'Voz masculina jovem, versátil e dinâmica' },
  { name: 'Charon', gender: 'Masculino', timbre: 'Voz masculina grave, serena e madura' },
  { name: 'Fenrir', gender: 'Masculino', timbre: 'Voz masculina profunda, autoritária e épica' },
  { name: 'Zephyr', gender: 'Feminino', timbre: 'Voz feminina suave, calma e amigável' }
];

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({
  speakers,
  activeSpeakerId,
  onSelectActiveSpeaker,
  onUpdateSpeaker,
  onAppendSpeakerBlock,
  onRandomizeSpeakers,
  isRandomizingSpeakers = false
}) => {
  const activeSpeaker = speakers.find((s) => s.id === activeSpeakerId) || speakers[0];
  const activeColor = SPEAKER_COLORS.find((c) => c.id === activeSpeakerId) || SPEAKER_COLORS[0];

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Gerenciador de Speakers (Até 5 Locutores)
              <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                Cores & Personalidades Distintas
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Selecione um locutor para configurar voz, tom, velocidade e sotaque.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Strategic Random AI Button for Speakers */}
          {onRandomizeSpeakers && (
            <button
              type="button"
              onClick={onRandomizeSpeakers}
              disabled={isRandomizingSpeakers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all shadow-sm cursor-pointer hover:border-indigo-500/60"
              title="Gerar e sortear automaticamente personagens, vozes e personalidades com IA"
            >
              {isRandomizingSpeakers ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Sorteando com IA...</span>
                </>
              ) : (
                <>
                  <Dices className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sortear Locutores com IA</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onAppendSpeakerBlock(activeSpeaker.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer hover:brightness-110"
            style={{ backgroundColor: activeColor.primary }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inserir Fala de {activeSpeaker.name}</span>
          </button>
        </div>
      </div>

      {/* 5 Speaker Tabs with Highlight Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {speakers.map((sp) => {
          const colorConfig = SPEAKER_COLORS.find((c) => c.id === sp.id) || SPEAKER_COLORS[0];
          const isActive = sp.id === activeSpeakerId;

          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSelectActiveSpeaker(sp.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isActive
                  ? `${colorConfig.bg} ${colorConfig.borderActive} ring-2 ${colorConfig.ring}/50 shadow-md`
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Active indicator bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: colorConfig.primary }}
              />

              <div className="flex items-center justify-between mt-1 mb-1">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: `${colorConfig.primary}20`,
                    color: colorConfig.primary
                  }}
                >
                  Speaker {sp.id}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {sp.voiceName}
                </span>
              </div>

              <div className="font-semibold text-xs text-slate-100 truncate">
                {sp.name}
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {sp.accent ? `Sotaque ${sp.accent}` : 'Neutro'} • {sp.speed}x
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Speaker Details & Sliders */}
      <div
        className="p-3.5 rounded-xl border transition-all"
        style={{
          backgroundColor: `${activeColor.primary}08`,
          borderColor: `${activeColor.primary}30`
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name & Base Voice */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nome do Personagem / Locutor
              </label>
              <input
                type="text"
                value={activeSpeaker.name}
                onChange={(e) =>
                  onUpdateSpeaker(activeSpeaker.id, { name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                placeholder="Ex: Narrador, Carlos, Apresentadora..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Voz Neural do Gemini 3.8
              </label>
              <select
                value={activeSpeaker.voiceName}
                onChange={(e) =>
                  onUpdateSpeaker(activeSpeaker.id, {
                    voiceName: e.target.value as GeminiVoiceName
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                {PREBUILT_VOICES.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.gender} - {v.timbre})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Velocidade de Fala
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeSpeaker.speed.toFixed(2)}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={activeSpeaker.speed}
              onChange={(e) =>
                onUpdateSpeaker(activeSpeaker.id, {
                  speed: parseFloat(e.target.value)
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5x (Lenta)</span>
              <span>1.0x (Padrão)</span>
              <span>2.0x (Rápida)</span>
            </div>
          </div>

          {/* Pitch Slider (Tom) */}
          <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                Tom da Voz (Pitch)
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {activeSpeaker.pitch > 0 ? `+${activeSpeaker.pitch}` : activeSpeaker.pitch} st
              </span>
            </div>

            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={activeSpeaker.pitch}
              onChange={(e) =>
                onUpdateSpeaker(activeSpeaker.id, {
                  pitch: parseInt(e.target.value, 10)
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-10 st (Grave)</span>
              <span>0 st (Natural)</span>
              <span>+10 st (Agudo)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
