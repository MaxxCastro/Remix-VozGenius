import { VoiceProfile, VoiceProvider, SpeakerConfig, SpeechSegment } from '../types/tts';

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

  // Try Puter.js directly in browser if available and provider is supported
  if (isPuterAvailable()) {
    try {
      if (profile.provider === 'puter-openai') {
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

      if (profile.provider === 'puter-elevenlabs') {
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

      if (profile.provider === 'puter-neural') {
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
      console.warn(`Puter.js synthesis for ${profile.name} failed, falling back to server:`, puterErr);
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
