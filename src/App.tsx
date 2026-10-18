import React from 'react';
import {
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Settings2,
  Wand2,
  AlertCircle,
  Cpu,
  Bot
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { LanguageSelector } from './components/LanguageSelector';
import { RegionalAccentsBar } from './components/RegionalAccentsBar';
import { VoiceStyleTagsBar } from './components/VoiceStyleTagsBar';
import { SpeakerManager } from './components/SpeakerManager';
import { SceneContextInput } from './components/SceneContextInput';
import { ScriptEditor } from './components/ScriptEditor';
import { ProgressBar } from './components/ProgressBar';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceEngineSettingsModal } from './components/VoiceEngineSettingsModal';

import {
  SpeakerConfig,
  ConversionState,
  SegmentTiming,
  VoiceEngineId,
  VoiceProvider,
  SpeechSegment
} from './types/tts';
import {
  INITIAL_SPEAKERS,
  SPEAKER_COLORS,
  PRESET_SCENES,
  ALL_VOICE_PROFILES
} from './constants/ttsData';
import { parseScriptToSegments } from './utils/ttsParser';
import {
  TTS_ENGINES,
  normalizeProvider,
  getDefaultVoiceForEngine,
  isPuterAvailable,
  synthesizeSpeechSegment
} from './utils/voiceGateway';
import { audioBufferToWavBlob, concatenateAudioBuffers } from './utils/audioEngine';

