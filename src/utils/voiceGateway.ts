import { VoiceProfile, VoiceProvider, VoiceEngineId, SpeakerConfig, SpeechSegment } from '../types/tts';
import { ALL_VOICE_PROFILES } from '../constants/ttsData';

declare global {
  interface Window {
    puter?: {
      ai: {
        txt2speech: (
          text: string,
          options?: {
            provider?: string;
            model?: string;
            voice?: string;
            engine?: string;
            language?: string;
          }
        ) => Promise<HTMLAudioElement>;
        chat?: (prompt: string, options?: any) => Promise<any>;
      };
      print?: (...args: any[]) => void;
    };
  }
}

export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.puter?.ai?.txt2speech);
}

export function normalizeProvider(provider?: string): VoiceEngineId {
  if (!provider) return 'gemini';
  if (provider === 'openai' || provider === 'puter-openai') return 'openai';
  if (provider === 'elevenlabs' || provider === 'puter-elevenlabs') return 'elevenlabs';
  if (provider === 'microsoft-edge') return 'microsoft-edge';
  if (provider === 'puter-neural') return 'puter-neural';
  return 'gemini';
}

export interface EngineMeta {
  id: VoiceEngineId;
  label: string;
  badgeLabel: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  highlightColor: string;
  isPuter: boolean;
  freeTier: boolean;
}

export const TTS_ENGINES: EngineMeta[] = [
  {
    id: 'gemini',
    label: 'Google Gemini 3.8 Flash TTS',
    badgeLabel: 'Gemini 3.8',
    description: 'Motor nativo com 5 vozes neurais multimodais, controle refinado de emoção, velocidade e sotaques regionais.',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    borderClass: 'border-indigo-500',
    highlightColor: '#6366f1',
    isPuter: false,
    freeTier: true
  },
  {
    id: 'openai',
    label: 'OpenAI TTS (Puter.js)',
    badgeLabel: 'OpenAI TTS',
    description: 'Vozes estúdio tts-1-hd da OpenAI (Nova, Alloy, Echo, Onyx, Shimmer, Fable) gratuitas via Gateway Puter.js.',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500',
    highlightColor: '#10b981',
    isPuter: true,
    freeTier: true
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs Multilingual (Puter.js)',
    badgeLabel: 'ElevenLabs',
    description: 'Vozes de cinema e audiobooks (Rachel, Adam, Antoni, Bella, Josh) via Gateway Puter.js sem custos.',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderClass: 'border-purple-500',
    highlightColor: '#a855f7',
    isPuter: true,
    freeTier: true
  },
  {
    id: 'microsoft-edge',
    label: 'Microsoft Edge Neural TTS',
    badgeLabel: 'Edge Neural',
    description: 'Vozes neurais brasileiras autênticas do Edge (Francisca, Antonio, Thalita, Fabio, Nicolau) com dicção impecável.',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderClass: 'border-cyan-500',
    highlightColor: '#06b6d4',
    isPuter: false,
    freeTier: true
  },
  {
    id: 'puter-neural',
    label: 'Puter Neural Engine',
    badgeLabel: 'Puter Neural',
    description: 'Motor neural proprietário da nuvem Puter (Camila, Ricardo, Vitória, Joanna, Matthew) de resposta rápida.',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500',
    highlightColor: '#f59e0b',
    isPuter: true,
    freeTier: true
  }
];

export function getDefaultVoiceForEngine(
  engine: VoiceEngineId,
  gender: 'Feminino' | 'Masculino' = 'Feminino',
  speakerIndex = 1
): VoiceProfile {
  const providerKey: VoiceProvider =
    engine === 'openai'
      ? 'puter-openai'
      : engine === 'elevenlabs'
      ? 'puter-elevenlabs'
      : engine;

  const matches = ALL_VOICE_PROFILES.filter((v) => v.provider === providerKey);

  // Filter by gender if possible
  const genderMatches = matches.filter((v) => v.gender === gender);
  const pool = genderMatches.length > 0 ? genderMatches : matches;

  if (pool.length === 0) {
    return ALL_VOICE_PROFILES[0];
  }

  // Pick index-based or first recommended
  const recommended = pool.find((v) => v.recommended);
  return pool[(speakerIndex - 1) % pool.length] || recommended || pool[0];
}

