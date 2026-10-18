export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface SpeakerColorConfig {
  id: number;
  label: string;
  colorKey: string;
  primary: string;
  secondary: string;
  text: string;
  bg: string;
  border: string;
  borderActive: string;
  badge: string;
  ring: string;
}

export interface SpeakerConfig {
  id: number; // 1 to 5
  name: string;
  voiceName: GeminiVoiceName;
  voiceGender: 'Feminino' | 'Masculino';
  voiceDescription: string;
  accent: string;
  tags: string[];
  speed: number; // 0.5 to 2.0
  pitch: number; // -10 to 10
}

export interface SpeechSegment {
  id: string;
  speakerId: number;
  speakerName: string;
  text: string;
  tags: string[];
  accent?: string;
  speed?: number;
  pitch?: number;
}

export type ConversionStatus = 'aguardando' | 'convertendo' | 'concluído' | 'erro';

export interface SegmentTiming {
  speakerId: number;
  speakerName: string;
  text: string;
  startTime: number;
  duration: number;
  voiceName: string;
}

export interface ConversionState {
  status: ConversionStatus;
  progress: number; // 0 - 100
  message: string;
  currentSegment?: number;
  totalSegments?: number;
  error?: string;
  audioUrl?: string;
  duration?: number;
  segmentsTiming?: SegmentTiming[];
  modelUsed?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  hasRegionalAccents?: boolean;
}

export interface RegionalAccent {
  id: string;
  label: string;
  region: string;
  description: string;
}

export interface VoiceStyleTag {
  id: string;
  label: string;
  category: 'emocao' | 'ritmo' | 'tom' | 'estilo';
  description: string;
}
