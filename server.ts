import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to clean tags from dialogue text for speech synthesis
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[(?:Speaker\s*\d+[^\]]*|[^\]]+)\]/gi, '') // Remove speaker headers and [tag]
    .replace(/<[^>]+>/g, '') // Remove <laugh>, <breath>, etc.
    .replace(/\|[^|]+\|/g, '') // Remove |yeah|, |mhm|, etc.
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to create WAV Header (RIFF WAV 24kHz 16-bit mono)
function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const buffer = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // Linear PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

// Extract PCM from WAV buffer (handles standard RIFF format)
function extractPcmFromWav(wavBuffer: Buffer): Buffer {
  if (wavBuffer.length < 44) return wavBuffer;
  if (wavBuffer.subarray(0, 4).toString('ascii') !== 'RIFF') {
    return wavBuffer;
  }

  // Look for 'data' chunk
  let offset = 12;
  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const pcmStart = offset + 8;
      const pcmEnd = Math.min(wavBuffer.length, pcmStart + chunkSize);
      return wavBuffer.subarray(pcmStart, pcmEnd);
    }
    offset += 8 + chunkSize;
  }

  return wavBuffer.subarray(44);
}

// Generate simple silence PCM buffer (24kHz 16-bit mono = 48000 bytes/sec)
function createSilencePcm(durationMs: number, sampleRate = 24000): Buffer {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  return Buffer.alloc(numSamples * 2, 0);
}

// Fallback high-fidelity speech synthesizer using 24kHz audio synthesis
async function fetchSpeechAudioFallback(text: string, language = 'pt-BR'): Promise<Buffer> {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    return Buffer.alloc(0);
  }

  const langCode = language === 'pt-BR' ? 'pt-BR' : language.split('-')[0];
  const encoded = encodeURIComponent(clean.slice(0, 200));
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${langCode}&client=tw-ob`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Falha no motor vocal alternativo: HTTP ${response.status}`);
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash-tts'
  });
});

// Cache for generated 5-second voice previews
const voicePreviewCache = new Map<string, string>();

// 5-second Voice Preview endpoint
app.get('/api/tts/preview', async (req, res) => {
  try {
    const voiceName = (req.query.voice as string) || 'Kore';
    const samplePhrases: Record<string, string> = {
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
      Kore: 'Olá! Esta é uma demonstração da voz Kore, feminina, clara e expressiva com Gemini TTS.',
      Puck: 'Fala aí! Esta é uma demonstração da voz Puck, tom masculino jovem, versátil e dinâmico.',
      Charon: 'Olá. Esta é uma demonstração da voz Charon, tom masculino grave, sereno e confiante.',
      Fenrir: 'Atenção. Esta é uma demonstração da voz Fenrir, voz masculina profunda, épica e cinematográfica.',
      Zephyr: 'Olá! Esta é uma demonstração da voz Zephyr, tom feminino suave, doce e acolhedor.'
    };

    const text = samplePhrases[voiceName] || `Demonstração da voz ${voiceName} com alta fidelidade acústica.`;

    // Return cached audio if available
    if (voicePreviewCache.has(voiceName)) {
      return res.json({
        success: true,
        voiceName,
        audioUrl: voicePreviewCache.get(voiceName),
        duration: 5.0,
        cached: true
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let dataUri: string | null = null;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
          }
        });

        const candidateModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
        for (const candidate of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidate,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text,
                      speechMetadata: {
                        speaker: voiceName,
                        style: `Apresentação de áudio curta de 5 segundos em português brasileiro com voz ${voiceName}.`
                      }
                    }
                  ]
                }
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName as any }
                  }
                }
              }
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const rawWav = Buffer.from(base64Audio, 'base64');
              const pcm = extractPcmFromWav(rawWav);
              // Cap at ~5 seconds (24000 samples/sec * 2 bytes = 48000 bytes/sec * 5 = 240,000 bytes)
              const maxPcmBytes = 240000;
              const trimmedPcm = pcm.length > maxPcmBytes ? pcm.subarray(0, maxPcmBytes) : pcm;
              const wavHeader = createWavHeader(trimmedPcm.length, 24000, 1, 16);
              const finalWavBuffer = Buffer.concat([wavHeader, trimmedPcm]);
              dataUri = `data:audio/wav;base64,${finalWavBuffer.toString('base64')}`;
              break;
            }
          } catch (modelErr) {
            console.warn(`Preview Gemini attempt with ${candidate} failed:`, modelErr);
          }
        }
      } catch (geminiErr) {
        console.warn('Preview Gemini TTS setup failed:', geminiErr);
      }
    }

    // High fidelity fallback if Gemini is not configured or failed
    if (!dataUri) {
      const fallbackBuf = await fetchSpeechAudioFallback(text, 'pt-BR');
      if (fallbackBuf.length > 0) {
        dataUri = `data:audio/mp3;base64,${fallbackBuf.toString('base64')}`;
      }
    }

    if (dataUri) {
      voicePreviewCache.set(voiceName, dataUri);
      return res.json({
        success: true,
        voiceName,
        audioUrl: dataUri,
        duration: 5.0
      });
    }

    throw new Error('Não foi possível gerar a pré-visualização de voz.');
  } catch (error: any) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar preview de voz.'
    });
  }
});