export default function App() {
  // App State
  const [selectedLanguage, setSelectedLanguage] = React.useState('pt-BR');
  const [speakers, setSpeakers] = React.useState<SpeakerConfig[]>(INITIAL_SPEAKERS);
  const [activeSpeakerId, setActiveSpeakerId] = React.useState(1);
  const [sceneContext, setSceneContext] = React.useState(
    'Estúdio de podcast profissional com diálogo dinâmico e amigável entre dois amigos.'
  );

  // Global Engine & Settings Modal
  const [globalEngine, setGlobalEngine] = React.useState<VoiceEngineId>('gemini');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [autoFallbackOnQuota, setAutoFallbackOnQuota] = React.useState(true);

  // Script text in format [Speaker 1 - Nome]: texto
  const [rawScript, setRawScript] = React.useState(PRESET_SCENES[0].text);

  // Global sliders
  const [globalSpeed, setGlobalSpeed] = React.useState(1.0);
  const [globalPitch, setGlobalPitch] = React.useState(0);

  // System Health / Gemini API Key state
  const [hasApiKey, setHasApiKey] = React.useState(true);

  // Conversion State
  const [conversionState, setConversionState] = React.useState<ConversionState>({
    status: 'aguardando',
    progress: 0,
    message: 'Pronto para converter. Clique em "Gerar Áudio do Roteiro" para iniciar.'
  });

  // Active playing speaker
  const [currentlyPlayingSpeakerId, setCurrentlyPlayingSpeakerId] = React.useState<number | undefined>();

  // Fetch health check on mount
  React.useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey);
      })
      .catch((err) => {
        console.warn('Health check error:', err);
      });
  }, []);

  // Active speaker config
  const activeSpeaker =
    speakers.find((s) => s.id === activeSpeakerId) || speakers[0];
  const activeColorConfig =
    SPEAKER_COLORS.find((c) => c.id === activeSpeakerId) || SPEAKER_COLORS[0];

  // Update a speaker's settings
  const handleUpdateSpeaker = (id: number, updates: Partial<SpeakerConfig>) => {
    setSpeakers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // Toggle voice style tag on the active speaker
  const handleToggleTag = (tagId: string) => {
    const currentTags = activeSpeaker.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    handleUpdateSpeaker(activeSpeakerId, { tags: newTags });
  };

  // Select regional accent on the active speaker
  const handleSelectAccent = (accentId: string) => {
    handleUpdateSpeaker(activeSpeakerId, { accent: accentId });
  };

  // Insert tag or reaction into the active script
  const handleInsertTagIntoText = (tagString: string) => {
    setRawScript((prev) => {
      return prev + ` ${tagString}`;
    });
  };

  // Append new speaker block in the editor
  const handleAppendSpeakerBlock = (speakerId: number) => {
    const sp = speakers.find((s) => s.id === speakerId) || speakers[0];
    const newBlock = `\n\n[Speaker ${sp.id} - ${sp.name}]: `;
    setRawScript((prev) => prev.trim() + newBlock);
    setActiveSpeakerId(speakerId);
  };

  // Load a preset scene
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SCENES.find((p) => p.id === presetId);
    if (preset) {
      setSceneContext(preset.context);
      setRawScript(preset.text);
      setConversionState({
        status: 'aguardando',
        progress: 0,
        message: `Exemplo "${preset.title}" carregado. Pronto para converter.`
      });
    }
  };

  // Apply chosen engine to all speakers
  const handleApplyEngineToAllSpeakers = (engine: VoiceEngineId) => {
    setGlobalEngine(engine);
    setSpeakers((prev) =>
      prev.map((sp, idx) => {
        const defVoice = getDefaultVoiceForEngine(engine, sp.voiceGender, idx + 1);
        const provKey: VoiceProvider =
          engine === 'openai'
            ? 'puter-openai'
            : engine === 'elevenlabs'
            ? 'puter-elevenlabs'
            : engine;
        return {
          ...sp,
          provider: provKey,
          voiceName: defVoice.name,
          voiceDescription: `${defVoice.providerLabel} - ${defVoice.timbre}`
        };
      })
    );
  };

  // AI Generator state
  const [isGeneratingContext, setIsGeneratingContext] = React.useState(false);
  const [isRandomizingSpeakers, setIsRandomizingSpeakers] = React.useState(false);

  const handleGenerateAiContext = async () => {
    setIsGeneratingContext(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'context' })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setSceneContext(data.result);
      }
    } catch (e) {
      console.warn('AI context error:', e);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const handleRandomizeSpeakers = () => {
    setIsRandomizingSpeakers(true);
    setTimeout(() => {
      const accents = ['carioca', 'paulistano', 'nordestino', 'mineiro', 'baiano', 'gaúcho', 'cearense'];
      const recommendedVoices = ALL_VOICE_PROFILES.filter((v) => v.recommended);
      const shuffledVoices = [...recommendedVoices].sort(() => 0.5 - Math.random());

      const nameGroups = [
        ['Mariana', 'Carlos', 'Rachel', 'Dr. Roberto', 'Narrador'],
        ['Beatriz', 'Lucas', 'Camila', 'Professor Fábio', 'Apresentador'],
        ['Juliana', 'Antônio', 'Vitória', 'Ricardo', 'Locutor']
      ];
      const selectedNames = nameGroups[Math.floor(Math.random() * nameGroups.length)];

      setSpeakers((prev) =>
        prev.map((s, idx) => {
          const v = shuffledVoices[idx % shuffledVoices.length];
          const acc = accents[(idx + Math.floor(Math.random() * accents.length)) % accents.length];
          return {
            ...s,
            name: selectedNames[idx] || s.name,
            voiceName: v.name,
            provider: v.provider,
            voiceGender: v.gender === 'Neutro' ? 'Feminino' : v.gender,
            voiceDescription: `${v.providerLabel} - ${v.timbre}`,
            accent: acc
          };
        })
      );
      setIsRandomizingSpeakers(false);
    }, 350);
  };

  // Multi-Engine Conversion Handler (Client-side Puter.js and Server-Side Gemini/Edge Stream)
  const handleStartConversion = async () => {
    const parsedSegments = parseScriptToSegments(rawScript, speakers);

    if (parsedSegments.length === 0) {
      setConversionState({
        status: 'erro',
        progress: 0,
        message: 'Por favor, digite ao menos uma fala no roteiro.',
        error: 'O roteiro está vazio.'
      });
      return;
    }

    // Check if any segments use Puter.js providers (OpenAI, ElevenLabs, Puter Neural)
    const hasPuterSegments = parsedSegments.some((seg) => {
      const p = normalizeProvider(seg.provider);
      return p === 'openai' || p === 'elevenlabs' || p === 'puter-neural';
    });

    // If Puter.js is loaded in browser and segments use Puter providers, execute synthesis
    if (hasPuterSegments && isPuterAvailable()) {
      try {
        setConversionState({
          status: 'convertendo',
          progress: 10,
          message: 'Iniciando síntese vocal multi-engine via Gateway Puter.js...'
        });

        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = AudioCtxClass ? new AudioCtxClass() : null;
        const audioBuffers: AudioBuffer[] = [];
        const segmentsTiming: SegmentTiming[] = [];
        let currentTimestamp = 0;

        for (let i = 0; i < parsedSegments.length; i++) {
          const seg = parsedSegments[i];
          const pct = Math.round(15 + ((i + 0.5) / parsedSegments.length) * 75);
          const normProv = normalizeProvider(seg.provider);

          setConversionState({
            status: 'convertendo',
            progress: pct,
            message: `Sintetizando fala ${i + 1}/${parsedSegments.length} com ${normProv.toUpperCase()} - ${seg.speakerName}...`
          });

          const synthRes = await synthesizeSpeechSegment(seg, selectedLanguage);

          let duration = synthRes.duration || 2.5;

          if (audioCtx && synthRes.arrayBuffer) {
            try {
              const decoded = await audioCtx.decodeAudioData(synthRes.arrayBuffer.slice(0));
              audioBuffers.push(decoded);
              duration = decoded.duration;
            } catch (decErr) {
              console.warn('Audio decode notice, using fallback duration:', decErr);
            }
          }

          segmentsTiming.push({
            speakerId: seg.speakerId,
            speakerName: seg.speakerName,
            text: seg.text,
            startTime: currentTimestamp,
            duration,
            voiceName: seg.voiceName || 'Default'
          });

          currentTimestamp += duration + 0.25;
        }

        let finalAudioUrl: string;

        if (audioCtx && audioBuffers.length > 0) {
          const concatenated = concatenateAudioBuffers(audioCtx, audioBuffers, 0.25);
          const wavBlob = audioBufferToWavBlob(concatenated);
          finalAudioUrl = URL.createObjectURL(wavBlob);
        } else {
          // Single or first audio URL fallback
          const firstAudio = await synthesizeSpeechSegment(parsedSegments[0], selectedLanguage);
          finalAudioUrl = firstAudio.audioUrl;
        }

        const modelUsed = parsedSegments
          .map((s) => normalizeProvider(s.provider).toUpperCase())
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .join(' + ');

        setConversionState({
          status: 'concluído',
          progress: 100,
          message: 'Áudio sintetizado com sucesso via Gateway Puter.js!',
          audioUrl: finalAudioUrl,
          duration: currentTimestamp,
          segmentsTiming,
          modelUsed: `Gateway Puter.js (${modelUsed})`
        });
        return;
      } catch (puterConversionErr: any) {
        console.warn('Puter client conversion failed, falling back to server stream:', puterConversionErr);
      }
    }

    // Server-Sent Events (SSE) Stream fallback or native Gemini TTS
    setConversionState({
      status: 'aguardando',
      progress: 5,
      message: 'Conectando ao estúdio vocal Gemini 3.8 Flash TTS...'
    });

    try {
      const response = await fetch('/api/tts/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneContext,
          language: selectedLanguage,
          segments: parsedSegments,
          globalSpeed,
          globalPitch
        })
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Falha ao abrir stream de conversão.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.replace('data: ', ''));

              if (eventData.type === 'status') {
                setConversionState({
                  status: eventData.status,
                  progress: eventData.progress ?? 0,
                  message: eventData.message || '',
                  error: eventData.error,
                  audioUrl: eventData.audio || undefined,
                  duration: eventData.duration,
                  segmentsTiming: eventData.segmentsTiming,
                  modelUsed: eventData.modelUsed
                });
              }
            } catch (parseError) {
              console.error('Error parsing SSE line:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('TTS Conversion error:', err);
      setConversionState({
        status: 'erro',
        progress: 0,
        message: 'Ocorreu um erro durante a conversão do áudio.',
        error: err.message || 'Falha de comunicação com o servidor de síntese vocal.'
      });
    }
  };

  const activeEngineMeta = TTS_ENGINES.find((e) => e.id === globalEngine) || TTS_ENGINES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onSelectPreset={handleSelectPreset}
        hasApiKey={hasApiKey}
        activeEngine={globalEngine}
        onOpenEngineSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner if demo mode or active engine highlight */}
        {!hasApiKey && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Modo Gateway Livre:</strong> Use as opções do Puter.js (OpenAI TTS e ElevenLabs) ou Microsoft Edge Neural para sintetizar sem restrições de chaves!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-xs font-semibold underline text-amber-300 hover:text-white ml-2 cursor-pointer"
            >
              Abrir Configurações
            </button>
          </div>
        )}

        {/* Top Control Grid: Language & Scene Context */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
            />
          </div>

          <div className="lg:col-span-2">
            <SceneContextInput
              sceneContext={sceneContext}
              onChangeSceneContext={setSceneContext}
              onGenerateAiContext={handleGenerateAiContext}
              isGeneratingAiContext={isGeneratingContext}
            />
          </div>
        </div>

        {/* Regional Brazilian Accents Bar (Displayed when pt-BR is selected) */}
        {selectedLanguage === 'pt-BR' && (
          <RegionalAccentsBar
            currentAccent={activeSpeaker.accent}
            activeSpeakerName={activeSpeaker.name}
            activeSpeakerColor={activeColorConfig.primary}
            onSelectAccent={handleSelectAccent}
            onInsertTagIntoText={handleInsertTagIntoText}
          />
        )}

        {/* Voice Style & Characteristic Tags */}
        <VoiceStyleTagsBar
          activeSpeakerName={activeSpeaker.name}
          activeSpeakerColor={activeColorConfig.primary}
          selectedTags={activeSpeaker.tags || []}
          onToggleTag={handleToggleTag}
          onInsertTagIntoText={handleInsertTagIntoText}
        />

        {/* Speaker Manager (Up to 5 speakers with colors and sliders, header provider switcher) */}
        <SpeakerManager
          speakers={speakers}
          activeSpeakerId={activeSpeakerId}
          onSelectActiveSpeaker={setActiveSpeakerId}
          onUpdateSpeaker={handleUpdateSpeaker}
          onAppendSpeakerBlock={handleAppendSpeakerBlock}
          onRandomizeSpeakers={handleRandomizeSpeakers}
          isRandomizingSpeakers={isRandomizingSpeakers}
          onOpenEngineSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Script & Dialogue Multi-Speaker Editor */}
        <ScriptEditor
          rawScript={rawScript}
          onChangeRawScript={setRawScript}
          speakers={speakers}
          activeSpeakerId={activeSpeakerId}
          onSelectActiveSpeaker={setActiveSpeakerId}
          currentlyPlayingSpeakerId={currentlyPlayingSpeakerId}
        />

        {/* Action Button & Global Settings Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Active Engine Badge & Modal Opener */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all cursor-pointer group"
              title="Clique para alternar o motor de voz global"
            >
              <Cpu className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Engine Global Ativa
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{activeEngineMeta.badgeLabel}</span>
                  <span className="text-[10px] text-indigo-400 underline font-normal">Alterar</span>
                </div>
              </div>
            </button>

            {/* Global Master Speed */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Velocidade Global:
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={globalSpeed}
                onChange={(e) => setGlobalSpeed(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 min-w-[48px] text-center">
                {globalSpeed.toFixed(2)}x
              </span>
            </div>

            {/* Global Master Pitch */}
            <div className="flex items-center gap-2 sm:pl-4 sm:border-l sm:border-slate-800">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Tom Global:
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={globalPitch}
                onChange={(e) => setGlobalPitch(parseInt(e.target.value, 10))}
                className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 min-w-[48px] text-center">
                {globalPitch > 0 ? `+${globalPitch}` : globalPitch} st
              </span>
            </div>
          </div>

          {/* Big Generate Button */}
          <button
            type="button"
            onClick={handleStartConversion}
            disabled={conversionState.status === 'convertendo'}
            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            <span>
              {conversionState.status === 'convertendo'
                ? 'Sintetizando Áudio...'
                : 'Gerar Áudio do Roteiro'}
            </span>
          </button>
        </div>

        {/* Real-time Animated Progress Bar */}
        <ProgressBar
          status={conversionState.status}
          progress={conversionState.progress}
          message={conversionState.message}
          error={conversionState.error}
          duration={conversionState.duration}
          modelUsed={conversionState.modelUsed}
          onRetry={handleStartConversion}
        />

        {/* Audio Player (Exhibited when audio is generated) */}
        {conversionState.audioUrl && (
          <AudioPlayer
            audioUrl={conversionState.audioUrl}
            segmentsTiming={conversionState.segmentsTiming}
            onCurrentTimeChange={(_, activeSpeakerId) => {
              setCurrentlyPlayingSpeakerId(activeSpeakerId);
            }}
          />
        )}
      </main>

      {/* Voice Engine Settings Modal */}
      <VoiceEngineSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        activeEngine={globalEngine}
        onSelectEngine={(eng) => setGlobalEngine(eng)}
        onApplyEngineToAllSpeakers={handleApplyEngineToAllSpeakers}
        autoFallbackOnQuota={autoFallbackOnQuota}
        onToggleAutoFallback={setAutoFallbackOnQuota}
        speakers={speakers}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          VozGenius AI • Multi-Gateway TTS com Puter.js (OpenAI & ElevenLabs), Gemini 3.8 Flash e Microsoft Edge Neural • Suporte a 5 Locutores e Masterização WAV 24kHz.
        </div>
      </footer>
    </div>
  );
}
