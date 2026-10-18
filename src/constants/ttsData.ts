import type {
  LanguageOption,
  RegionalAccent,
  VoiceStyleTag,
  SpeakerColorConfig,
  SpeakerConfig,
  VoiceProfile,
  VoiceProvider
} from '../types/tts.ts';

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    nativeName: 'Português Brasileiro',
    flag: '🇧🇷',
    hasRegionalAccents: true
  },
  {
    code: 'en-US',
    name: 'Inglês (Estados Unidos)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    hasRegionalAccents: false
  },
  {
    code: 'es-ES',
    name: 'Espanhol (América Latina / Espanha)',
    nativeName: 'Español',
    flag: '🇪🇸',
    hasRegionalAccents: false
  },
  {
    code: 'en-GB',
    name: 'Inglês (Reino Unido)',
    nativeName: 'English (UK)',
    flag: '🇬🇧',
    hasRegionalAccents: false
  },
  {
    code: 'fr-FR',
    name: 'Francês (França)',
    nativeName: 'Français',
    flag: '🇫🇷',
    hasRegionalAccents: false
  },
  {
    code: 'de-DE',
    name: 'Alemão (Alemanha)',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    hasRegionalAccents: false
  },
  {
    code: 'it-IT',
    name: 'Italiano (Itália)',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    hasRegionalAccents: false
  },
  {
    code: 'ja-JP',
    name: 'Japonês (Japão)',
    nativeName: '日本語',
    flag: '🇯🇵',
    hasRegionalAccents: false
  }
];

export const BRAZILIAN_ACCENTS: RegionalAccent[] = [
  {
    id: 'carioca',
    label: 'Carioca',
    region: 'Rio de Janeiro',
    description: 'Chiado característico nos "s", ritmo descontraído e entonação musical fluminense.'
  },
  {
    id: 'paulistano',
    label: 'Paulistano',
    region: 'São Paulo',
    description: 'Ritmo rápido, "r" suave, influências italianas e cadência urbana metropolitana.'
  },
  {
    id: 'nordestino',
    label: 'Nordestino',
    region: 'Região Nordeste',
    description: 'Vogais bem abertas, cadência melódica vibrante e ritmo expressivo.'
  },
  {
    id: 'baiano',
    label: 'Baiano',
    region: 'Bahia',
    description: 'Fala prolongada, calorosa, ritmo relaxado e entonação cantada acolhedora.'
  },
  {
    id: 'pernambucano',
    label: 'Pernambucano',
    region: 'Pernambuco',
    description: 'Consoantes firmes, "ti" e "di" marcados, cadência viva e expressiva.'
  },
  {
    id: 'cearense',
    label: 'Cearense',
    region: 'Ceará',
    description: 'Ritmo veloz, melodioso, vogais curtas e entonação espirituosa inconfundível.'
  },
  {
    id: 'gaúcho',
    label: 'Gaúcho',
    region: 'Rio Grande do Sul',
    description: 'Ritmo marcado, "tu" com conjugações sulistas, vogais fechadas e firmeza campeira.'
  },
  {
    id: 'mineiro',
    label: 'Mineiro',
    region: 'Minas Gerais',
    description: 'Fala mansa, palavras unidas ("uai", "trem"), cadência suave e acolhedora.'
  },
  {
    id: 'paranaense',
    label: 'Paranaense',
    region: 'Paraná',
    description: '"E" e "o" fechados, entonação sulista distinta com ritmo pausado e firme.'
  },
  {
    id: 'nortista',
    label: 'Nortista',
    region: 'Região Norte / Amazônia',
    description: 'Cadência amazônica serena, ritmo suave e influências indígenas harmoniosas.'
  },
  {
    id: 'catarinense',
    label: 'Catarinense',
    region: 'Santa Catarina',
    description: 'Influência açoriana e do litoral sulista, entonação cantada e alegre.'
  },
  {
    id: 'goiano',
    label: 'Goiano / Centro-Oeste',
    region: 'Goiás / Mato Grosso',
    description: 'Sotaque do interior com "r" retroflexo sertanejo amigável e simpático.'
  }
];

