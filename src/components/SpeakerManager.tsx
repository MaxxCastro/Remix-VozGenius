import React from 'react';
import { Users, User, Volume2, Sliders, Sparkles, Plus, Play, Square, Loader2, Check } from 'lucide-react';
import { SpeakerConfig, GeminiVoiceName } from '../types/tts';
import { SPEAKER_COLORS } from '../constants/ttsData';

interface SpeakerManagerProps {
  speakers: SpeakerConfig[];
  activeSpeakerId: number;
  onSelectActiveSpeaker: (id: number) => void;
  onUpdateSpeaker: (id: number, updates: Partial<SpeakerConfig>) => void;
  onAppendSpeakerBlock: (speakerId: number) => void;
}

const PREBUILT_VOICES: Array<{
  name: GeminiVoiceName;
  gender: 'Feminino' | 'Masculino';
  timbre: string;
  sampleText: string;
}> = [
  {
    name: 'Kore',
    gender: 'Feminino',
    timbre: 'Voz feminina clara, expressiva e envolvente',
    sampleText: 'Olá! Sou a voz Kore, clara e expressiva para suas produções.'
  },
  {
    name: 'Puck',
    gender: 'Masculino',
    timbre: 'Voz masculina jovem, versátil e dinâmica',
    sampleText: 'Fala aí! Sou a voz Puck, tom jovem, dinâmico e versátil.'
  },
  {
    name: 'Charon',
    gender: 'Masculino',
    timbre: 'Voz masculina grave, serena e madura',
    sampleText: 'Olá. Sou a voz Charon, grave, serena e marcante.'
  },
  {
    name: 'Fenrir',
    gender: 'Masculino',
    timbre: 'Voz masculina profunda, autoritária e épica',
    sampleText: 'Atenção. Sou a voz Fenrir, voz masculina profunda e imponente.'
  },
  {
    name: 'Zephyr',
    gender: 'Feminino',
    timbre: 'Voz feminina suave, calma e amigável',
    sampleText: 'Olá! Sou a voz Zephyr, suave, amigável e acolhedora.'
  }
];

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({
  speakers,
  activeSpeakerId,
  onSelectActiveSpeaker,
  onUpdateSpeaker,
  onAppendSpeakerBlock
}) => {
  const activeSpeaker = speakers.find((s) => s.id === activeSpeakerId) || speakers[0];
  const activeColor = SPEAKER_COLORS.find((c) => c.id === activeSpeakerId) || SPEAKER_COLORS[0];

  // 5-second Preview State
  const [playingVoice, setPlayingVoice] = React.useState<string | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = React.useState<number>(5);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState<string | null>(null);

  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = React.useRef<number | null>(null);

  // Stop any active preview
  const stopPreview = React.useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    if (previewTimerRef.current) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingVoice(null);
    setIsLoadingPreview(null);
    setPreviewSecondsLeft(5);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  // Play 5-second preview for a given voice
  const handlePlayPreview = async (voiceName: GeminiVoiceName) => {
    // If already playing this voice, stop it
    if (playingVoice === voiceName) {
      stopPreview();
      return;
    }

    // Stop previous preview
    stopPreview();

    setIsLoadingPreview(voiceName);

    try {
      // Fetch preview audio from server endpoint
      const response = await fetch(`/api/tts/preview?voice=${voiceName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        previewAudioRef.current = audio;

        audio.onended = () => {
          stopPreview();
        };

        audio.onerror = () => {
          console.warn('Audio element error, falling back to client speech synthesis');
          fallbackClientSpeech(voiceName);
        };

        await audio.play();
        setIsLoadingPreview(null);
        setPlayingVoice(voiceName);
        setPreviewSecondsLeft(5);

        // Start strict 5-second countdown timer
        const startTime = Date.now();
        previewTimerRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const remaining = Math.max(0, Math.ceil(5 - elapsed));
          setPreviewSecondsLeft(remaining);

          if (elapsed >= 5.0) {
            stopPreview();
          }
        }, 200);
      } else {
        fallbackClientSpeech(voiceName);
      }
    } catch (err) {
      console.warn('Failed to load server preview, using browser voice fallback:', err);
      fallbackClientSpeech(voiceName);
    }
  };

  // Browser Web Speech fallback (5 seconds duration)
  const fallbackClientSpeech = (voiceName: GeminiVoiceName) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voiceInfo = PREBUILT_VOICES.find((v) => v.name === voiceName);
      const utterance = new SpeechSynthesisUtterance(
        voiceInfo?.sampleText || `Demonstração da voz ${voiceName}.`
      );
      utterance.lang = 'pt-BR';
      if (voiceName === 'Fenrir') utterance.pitch = 0.6;
      else if (voiceName === 'Charon') utterance.pitch = 0.8;
      else if (voiceName === 'Kore') utterance.pitch = 1.2;
      else if (voiceName === 'Zephyr') utterance.pitch = 1.1;

      window.speechSynthesis.speak(utterance);
      setIsLoadingPreview(null);
      setPlayingVoice(voiceName);
      setPreviewSecondsLeft(5);

      const startTime = Date.now();
      previewTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, Math.ceil(5 - elapsed));
        setPreviewSecondsLeft(remaining);
        if (elapsed >= 5.0) {
          stopPreview();
        }
      }, 200);
    } else {
      setIsLoadingPreview(null);
      setPlayingVoice(null);
    }
  };

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Voz Neural do Gemini 3.8
                </label>
                {/* 5-second preview button beside the voice select */}
                <button
                  type="button"
                  onClick={() => handlePlayPreview(activeSpeaker.voiceName)}
                  disabled={isLoadingPreview !== null && isLoadingPreview !== activeSpeaker.voiceName}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                    playingVoice === activeSpeaker.voiceName
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                  }`}
                  title={`Pré-visualizar 5 segundos da voz ${activeSpeaker.voiceName}`}
                >
                  {isLoadingPreview === activeSpeaker.voiceName ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      <span>Carregando...</span>
                    </>
                  ) : playingVoice === activeSpeaker.voiceName ? (
                    <>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse" />
                        <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
                        <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
                      </div>
                      <Square className="w-2.5 h-2.5 fill-current text-emerald-400" />
                      <span className="font-mono">{previewSecondsLeft}s</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Preview (5s)</span>
                    </>
                  )}
                </button>
              </div>

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
                    {v.name} ({v.gender} - {v.timbre.split(',')[0]})
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

        {/* Neural Voice Styles with Individual 5-second Preview Buttons */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Opções de Voz Neural & Previews Funcionais (5 segundos)
            </label>
            <span className="text-[10px] text-slate-400">
              Clique no botão Preview ao lado de cada estilo para ouvir 5s de áudio realista
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {PREBUILT_VOICES.map((v) => {
              const isCurrentVoice = activeSpeaker.voiceName === v.name;
              const isVoicePlaying = playingVoice === v.name;
              const isLoading = isLoadingPreview === v.name;

              return (
                <div
                  key={v.name}
                  onClick={() => onUpdateSpeaker(activeSpeaker.id, { voiceName: v.name })}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrentVoice
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        {v.name}
                        {isCurrentVoice && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        )}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {v.gender}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight mb-2.5">
                      {v.timbre}
                    </p>
                  </div>

                  {/* Dedicated 5s preview button beside/inside each voice style */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isCurrentVoice ? (
                        <span className="text-indigo-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-indigo-400" /> Ativa
                        </span>
                      ) : (
                        <span className="text-slate-500 hover:text-slate-300">Usar</span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(v.name);
                      }}
                      disabled={isLoadingPreview !== null && !isLoading}
                      title={`Ouvir pré-visualização de 5 segundos da voz ${v.name}`}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all shadow-sm cursor-pointer ${
                        isVoicePlaying
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500 animate-pulse'
                          : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30 hover:border-indigo-500'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                          <span>...</span>
                        </>
                      ) : isVoicePlaying ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current text-emerald-400" />
                          <span className="font-mono">{previewSecondsLeft}s</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Preview 5s</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
