import React from 'react';
import {
  X,
  Cpu,
  Sparkles,
  Bot,
  Volume2,
  Check,
  Play,
  Square,
  Loader2,
  Users,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import { VoiceEngineId, SpeakerConfig } from '../types/tts';
import {
  TTS_ENGINES,
  isPuterAvailable,
  getDefaultVoiceForEngine,
  generateVoicePreviewAudio
} from '../utils/voiceGateway';

interface VoiceEngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEngine: VoiceEngineId;
  onSelectEngine: (engine: VoiceEngineId) => void;
  onApplyEngineToAllSpeakers: (engine: VoiceEngineId) => void;
  autoFallbackOnQuota: boolean;
  onToggleAutoFallback: (val: boolean) => void;
  speakers: SpeakerConfig[];
}

export const VoiceEngineSettingsModal: React.FC<VoiceEngineSettingsModalProps> = ({
  isOpen,
  onClose,
  activeEngine,
  onSelectEngine,
  onApplyEngineToAllSpeakers,
  autoFallbackOnQuota,
  onToggleAutoFallback,
  speakers
}) => {
  const [testingEngine, setTestingEngine] = React.useState<VoiceEngineId | null>(null);
  const [previewCountdown, setPreviewCountdown] = React.useState(5);
  const [justAppliedToAll, setJustAppliedToAll] = React.useState(false);

  const activeStopRef = React.useRef<(() => void) | null>(null);
  const countdownTimerRef = React.useRef<any>(null);

  const stopPreview = React.useCallback(() => {
    if (activeStopRef.current) {
      activeStopRef.current();
      activeStopRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setTestingEngine(null);
    setPreviewCountdown(5);
  }, []);

  // Keyboard escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        stopPreview();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopPreview();
    };
  }, [isOpen, onClose, stopPreview]);

  if (!isOpen) return null;

  const handleTestEngine = async (engineId: VoiceEngineId) => {
    if (testingEngine === engineId) {
      stopPreview();
      return;
    }

    stopPreview();
    setTestingEngine(engineId);
    setPreviewCountdown(5);

    try {
      const defaultVoice = getDefaultVoiceForEngine(engineId, 'Feminino', 1);
      const audioHandle = await generateVoicePreviewAudio(defaultVoice);
      activeStopRef.current = audioHandle.stop;

      let timeLeft = 5;
      countdownTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          stopPreview();
        } else {
          setPreviewCountdown(timeLeft);
        }
      }, 1000);

      if (audioHandle.audioElement) {
        audioHandle.audioElement.onended = () => stopPreview();
        audioHandle.audioElement.onerror = () => stopPreview();
      }

      await audioHandle.play();
    } catch (err) {
      console.warn('Test engine error:', err);
      stopPreview();
    }
  };

  const handleApplyAll = () => {
    onApplyEngineToAllSpeakers(activeEngine);
    setJustAppliedToAll(true);
    setTimeout(() => setJustAppliedToAll(false), 2500);
  };

  const puterOnline = isPuterAvailable();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopPreview();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Painel de Engines de Voz & Gateway de IA
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Alterne entre Gemini TTS nativo e as opções do Gateway Puter.js (OpenAI, ElevenLabs e Neurais)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          {/* Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${puterOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="text-[11px] font-semibold text-slate-300">Gateway Puter.js</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {puterOnline ? 'v2 Online • Livre' : 'Carregando CDN...'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
              <div>
                <div className="text-[11px] font-semibold text-slate-300">Gemini 3.8 Flash</div>
                <div className="text-[10px] text-slate-400 font-mono">Multimodal TTS Ativo</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <div>
                <div className="text-[11px] font-semibold text-slate-300">Microsoft & Neurais</div>
                <div className="text-[10px] text-slate-400 font-mono">100% Gratuitas</div>
              </div>
            </div>
          </div>

          {/* Engine Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Selecione a Engine Ativa no Estado Global
              </label>
              <span className="text-[11px] text-slate-400">
                Determina o motor padrão do estúdio
              </span>
            </div>

            <div className="space-y-2.5">
              {TTS_ENGINES.map((eng) => {
                const isSelected = activeEngine === eng.id;
                const isTesting = testingEngine === eng.id;

                return (
                  <div
                    key={eng.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Radio & Info */}
                      <div
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => onSelectEngine(eng.id)}
                      >
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-500'
                                : 'border-slate-600 bg-slate-900'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {eng.label}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${eng.badgeClass}`}>
                              {eng.badgeLabel}
                            </span>
                            {eng.freeTier && (
                              <span className="text-[10px] text-emerald-400 font-medium">
                                Cota Livre
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {eng.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* 5s Test Preview */}
                        <button
                          type="button"
                          onClick={() => handleTestEngine(eng.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isTesting
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                          title="Ouvir teste de voz de 5 segundos nesta engine"
                        >
                          {isTesting ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                              <span>{previewCountdown}s</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                              <span>Testar Voz</span>
                            </>
                          )}
                        </button>

                        {/* Select Engine Button */}
                        {!isSelected ? (
                          <button
                            type="button"
                            onClick={() => onSelectEngine(eng.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm"
                          >
                            Ativar
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>Ativa</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action: Apply to all speakers */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                Aplicar Engine Ativa em Todos os 5 Locutores
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Reconfigura automaticamente os 5 speakers com vozes variadas da engine{' '}
                <strong className="text-indigo-300 font-semibold">
                  {TTS_ENGINES.find((e) => e.id === activeEngine)?.label}
                </strong>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyAll}
              disabled={justAppliedToAll}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm ${
                justAppliedToAll
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
              }`}
            >
              {justAppliedToAll ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicado nos 5 Speakers!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Aplicar em Todos</span>
                </>
              )}
            </button>
          </div>

          {/* Auto-Fallback Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Alternância Automática de Contingência (Fallback de Cota)
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Se a cota do Gemini (HTTP 429) for atingida ou falhar, o estúdio sintetiza automaticamente usando as vozes gratuitas do Puter.js / Edge sem interromper o fluxo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleAutoFallback(!autoFallbackOnQuota)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoFallbackOnQuota ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              role="switch"
              aria-checked={autoFallbackOnQuota}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoFallbackOnQuota ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Engine Ativa: <span className="font-semibold text-white">{TTS_ENGINES.find((e) => e.id === activeEngine)?.badgeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