export const SAMPLE_PHRASES: Record<string, string> = {
  // Puter OpenAI
  nova: 'Olá! Eu sou a voz Nova da OpenAI via Puter.js, cheia de energia e expressividade.',
  alloy: 'Olá! Sou a voz Alloy da OpenAI no gateway Puter.js, neutra e versátil para narrações.',
  echo: 'Fala aí! Esta é a voz Echo da OpenAI via Puter.js, calorosa e conversacional.',
  fable: 'Saudações! Esta é a voz Fable da OpenAI, com entonação teatral e narrativa marcante.',
  onyx: 'Atenção. Esta é a voz Onyx da OpenAI via Puter.js, grave, profunda e cinematográfica.',
  shimmer: 'Olá a todos! Esta é a voz Shimmer da OpenAI, suave, clara e reluzente.',

  // Microsoft Edge Neural
  'pt-BR-FranciscaNeural': 'Olá! Esta é a voz Francisca da Microsoft Edge Neural, calorosa e brasileira autêntica.',
  'pt-BR-AntonioNeural': 'Fala aí, pessoal! Voz Antonio da Microsoft Edge Neural, dinâmica para podcast e diálogo.',
  'pt-BR-ThalitaNeural': 'Oi gente! Esta é a voz Thalita da Microsoft Edge Neural, jovem e descontraída.',
  'pt-BR-FabioNeural': 'Olá. Esta é a voz Fabio da Microsoft Edge Neural, estilo narrador clássico.',
  'pt-BR-NicolauNeural': 'E aí, tudo bem? Voz Nicolau da Microsoft Edge Neural, descontraída e informal.',
  'pt-BR-BrendaNeural': 'Olá! Voz Brenda da Microsoft Edge Neural, com muita expressividade e alegria.',
  'pt-BR-ValerioNeural': 'Olá. Esta é a voz Valerio da Microsoft Edge Neural, formal e corporativa.',
  'pt-PT-RaquelNeural': 'Olá! Esta é a voz Raquel em português europeu da Microsoft Edge.',
  'en-US-JennyNeural': 'Hello! This is Jenny from Microsoft Edge Neural, natural and fluent.',
  'en-US-GuyNeural': 'Hey there! This is Guy from Microsoft Edge Neural, dynamic and clear.',

  // Puter ElevenLabs
  Rachel: 'Olá! Esta é a voz Rachel da ElevenLabs no Puter.js, calma e com acabamento de estúdio.',
  Adam: 'Atenção. Sou a voz Adam da ElevenLabs no Puter.js, profunda e ressonante.',
  Antoni: 'Olá! Esta é a voz Antoni da ElevenLabs no gateway Puter.js, versátil e empática.',
  Bella: 'Oi! Sou a voz Bella da ElevenLabs no Puter.js, doce e envolvente para histórias.',
  Josh: 'Fala aí! Aqui é a voz Josh da ElevenLabs no Puter.js, jovem e comercial.',

  // Puter Neural
  Camila: 'Olá! Sou a Camila, voz neural brasileira de alta fidelidade no Puter Engine.',
  Ricardo: 'Olá a todos! Sou o Ricardo, voz neural masculina brasileira no Puter Engine.',
  Vitoria: 'Olá! Sou a Vitória, voz neural suave e acolhedora no Puter Engine.',
  Joanna: 'Hello! I am Joanna, a natural neural voice on the Puter AI Gateway.',
  Matthew: 'Hello there! I am Matthew, a conversational neural voice on Puter.',

  // Gemini
  Kore: 'Olá! Esta é uma demonstração da voz Kore no Gemini 3.8 Flash TTS.',
  Puck: 'Fala aí! Esta é uma demonstração da voz Puck, jovem e dinâmica no Gemini TTS.',
  Charon: 'Olá. Esta é uma demonstração da voz Charon, grave e respeitável no Gemini TTS.',
  Fenrir: 'Atenção. Esta é uma demonstração da voz Fenrir, profunda e imponente no Gemini TTS.',
  Zephyr: 'Olá! Esta é uma demonstração da voz Zephyr, suave e amigável no Gemini TTS.'
};

/**
 * Generate preview audio using Puter.js or Server fallback
 */