export const VOICE_STYLE_TAGS: VoiceStyleTag[] = [
  // Required in prompt
  { id: 'brava', label: 'brava', category: 'emocao', description: 'Tom enérgico, ríspido e irritado' },
  { id: 'alegre', label: 'alegre', category: 'emocao', description: 'Tom radiante, sorridente e animado' },
  { id: 'calma', label: 'calma', category: 'tom', description: 'Voz relaxante, equilibrada e suave' },
  { id: 'confiante', label: 'confiante', category: 'tom', description: 'Postura firme, segura e convincente' },
  { id: 'pausada', label: 'pausada', category: 'ritmo', description: 'Cadência compassada e bem articulada' },
  { id: 'animada', label: 'animada', category: 'emocao', description: 'Alta vibração, entusiasmo e vivacidade' },

  // Useful extended options
  { id: 'sussurrada', label: 'sussurrada', category: 'estilo', description: 'Voz baixa, intimista e conspiratória' },
  { id: 'entusiasmada', label: 'entusiasmada', category: 'emocao', description: 'Empolgação contagiante e brilhante' },
  { id: 'misteriosa', label: 'misteriosa', category: 'estilo', description: 'Clima enigmático, tenso e investigativo' },
  { id: 'triste', label: 'triste', category: 'emocao', description: 'Melancólica, pesarosa e comovente' },
  { id: 'autoritária', label: 'autoritária', category: 'tom', description: 'Voz de comando, firme e decisiva' },
  { id: 'irônica', label: 'irônica', category: 'tom', description: 'Sarcasmo sutil e desdém bem-humorado' },
  { id: 'carinhosa', label: 'carinhosa', category: 'emocao', description: 'Afetuosa, doce e acolhedora' },
  { id: 'apressada', label: 'apressada', category: 'ritmo', description: 'Ritmo rápido, urgente e dinâmico' },
  { id: 'dramática', label: 'dramática', category: 'estilo', description: 'Carga dramática teatral e profunda' },
  { id: 'conversacional', label: 'conversacional', category: 'estilo', description: 'Diálogo natural entre amigos' },
  { id: 'narrador épico', label: 'narrador épico', category: 'estilo', description: 'Narração cinematográfica imponente' },
  { id: 'jornalística', label: 'jornalística', category: 'estilo', description: 'Dicção clara de âncora de notícias' }
];

export const VOCAL_BURSTS = [
  { tag: '<laugh>', label: 'Risada <laugh>', desc: 'Insere risada natural' },
  { tag: '<gasp>', label: 'Ofego <gasp>', desc: 'Insere suspiro de surpresa' },
  { tag: '<breath>', label: 'Respiração <breath>', desc: 'Pausa para respirar' },
  { tag: '|yeah|', label: 'Apoio |yeah|', desc: 'Interjeição de concordância' },
  { tag: '|mhm|', label: 'Apoio |mhm|', desc: 'Murmúrio afirmativo' }
];

export const SPEAKER_COLORS: SpeakerColorConfig[] = [
  {
    id: 1,
    label: 'Speaker 1',
    colorKey: 'indigo',
    primary: '#6366f1',
    secondary: '#818cf8',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    borderActive: 'border-indigo-500',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    ring: 'ring-indigo-500'
  },
  {
    id: 2,
    label: 'Speaker 2',
    colorKey: 'emerald',
    primary: '#10b981',
    secondary: '#34d399',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    ring: 'ring-emerald-500'
  },
  {
    id: 3,
    label: 'Speaker 3',
    colorKey: 'amber',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-500',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ring: 'ring-amber-500'
  },
  {
    id: 4,
    label: 'Speaker 4',
    colorKey: 'rose',
    primary: '#f43f5e',
    secondary: '#fb7185',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    borderActive: 'border-rose-500',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    ring: 'ring-rose-500'
  },
  {
    id: 5,
    label: 'Speaker 5',
    colorKey: 'cyan',
    primary: '#06b6d4',
    secondary: '#22d3ee',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    borderActive: 'border-cyan-500',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    ring: 'ring-cyan-500'
  }
];

