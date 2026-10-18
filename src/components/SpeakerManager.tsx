import React from 'react';
import {
  Users,
  Volume2,
  Sliders,
  Sparkles,
  Plus,
  Dices,
  Loader2,
  Play,
  Square,
  Check,
  Cpu,
  Globe,
  Bot
} from 'lucide-react';
import { SpeakerConfig, VoiceProfile, VoiceProvider, VoiceEngineId } from '../types/tts';
import { SPEAKER_COLORS, ALL_VOICE_PROFILES } from '../constants/ttsData';
import {
  generateVoicePreviewAudio,
  normalizeProvider,
  getDefaultVoiceForEngine
} from '../utils/voiceGateway';

interface SpeakerManagerProps {
  speakers: SpeakerConfig[];
  activeSpeakerId: number;
  onSelectActiveSpeaker: (id: number) => void;
  onUpdateSpeaker: (id: number, updates: Partial<SpeakerConfig>) => void;
  onAppendSpeakerBlock: (speakerId: number) => void;
  onRandomizeSpeakers?: () => void;
  isRandomizingSpeakers?: boolean;
  onOpenEngineSettings?: () => void;
}

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({
  speakers,
  activeSpeakerId,
  onSelectActiveSpeaker,
  onUpdateSpeaker,
  onAppendSpeakerBlock,
  onRandomizeSpeakers,
  isRandomizingSpeakers = false,
  onOpenEngineSettings
}) => {
  const activeSpeaker = speakers.find((s) => s.id === activeSpeakerId) || speakers[0];
  const activeColor = SPEAKER_COLORS.find((c) => c.id === activeSpeakerId) || SPEAKER_COLORS[0];

  // Normalized active provider for the active speaker
  const normalizedActiveProvider = normalizeProvider(activeSpeaker.provider);

  // Engine / Provider filter tab for the voice grid
  const [providerFilter, setProviderFilter] = React.useState<'todos' | VoiceProvider>('todos');

  // Preview state
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);
  const [previewCountdown, setPreviewCountdown] = React.useState(5);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  const activeStopFnRef = React.useRef<(() => void) | null>(null);
  const countdownTimerRef = React.useRef<any>(null);

  const stopPreview = React.useCallback(() => {
    if (activeStopFnRef.current) {
      activeStopFnRef.current();
      activeStopFnRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingVoiceId(null);
    setIsLoadingPreview(false);
    setPreviewCountdown(5);
  }, []);

  // Cleanup on unmount or active speaker change
  React.useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview, activeSpeakerId]);

  // Dynamic Provider switch handler for active speaker
  const handleSelectSpeakerProvider = (targetProvider: 'gemini' | 'openai' | 'elevenlabs') => {
    const defaultVoice = getDefaultVoiceForEngine(targetProvider, activeSpeaker.voiceGender, activeSpeaker.id);
    const provKey: VoiceProvider =
      targetProvider === 'openai'
        ? 'puter-openai'
        : targetProvider === 'elevenlabs'
        ? 'puter-elevenlabs'
        : 'gemini';

    onUpdateSpeaker(activeSpeaker.id, {
      provider: provKey,
      voiceName: defaultVoice.name,
      voiceDescription: `${defaultVoice.providerLabel} - ${defaultVoice.timbre}`
    });

    setProviderFilter(provKey);
  };

  const handleTogglePreview = async (profile: VoiceProfile) => {
    if (playingVoiceId === profile.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPlayingVoiceId(profile.id);
    setIsLoadingPreview(true);
    setPreviewCountdown(5);

    try {
      const audioHandle = await generateVoicePreviewAudio(profile);
      setIsLoadingPreview(false);
      activeStopFnRef.current = audioHandle.stop;

      // Start 5s countdown
      let timeLeft = 5;
      countdownTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          stopPreview();
        } else {
          setPreviewCountdown(timeLeft);
        }
      }, 1000);

      // Listen for natural end if audio element is present
      if (audioHandle.audioElement) {
        audioHandle.audioElement.onended = () => stopPreview();
        audioHandle.audioElement.onerror = () => stopPreview();
      }

      await audioHandle.play();
    } catch (err) {
      console.warn('Voice preview error:', err);
      stopPreview();
    }
  };

  // Filtered voice profiles
  const filteredProfiles = React.useMemo(() => {
    if (providerFilter === 'todos') {
      return ALL_VOICE_PROFILES;
    }
    return ALL_VOICE_PROFILES.filter((v) => {
      const vNorm = normalizeProvider(v.provider);
      const fNorm = normalizeProvider(providerFilter);
      return vNorm === fNorm || v.provider === providerFilter;
    });
  }, [providerFilter]);

  // Current voice profile object for the active speaker
  const currentVoiceProfile =
    ALL_VOICE_PROFILES.find(
      (v) =>
        v.name.toLowerCase() === (activeSpeaker.voiceName || '').toLowerCase() ||
        v.id === activeSpeaker.voiceName
    ) || ALL_VOICE_PROFILES[0];

  const getProviderBadge = (provider?: VoiceProvider) => {
    const norm = normalizeProvider(provider);
    switch (norm) {
      case 'openai':
        return {
          label: 'OpenAI TTS',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        };
      case 'microsoft-edge':
        return {
          label: 'Microsoft Edge',
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        };
      case 'elevenlabs':
        return {
          label: 'ElevenLabs',
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        };
      case 'puter-neural':
        return {
          label: 'Puter Neural',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        };
      case 'gemini':
      default:
        return {
          label: 'Gemini 3.8',
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
        };
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Gerenciador de Speakers & Multi-Gateway TTS
              <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Puter.js • Edge TTS • Gemini
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Escolha livremente entre vozes OpenAI TTS (via Puter.js), ElevenLabs, Microsoft Edge e Gemini.
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

      {/* --- DYNAMIC PROVIDER SELECTOR IN HEADER --- */}
      {/* Allows switching the active speaker provider between 'gemini', 'openai' and 'elevenlabs' (Puter.js) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-800 text-slate-300">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              Engine do Locutor Ativo: <span className="text-white font-extrabold">{activeSpeaker.name}</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: `${activeColor.primary}25`,
                  color: activeColor.primary
                }}
              >
                Speaker {activeSpeaker.id}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Alterne a engine de síntese usada na geração deste locutor
            </p>
          </div>
        </div>

        {/* Dynamic Provider Selector Buttons: Gemini, OpenAI, ElevenLabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Gemini */}
          <button
            type="button"
            onClick={() => handleSelectSpeakerProvider('gemini')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              normalizedActiveProvider === 'gemini'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title="Google Gemini 3.8 Flash TTS nativo"
          >
            <span className={`w-2 h-2 rounded-full ${normalizedActiveProvider === 'gemini' ? 'bg-white' : 'bg-indigo-400'}`} />
            <span>Gemini TTS</span>
            {normalizedActiveProvider === 'gemini' && <Check className="w-3 h-3 ml-0.5" />}
          </button>

          {/* OpenAI TTS via Puter.js */}
          <button
            type="button"
            onClick={() => handleSelectSpeakerProvider('openai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              normalizedActiveProvider === 'openai'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title="OpenAI TTS (tts-1-hd) gratuito via Puter.js Gateway"
          >
            <span className={`w-2 h-2 rounded-full ${normalizedActiveProvider === 'openai' ? 'bg-white' : 'bg-emerald-400'}`} />
            <span>OpenAI (Puter.js)</span>
            {normalizedActiveProvider === 'openai' && <Check className="w-3 h-3 ml-0.5" />}
          </button>

          {/* ElevenLabs via Puter.js */}
          <button
            type="button"
            onClick={() => handleSelectSpeakerProvider('elevenlabs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              normalizedActiveProvider === 'elevenlabs'
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title="ElevenLabs Multilingual v2 gratuito via Puter.js Gateway"
          >
            <span className={`w-2 h-2 rounded-full ${normalizedActiveProvider === 'elevenlabs' ? 'bg-white' : 'bg-purple-400'}`} />
            <span>ElevenLabs (Puter.js)</span>
            {normalizedActiveProvider === 'elevenlabs' && <Check className="w-3 h-3 ml-0.5" />}
          </button>

          {/* Settings modal shortcut */}
          {onOpenEngineSettings && (
            <button
              type="button"
              onClick={onOpenEngineSettings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
              title="Abrir painel global de configurações de TTS e Gateways"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Painel Global</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Speaker Tabs with Highlight Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {speakers.map((sp) => {
          const colorConfig = SPEAKER_COLORS.find((c) => c.id === sp.id) || SPEAKER_COLORS[0];
          const isActive = sp.id === activeSpeakerId;
          const badge = getProviderBadge(sp.provider || 'gemini');

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
                <span className={`text-[9px] font-semibold px-1 py-0.2 rounded border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              <div className="font-semibold text-xs text-slate-100 truncate">
                {sp.name}
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {sp.voiceName} • {sp.speed}x
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Speaker Details & Voice Gateway Selection */}
      <div
        className="p-3.5 rounded-xl border transition-all space-y-4"
        style={{
          backgroundColor: `${activeColor.primary}08`,
          borderColor: `${activeColor.primary}30`
        }}
      >
        {/* Top details: Name, Active Voice Summary, Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name & Active Voice Summary */}
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

            {/* Current Active Voice Badge */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Voz Atual de {activeSpeaker.name}
              </label>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {currentVoiceProfile.name}
                    </span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getProviderBadge(currentVoiceProfile.provider).bg}`}>
                      {getProviderBadge(currentVoiceProfile.provider).label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({currentVoiceProfile.gender})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                    {currentVoiceProfile.timbre}
                  </div>
                </div>

                {/* Quick 5s Preview of Current Voice */}
                <button
                  type="button"
                  onClick={() => handleTogglePreview(currentVoiceProfile)}
                  disabled={isLoadingPreview && playingVoiceId === currentVoiceProfile.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm ${
                    playingVoiceId === currentVoiceProfile.id
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20'
                  }`}
                >
                  {isLoadingPreview && playingVoiceId === currentVoiceProfile.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : playingVoiceId === currentVoiceProfile.id ? (
                    <>
                      <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{previewCountdown}s</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
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

        {/* --- VOICE GATEWAYS & PREVIEWS (5s) --- */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Catálogo de Vozes Neurais & Gateways Livres
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                {filteredProfiles.length} vozes disponíveis
              </span>
            </div>

            {playingVoiceId && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Ouvindo demonstração de 5 segundos ({previewCountdown}s restantes)
              </span>
            )}
          </div>

          {/* Engine Tabs Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
            {[
              { id: 'todos', label: '🌟 Todas as Vozes' },
              { id: 'puter-openai', label: '🤖 OpenAI TTS (Puter.js)' },
              { id: 'puter-elevenlabs', label: '🎙️ ElevenLabs (Puter.js)' },
              { id: 'microsoft-edge', label: '🔷 Microsoft Edge Neural' },
              { id: 'puter-neural', label: '🧠 Puter Neural' },
              { id: 'gemini', label: '✨ Gemini 3.8 Flash' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProviderFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  providerFilter === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Voices Grid with 5-Second Functional Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredProfiles.map((v) => {
              const vNorm = normalizeProvider(v.provider);
              const spNorm = normalizeProvider(activeSpeaker.provider);
              const isSelected =
                activeSpeaker.voiceName.toLowerCase() === v.name.toLowerCase() &&
                vNorm === spNorm;
              const isPlaying = playingVoiceId === v.id;
              const badge = getProviderBadge(v.provider);

              return (
                <div
                  key={v.id}
                  className={`p-3 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    {/* Header: Name, Provider & Gender */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {v.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({v.gender})
                        </span>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-3 line-clamp-2">
                      {v.timbre}
                    </p>
                  </div>

                  {/* Action buttons: 5-Second Preview & Select Voice */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    {/* 5s Preview button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePreview(v)}
                      disabled={isLoadingPreview && playingVoiceId === v.id}
                      title={isPlaying ? 'Parar prévia' : `Ouvir preview funcional de 5s da voz ${v.name}`}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                        isPlaying
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50'
                      }`}
                    >
                      {isLoadingPreview && playingVoiceId === v.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          <span>Carregando...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
                          <span>Parar ({previewCountdown}s)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                          <span>Preview 5s</span>
                        </>
                      )}
                    </button>

                    {/* Select / Active Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSpeaker(activeSpeaker.id, {
                          voiceName: v.name,
                          provider: v.provider,
                          voiceGender: v.gender === 'Neutro' ? 'Feminino' : v.gender,
                          voiceDescription: `${v.providerLabel} - ${v.timbre}`
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Ativa</span>
                        </>
                      ) : (
                        <span>Escolher</span>
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