export async function generateVoicePreviewAudio(
  profile: VoiceProfile,
  customText?: string
): Promise<{
  audioElement?: HTMLAudioElement;
  audioUrl?: string;
  duration: number;
  play: () => Promise<void>;
  stop: () => void;
}> {
  const phrase = customText || SAMPLE_PHRASES[profile.name] || `Demonstração da voz ${profile.name} no estúdio neural.`;
  const normalized = normalizeProvider(profile.provider);

  // Try Puter.js directly in browser if available and provider is supported
  if (isPuterAvailable()) {
    try {
      if (normalized === 'openai') {
        const audio = await window.puter!.ai.txt2speech(phrase, {
          provider: 'openai',
          model: profile.model || 'tts-1-hd',
          voice: profile.name
        });
        return {
          audioElement: audio,
          audioUrl: audio.src,
          duration: 5.0,
          play: async () => {
            await audio.play();
          },
          stop: () => {
            audio.pause();
            audio.currentTime = 0;
          }
        };
      }

      if (normalized === 'elevenlabs') {
        const audio = await window.puter!.ai.txt2speech(phrase, {
          provider: 'elevenlabs',
          model: profile.model || 'eleven_multilingual_v2',
          voice: profile.name
        });
        return {
          audioElement: audio,
          audioUrl: audio.src,
          duration: 5.0,
          play: async () => {
            await audio.play();
          },
          stop: () => {
            audio.pause();
            audio.currentTime = 0;
          }
        };
      }

      if (normalized === 'puter-neural') {
        const audio = await window.puter!.ai.txt2speech(phrase, {
          engine: 'neural',
          voice: profile.name
        });
        return {
          audioElement: audio,
          audioUrl: audio.src,
          duration: 5.0,
          play: async () => {
            await audio.play();
          },
          stop: () => {
            audio.pause();
            audio.currentTime = 0;
          }
        };
      }
    } catch (puterErr) {
      console.warn(`Puter.js synthesis for ${profile.name} failed, falling back:`, puterErr);
    }
  }

  // Server endpoint or Server Fallback
  try {
    const res = await fetch(`/api/tts/preview?voice=${encodeURIComponent(profile.name)}&provider=${profile.provider}`);
    const data = await res.json();
    if (data.success && data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      return {
        audioElement: audio,
        audioUrl: data.audioUrl,
        duration: data.duration || 5.0,
        play: async () => {
          await audio.play();
        },
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  } catch (serverErr) {
    console.warn(`Server preview error for ${profile.name}:`, serverErr);
  }

  // Web Speech API fallback
  return new Promise((resolve) => {
    let synthUtterance: SpeechSynthesisUtterance | null = null;
    resolve({
      duration: 5.0,
      play: async () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          synthUtterance = new SpeechSynthesisUtterance(phrase);
          synthUtterance.lang = profile.lang || 'pt-BR';
          if (profile.gender === 'Masculino') {
            synthUtterance.pitch = 0.8;
          } else {
            synthUtterance.pitch = 1.1;
          }
          window.speechSynthesis.speak(synthUtterance);
        }
      },
      stop: () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
    });
  });
}

/**
 * Synthesizes a speech segment using the segment's specific provider engine.
 */
export async function synthesizeSpeechSegment(
  segment: SpeechSegment,
  language = 'pt-BR'
): Promise<{
  audioElement?: HTMLAudioElement;
  audioUrl: string;
  duration: number;
  arrayBuffer?: ArrayBuffer;
}> {
  const normalized = normalizeProvider(segment.provider);
  const text = segment.text.trim();

  // If Puter.js is available and engine is OpenAI, ElevenLabs, or Puter Neural
  if (isPuterAvailable() && (normalized === 'openai' || normalized === 'elevenlabs' || normalized === 'puter-neural')) {
    try {
      let audio: HTMLAudioElement;
      if (normalized === 'openai') {
        audio = await window.puter!.ai.txt2speech(text, {
          provider: 'openai',
          model: 'tts-1-hd',
          voice: segment.voiceName || 'nova'
        });
      } else if (normalized === 'elevenlabs') {
        audio = await window.puter!.ai.txt2speech(text, {
          provider: 'elevenlabs',
          model: 'eleven_multilingual_v2',
          voice: segment.voiceName || 'Rachel'
        });
      } else {
        audio = await window.puter!.ai.txt2speech(text, {
          engine: 'neural',
          voice: segment.voiceName || 'Camila'
        });
      }

      if (audio && audio.src) {
        // Fetch arrayBuffer for audio concatenation if needed
        let arrayBuffer: ArrayBuffer | undefined;
        try {
          const resp = await fetch(audio.src);
          arrayBuffer = await resp.arrayBuffer();
        } catch {
          // Cross-origin audio element can still play
        }
        const estDuration = Math.max(1.5, text.length * 0.075);
        return {
          audioElement: audio,
          audioUrl: audio.src,
          duration: estDuration,
          arrayBuffer
        };
      }
    } catch (puterErr) {
      console.warn(`Puter segment synthesis failed for [${segment.speakerName}]:`, puterErr);
    }
  }

  // Fallback to server preview/speech synthesis
  const previewRes = await fetch(
    `/api/tts/preview?voice=${encodeURIComponent(segment.voiceName || 'Kore')}&provider=${segment.provider || 'gemini'}`
  );
  const data = await previewRes.json();
  if (data.success && data.audioUrl) {
    return {
      audioUrl: data.audioUrl,
      duration: data.duration || Math.max(1.5, text.length * 0.075)
    };
  }

  throw new Error(`Não foi possível sintetizar a fala para ${segment.speakerName}`);
}