export const ALL_VOICE_PROFILES: VoiceProfile[] = [
  // --- PUTER.JS GATEWAY: OPENAI TTS ---
  {
    id: 'openai-nova',
    name: 'nova',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Feminino',
    timbre: 'Expressiva, dinâmica, alegre e envolvente para podcasts e diálogos.',
    model: 'tts-1-hd',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'openai-alloy',
    name: 'alloy',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Neutro',
    timbre: 'Neutra, balanceada, versátil e de alta clareza vocal.',
    model: 'tts-1-hd',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'openai-echo',
    name: 'echo',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Masculino',
    timbre: 'Masculina suave, confiante, acolhedora e natural.',
    model: 'tts-1-hd',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'openai-fable',
    name: 'fable',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Masculino',
    timbre: 'Narrativa teatral, cadência expressiva e sotaque marcante.',
    model: 'tts-1-hd',
    lang: 'pt-BR'
  },
  {
    id: 'openai-onyx',
    name: 'onyx',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Masculino',
    timbre: 'Grave, profunda, autoritária e cinematográfica.',
    model: 'tts-1-hd',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'openai-shimmer',
    name: 'shimmer',
    provider: 'puter-openai',
    providerLabel: 'OpenAI TTS (Puter.js)',
    gender: 'Feminino',
    timbre: 'Clara, melodiosa, doce e brilhante.',
    model: 'tts-1-hd',
    lang: 'pt-BR'
  },

  // --- MICROSOFT EDGE NEURAL TTS ---
  {
    id: 'edge-francisca',
    name: 'pt-BR-FranciscaNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Feminino',
    timbre: 'Brasileira autêntica, calorosa, expressiva e natural em português.',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'edge-antonio',
    name: 'pt-BR-AntonioNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Masculino',
    timbre: 'Brasileiro dinâmico, moderno, excelente para podcast e notícias.',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'edge-thalita',
    name: 'pt-BR-ThalitaNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Feminino',
    timbre: 'Jovem, descontraída, estilo redes sociais e conversação rápida.',
    lang: 'pt-BR'
  },
  {
    id: 'edge-fabio',
    name: 'pt-BR-FabioNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Masculino',
    timbre: 'Narrador clássico, firme, dicção precisa para documentários.',
    lang: 'pt-BR'
  },
  {
    id: 'edge-nicolau',
    name: 'pt-BR-NicolauNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Masculino',
    timbre: 'Informal, amigável, excelente para conversas cotidianas.',
    lang: 'pt-BR'
  },
  {
    id: 'edge-brenda',
    name: 'pt-BR-BrendaNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Feminino',
    timbre: 'Vibrante, expressiva, calor humano e ritmo cativante.',
    lang: 'pt-BR'
  },
  {
    id: 'edge-valerio',
    name: 'pt-BR-ValerioNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Masculino',
    timbre: 'Corporativo, seguro, profissional e sóbrio.',
    lang: 'pt-BR'
  },
  {
    id: 'edge-raquel',
    name: 'pt-PT-RaquelNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Feminino',
    timbre: 'Português europeu de Portugal, suave e elegante.',
    lang: 'pt-PT'
  },
  {
    id: 'edge-jenny',
    name: 'en-US-JennyNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Feminino',
    timbre: 'Inglês americano nativo, entonação natural e fluida.',
    lang: 'en-US'
  },
  {
    id: 'edge-guy',
    name: 'en-US-GuyNeural',
    provider: 'microsoft-edge',
    providerLabel: 'Microsoft Edge Neural',
    gender: 'Masculino',
    timbre: 'Inglês americano conversacional e dinâmico.',
    lang: 'en-US'
  },

  // --- PUTER.JS GATEWAY: ELEVENLABS MULTILINGUAL ---
  {
    id: 'eleven-rachel',
    name: 'Rachel',
    provider: 'puter-elevenlabs',
    providerLabel: 'ElevenLabs (Puter.js)',
    gender: 'Feminino',
    timbre: 'Calma, profissional, dicção cinematográfica e refinada.',
    model: 'eleven_multilingual_v2',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'eleven-adam',
    name: 'Adam',
    provider: 'puter-elevenlabs',
    providerLabel: 'ElevenLabs (Puter.js)',
    gender: 'Masculino',
    timbre: 'Narrador profundo, ressonante, ideal para trailers e audiobooks.',
    model: 'eleven_multilingual_v2',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'eleven-antoni',
    name: 'Antoni',
    provider: 'puter-elevenlabs',
    providerLabel: 'ElevenLabs (Puter.js)',
    gender: 'Masculino',
    timbre: 'Versátil, modulado, expressivo e empático.',
    model: 'eleven_multilingual_v2',
    lang: 'pt-BR'
  },
  {
    id: 'eleven-bella',
    name: 'Bella',
    provider: 'puter-elevenlabs',
    providerLabel: 'ElevenLabs (Puter.js)',
    gender: 'Feminino',
    timbre: 'Jovem, doce, expressiva e dramática.',
    model: 'eleven_multilingual_v2',
    lang: 'pt-BR'
  },
  {
    id: 'eleven-josh',
    name: 'Josh',
    provider: 'puter-elevenlabs',
    providerLabel: 'ElevenLabs (Puter.js)',
    gender: 'Masculino',
    timbre: 'Confiante, comercial, jovem e seguro.',
    model: 'eleven_multilingual_v2',
    lang: 'pt-BR'
  },

  // --- PUTER.JS: NEURAL ENGINE ---
  {
    id: 'puter-camila',
    name: 'Camila',
    provider: 'puter-neural',
    providerLabel: 'Puter Neural Engine',
    gender: 'Feminino',
    timbre: 'Voz neural brasileira natural, fluida e clara.',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'puter-ricardo',
    name: 'Ricardo',
    provider: 'puter-neural',
    providerLabel: 'Puter Neural Engine',
    gender: 'Masculino',
    timbre: 'Voz neural masculina brasileira, ritmo firme e comunicativo.',
    lang: 'pt-BR'
  },
  {
    id: 'puter-vitoria',
    name: 'Vitoria',
    provider: 'puter-neural',
    providerLabel: 'Puter Neural Engine',
    gender: 'Feminino',
    timbre: 'Voz neural suave, tom afetuoso e acolhedor.',
    lang: 'pt-BR'
  },
  {
    id: 'puter-joanna',
    name: 'Joanna',
    provider: 'puter-neural',
    providerLabel: 'Puter Neural Engine',
    gender: 'Feminino',
    timbre: 'Voz neural americana clássica de alta fidelidade.',
    lang: 'en-US'
  },
  {
    id: 'puter-matthew',
    name: 'Matthew',
    provider: 'puter-neural',
    providerLabel: 'Puter Neural Engine',
    gender: 'Masculino',
    timbre: 'Voz neural masculina conversacional e natural.',
    lang: 'en-US'
  },

  // --- GOOGLE GEMINI 3.8 FLASH TTS ---
  {
    id: 'gemini-kore',
    name: 'Kore',
    provider: 'gemini',
    providerLabel: 'Gemini 3.8 Flash TTS',
    gender: 'Feminino',
    timbre: 'Voz feminina clara, expressiva e envolvente no Gemini TTS.',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'gemini-puck',
    name: 'Puck',
    provider: 'gemini',
    providerLabel: 'Gemini 3.8 Flash TTS',
    gender: 'Masculino',
    timbre: 'Voz masculina jovem, enérgica, versátil e dinâmica.',
    lang: 'pt-BR',
    recommended: true
  },
  {
    id: 'gemini-charon',
    name: 'Charon',
    provider: 'gemini',
    providerLabel: 'Gemini 3.8 Flash TTS',
    gender: 'Masculino',
    timbre: 'Voz masculina grave, serena, madura e respeitável.',
    lang: 'pt-BR'
  },
  {
    id: 'gemini-fenrir',
    name: 'Fenrir',
    provider: 'gemini',
    providerLabel: 'Gemini 3.8 Flash TTS',
    gender: 'Masculino',
    timbre: 'Voz masculina profunda, autoritária e épica.',
    lang: 'pt-BR'
  },
  {
    id: 'gemini-zephyr',
    name: 'Zephyr',
    provider: 'gemini',
    providerLabel: 'Gemini 3.8 Flash TTS',
    gender: 'Feminino',
    timbre: 'Voz feminina suave, calma, doce e amigável.',
    lang: 'pt-BR'
  }
];