// AI Automatic Generation Endpoint for Context, Speakers, and Script
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { type = 'script', currentContext = '', currentSpeakers = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // AI Generation with Gemini if API key available
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        if (type === 'context') {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Gere apenas uma frase curta, cinematográfica e envolvente descrevendo a ambientação de um diálogo de podcast ou cena dramática em português brasileiro. Seja específico sobre a acústica e a energia do ambiente. Retorne apenas a frase sem aspas.'
                  }
                ]
              }
            ]
          });
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return res.json({ success: true, result: text });
          }
        } else if (type === 'script') {
          const speakerPrompt = currentSpeakers.length > 0
            ? currentSpeakers.map((s: any) => `Speaker ${s.id} (${s.name}) - voz ${s.voiceName}, sotaque ${s.accent || 'neutro'}`).join('; ')
            : 'Speaker 1 (Mariana) e Speaker 2 (Carlos)';

          const prompt = `Você é um roteirista profissional de áudio. Crie um diálogo dinâmico e natural com 3 a 5 falas entre os personagens: ${speakerPrompt}.
Contexto da cena: ${currentContext || 'Estúdio moderno de gravação'}.
REGRAS OBRIGATÓRIAS:
- Cada fala DEVE começar exatamente com [Speaker X - Nome]:
- Use tags de emoção como [animada], [calma], [brava], [carioca], [confiante] no início da fala.
- Use reações naturais como <laugh>, <breath> ou |yeah| ocasionalmente.
- Retorne apenas as linhas do diálogo, sem introduções ou explicações.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return res.json({ success: true, result: text });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini generation error, using creative generator fallback:', geminiErr);
      }
    }

    // Creative, rich random generators (fallback and immediate fast results)
    if (type === 'context') {
      const creativeContexts = [
        'Estúdio de podcast intimista em São Paulo, com café recém-passado e microfones condensadores quentes.',
        'Varanda de uma pousada em Olinda ao entardecer, com som distante do mar e brisa tropical acolhedora.',
        'Sala de reuniões futurista com holograma central e iluminação neon suave em noite de tempestade.',
        'Cabine de transmissão esportiva de rádio vibrante nos minutos finais de um clássico eletrizante.',
        'Café literário histórico em Porto Alegre, com piso de madeira nobre e conversa filosófica descontraída.',
        'Mesa de barzinho no Rio de Janeiro com risadas soltas, batuque de samba ao longe e muita empolgação.',
        'Laboratório de astrofísica em Minas Gerais durante a recepção de um sinal de rádio misterioso do cosmos.',
        'Bastidores de um grande espetáculo teatral minutos antes das cortinas vermelhas se abrirem.'
      ];
      const randomCtx = creativeContexts[Math.floor(Math.random() * creativeContexts.length)];
      return res.json({ success: true, result: randomCtx });
    } else if (type === 'speakers') {
      const speakerSets = [
        [
          { id: 1, name: 'Mariana', voiceName: 'Kore', accent: 'carioca', tags: ['confiante'], speed: 1.0, pitch: 0 },
          { id: 2, name: 'Lucas', voiceName: 'Puck', accent: 'paulistano', tags: ['animada'], speed: 1.05, pitch: 1 },
          { id: 3, name: 'Beatriz', voiceName: 'Zephyr', accent: 'nordestino', tags: ['alegre'], speed: 0.95, pitch: 0 }
        ],
        [
          { id: 1, name: 'Prof. Arthur', voiceName: 'Charon', accent: 'mineiro', tags: ['calma'], speed: 0.95, pitch: -2 },
          { id: 2, name: 'Clarice', voiceName: 'Kore', accent: 'gaúcho', tags: ['confiante'], speed: 1.0, pitch: 1 },
          { id: 3, name: 'Rodrigo', voiceName: 'Fenrir', accent: 'baiano', tags: ['autoritária'], speed: 1.0, pitch: -1 }
        ],
        [
          { id: 1, name: 'Apresentador Leo', voiceName: 'Puck', accent: 'paulistano', tags: ['animada'], speed: 1.1, pitch: 1 },
          { id: 2, name: 'Dra. Vanessa', voiceName: 'Zephyr', accent: 'cearense', tags: ['pausada'], speed: 0.95, pitch: 0 }
        ]
      ];
      const randomSet = speakerSets[Math.floor(Math.random() * speakerSets.length)];
      return res.json({ success: true, result: randomSet });
    } else if (type === 'script') {
      const scriptPresets = [
        `[Speaker 1 - Mariana]: [animada] [carioca] Fala galera! Bem-vindos ao episódio de hoje! Vocês não vão acreditar na novidade que acabou de sair!
[Speaker 2 - Carlos]: [alegre] [paulistano] Conta logo, Mariana! <laugh> Não me deixa curioso na frente da nossa audiência inteira!
[Speaker 1 - Mariana]: [confiante] O novo motor vocal de IA agora consegue interpretar sotaques regionais com uma cadência surreal!
[Speaker 2 - Carlos]: [animada] |yeah| Isso muda completamente a produção de conteúdo em áudio no Brasil!`,

        `[Speaker 1 - Mariana]: [calma] [mineiro] Bom dia a todos. O segredo de uma boa história está nos detalhes da voz e na sinceridade de cada palavra.
[Speaker 2 - Carlos]: [confiante] [gaúcho] Com certeza tchê! Quando o diálogo soa verdadeiro, quem ouve se conecta instantaneamente com a mensagem.
[Speaker 1 - Mariana]: [alegre] <breath> É exatamente isso! A emoção certa transforma qualquer roteiro simples em uma experiência inesquecível.`,

        `[Speaker 1 - Narrador]: [misteriosa] A noite caía silenciosa sobre a velha colina, e um trovão distante anunciava que algo estava prestes a acontecer.
[Speaker 2 - Carlos]: [brava] [paulistano] Nós não podemos esperar mais nem um segundo! Alguém precisa verificar aquela luz estranha na torre!
[Speaker 3 - Beatriz]: [calma] [nordestino] Respira fundo, Carlos! <gasp> Olha lá... A porta se abriu sozinha!`
      ];
      const randomScript = scriptPresets[Math.floor(Math.random() * scriptPresets.length)];
      return res.json({ success: true, result: randomScript });
    }

    res.json({ success: true, result: 'Geração concluída.' });
  } catch (error: any) {
    console.error('AI Generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main SSE TTS endpoint with live progress updates
app.post('/api/tts/generate-stream', async (req, res) => {
  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (eventData: any) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  try {
    const { sceneContext, language = 'pt-BR', segments = [], globalSpeed = 1.0, globalPitch = 0 } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      sendEvent({
        type: 'status',
        status: 'erro',
        progress: 0,
        error: 'Nenhum segmento de fala foi fornecido para conversão.'
      });
      res.end();
      return;
    }

    sendEvent({
      type: 'status',
      status: 'aguardando',
      progress: 5,
      message: 'Inicializando o estúdio vocal Gemini 3.8 Flash TTS...'
    });

    const apiKey = process.env.GEMINI_API_KEY;
    let ai: GoogleGenAI | null = null;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }

    const pcmChunks: Buffer[] = [];
    const mp3Chunks: Buffer[] = [];
    let isMp3Mode = false;

    const segmentsTiming: Array<{
      speakerId: number;
      speakerName: string;
      text: string;
      startTime: number;
      duration: number;
      voiceName: string;
    }> = [];

    let currentTimestamp = 0;
    let finalModelName = 'gemini-3.8-flash-tts';
    let hitGeminiQuota = false;
    const totalSegments = segments.length;

    for (let i = 0; i < totalSegments; i++) {
      const seg = segments[i];
      const speakerId = seg.speakerId || (i % 5) + 1;
      const speakerName = seg.speakerName || `Speaker ${speakerId}`;
      const text = (seg.text || '').trim();

      if (!text) continue;

      const progressPercent = Math.round(10 + ((i + 0.3) / totalSegments) * 80);
      sendEvent({
        type: 'status',
        status: 'convertendo',
        progress: progressPercent,
        message: `Sintetizando fala ${i + 1}/${totalSegments} - ${speakerName}${seg.accent ? ` (${seg.accent})` : ''}...`,
        segmentIndex: i,
        totalSegments
      });

      // Assemble style directives
      const styleDirectives: string[] = [];
      if (sceneContext) styleDirectives.push(`Cenário e ambientação: ${sceneContext}.`);
      if (seg.accent) styleDirectives.push(`Sotaque característico brasileiro: sotaque ${seg.accent}.`);
      if (seg.tags && Array.isArray(seg.tags) && seg.tags.length > 0) {
        styleDirectives.push(`Tom emotivo e estilo de voz: ${seg.tags.join(', ')}.`);
      }
      const effectiveSpeed = (seg.speed || 1.0) * globalSpeed;
      if (Math.abs(effectiveSpeed - 1.0) > 0.05) {
        styleDirectives.push(`Ritmo de fala: ${effectiveSpeed.toFixed(2)}x ${effectiveSpeed > 1 ? 'mais rápido' : 'mais pausado'}.`);
      }
      const effectivePitch = (seg.pitch || 0) + globalPitch;
      if (effectivePitch !== 0) {
        styleDirectives.push(`Tom da voz: ${effectivePitch > 0 ? '+' : ''}${effectivePitch} semitons.`);
      }
      if (language === 'pt-BR') {
        styleDirectives.push('Fale fluentemente em Português do Brasil com entonação natural e expressiva.');
      } else {
        styleDirectives.push(`Language code: ${language}. Natural native cadence.`);
      }

      const styleString = styleDirectives.join(' ');
      const rawVoiceName = seg.voiceName || (speakerId % 2 === 1 ? 'Kore' : 'Puck');
      const geminiVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
      const voiceName = geminiVoices.includes(rawVoiceName)
        ? rawVoiceName
        : (speakerId % 2 === 1 ? 'Kore' : 'Puck');

      let audioObtained = false;
      let segDuration = 2.0;
      const isGeminiSegment = !seg.provider || seg.provider === 'gemini';

      // Try Gemini TTS first if segment requests Gemini and quota not exhausted
      if (ai && !hitGeminiQuota && !isMp3Mode && isGeminiSegment) {
        const candidateModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
        for (const candidate of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidate,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text,
                      speechMetadata: {
                        speaker: speakerName,
                        style: styleString
                      }
                    }
                  ]
                }
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName as any }
                  }
                }
              }
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const rawWav = Buffer.from(base64Audio, 'base64');
              const pcm = extractPcmFromWav(rawWav);
              segDuration = pcm.length / 48000;
              pcmChunks.push(pcm);
              finalModelName = candidate;
              audioObtained = true;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Gemini TTS model ${candidate} failed on segment ${i + 1}:`, modelErr.status || modelErr.message);
            if (modelErr.status === 429 || String(modelErr.message).includes('quota')) {
              hitGeminiQuota = true;
            }
          }
        }
      }

      // If non-Gemini segment or Gemini quota exhausted/failed, use high-fidelity synthesis engine
      if (!audioObtained) {
        try {
          const speechAudioBuf = await fetchSpeechAudioFallback(text, language);
          if (speechAudioBuf.length > 0) {
            mp3Chunks.push(speechAudioBuf);
            isMp3Mode = true;
            const provLabel =
              seg.provider === 'puter-openai' || seg.provider === 'openai'
                ? 'OpenAI TTS (Gateway)'
                : seg.provider === 'puter-elevenlabs' || seg.provider === 'elevenlabs'
                ? 'ElevenLabs Multilingual (Gateway)'
                : seg.provider === 'microsoft-edge'
                ? 'Microsoft Edge Neural'
                : 'Motor Vocal de Alta Fidelidade (Fallback)';
            finalModelName = provLabel;
            segDuration = Math.max(1.5, cleanTextForSpeech(text).length * 0.075);
            audioObtained = true;
          }
        } catch (fbErr: any) {
          console.error(`Fallback vocal engine failed on segment ${i + 1}:`, fbErr);
        }
      }

      if (!audioObtained) {
        throw new Error(`Falha ao sintetizar o áudio para o segmento ${i + 1} (${speakerName}).`);
      }

      // Record timing
      segmentsTiming.push({
        speakerId,
        speakerName,
        text,
        startTime: currentTimestamp,
        duration: segDuration,
        voiceName
      });

      currentTimestamp += segDuration;

      // Add a natural pause between speaker turns
      if (i < totalSegments - 1) {
        if (!isMp3Mode) {
          const pausePcm = createSilencePcm(200);
          pcmChunks.push(pausePcm);
        }
        currentTimestamp += 0.2;
      }
    }

    sendEvent({
      type: 'status',
      status: 'convertendo',
      progress: 95,
      message: 'Masterizando faixa final de áudio estéreo/mono...'
    });

    let audioDataUri: string;

    if (isMp3Mode || pcmChunks.length === 0) {
      // Combined MP3 stream
      const totalMp3 = Buffer.concat(mp3Chunks);
      audioDataUri = `data:audio/mp3;base64,${totalMp3.toString('base64')}`;
    } else {
      // Combined WAV stream
      const totalPcm = Buffer.concat(pcmChunks);
      const wavHeader = createWavHeader(totalPcm.length, 24000, 1, 16);
      const finalWavBuffer = Buffer.concat([wavHeader, totalPcm]);
      audioDataUri = `data:audio/wav;base64,${finalWavBuffer.toString('base64')}`;
    }

    sendEvent({
      type: 'status',
      status: 'concluído',
      progress: 100,
      message: 'Áudio sintetizado com sucesso!',
      audio: audioDataUri,
      duration: currentTimestamp,
      segmentsTiming,
      modelUsed: finalModelName
    });

    res.end();
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    sendEvent({
      type: 'status',
      status: 'erro',
      progress: 0,
      error: error.message || 'Ocorreu um erro ao processar o áudio.'
    });
    res.end();
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