export const INITIAL_SPEAKERS: SpeakerConfig[] = [
  {
    id: 1,
    name: 'Mariana',
    voiceName: 'nova',
    provider: 'puter-openai',
    voiceGender: 'Feminino',
    voiceDescription: 'OpenAI TTS (via Puter.js) - Expressiva e animada.',
    accent: 'carioca',
    tags: ['animada', 'confiante'],
    speed: 1.0,
    pitch: 0
  },
  {
    id: 2,
    name: 'Carlos',
    voiceName: 'pt-BR-AntonioNeural',
    provider: 'microsoft-edge',
    voiceGender: 'Masculino',
    voiceDescription: 'Microsoft Edge Neural - Brasileiro dinâmico para podcast.',
    accent: 'paulistano',
    tags: ['animada'],
    speed: 1.0,
    pitch: 0
  },
  {
    id: 3,
    name: 'Rachel',
    voiceName: 'Rachel',
    provider: 'puter-elevenlabs',
    voiceGender: 'Feminino',
    voiceDescription: 'ElevenLabs Multilingual v2 (via Puter.js) - Serena e cinematográfica.',
    accent: 'nordestino',
    tags: ['calma'],
    speed: 1.0,
    pitch: 0
  },
  {
    id: 4,
    name: 'Dr. Roberto',
    voiceName: 'pt-BR-FranciscaNeural',
    provider: 'microsoft-edge',
    voiceGender: 'Feminino',
    voiceDescription: 'Microsoft Edge Neural - Calorosa e autêntica.',
    accent: 'mineiro',
    tags: ['pausada'],
    speed: 0.95,
    pitch: -2
  },
  {
    id: 5,
    name: 'Narrador',
    voiceName: 'onyx',
    provider: 'puter-openai',
    voiceGender: 'Masculino',
    voiceDescription: 'OpenAI TTS (via Puter.js) - Grave, profunda e imponente.',
    accent: 'gaúcho',
    tags: ['autoritária'],
    speed: 1.0,
    pitch: 0
  }
];

export const PRESET_SCENES = [
  {
    id: 'podcast',
    title: '🎙️ Podcast de Inovação',
    description: 'Diálogo animado e descontraído entre 2 apresentadores com risos e interjeições.',
    context: 'Estúdio de gravação moderno, clima descontraído e amigável com excelente acústica.',
    text: `[Speaker 1 - Mariana]: Fala, pessoal! Bem-vindos ao nosso podcast de tecnologia! Hoje vamos conversar sobre a revolução do Gemini 3.8 Flash TTS!
[Speaker 2 - Carlos]: Que prazer estar aqui, Mariana! <breath> É impressionante como o áudio gerado agora captura a alma e a entonação natural da nossa conversa!
[Speaker 1 - Mariana]: |yeah| É incrível mesmo! Dá pra sentir a vibração em cada detalhe!`
  },
  {
    id: 'nordeste_sul',
    title: '🇧🇷 Encontro de Sotaques do Brasil',
    description: 'Demonstração rica comparando sotaques nordestino, baiano e gaúcho.',
    context: 'Uma conversa calorosa em um café aconchegante no centro histórico.',
    text: `[Speaker 1 - Mariana]: Eita que esse cafezinho com tapioca aqui no Ceará não tem comparação nenhuma, meu povo!
[Speaker 2 - Carlos]: Bah, mas com certeza tchê! Mas te digo que um mate bem cevadinho no inverno também faz um bem danado pro coração!
[Speaker 3 - Beatriz]: Oxente, se juntar o cafezinho com esse carinho todo, não tem pra onde correr, é pura alegria!`
  },
  {
    id: 'drama_5_speakers',
    title: '🎭 Roteiro Completo (5 Personagens)',
    description: 'Cena teatral completa mostrando as 5 cores e diferentes personalidades.',
    context: 'Uma sala de reuniões misteriosa iluminada apenas pela luz fraca da tempestade lá fora.',
    text: `[Speaker 1 - Narrador]: A tempestade caía impiedosa sobre a velha mansão no alto da colina.
[Speaker 2 - Carlos]: Alguém trancou a porta principal por fora! Nós estamos completamente isolados aqui!
[Speaker 3 - Mariana]: Calma, Carlos! Desesperar agora só vai piorar tudo. Nós precisamos manter a razão.
[Speaker 4 - Dr. Roberto]: Meus caros, observem as pegadas no piso de carvalho... Elas levam diretamente para a biblioteca.
[Speaker 5 - Vitória]: Então não temos tempo a perder! Peguem as lanternas e fiquem todos atentos a qualquer ruído!`
  }
];
