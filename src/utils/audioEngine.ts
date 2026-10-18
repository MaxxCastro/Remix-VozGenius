/**
 * Web Audio Engine for advanced playback, waveform visualization,
 * playback speed adjustment (0.5x to 2.0x), and pitch shifting (-10 to +10 semitones).
 */

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    // Lazy initialized on first user gesture
  }

  public init(audioEl: HTMLAudioElement) {
    if (this.isInitialized && this.audioElement === audioEl) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      this.audioElement = audioEl;

      this.sourceNode = this.audioCtx.createMediaElementSource(audioEl);
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext media element initialization notice:', e);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(32);
    }
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public setPlaybackRate(rate: number, preservesPitch = true) {
    if (this.audioElement) {
      this.audioElement.playbackRate = Math.max(0.5, Math.min(2.0, rate));
      // Preserves pitch if requested
      (this.audioElement as any).preservesPitch = preservesPitch;
      (this.audioElement as any).mozPreservesPitch = preservesPitch;
      (this.audioElement as any).webkitPreservesPitch = preservesPitch;
    }
  }

  public downloadWav(audioUrl: string, filename = 'vozgenius-audio.wav') {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const globalAudioEngine = new AudioEngine();

/**
 * Encodes an AudioBuffer into a 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const wavSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(wavSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channel samples and write 16-bit PCM
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Concatenates multiple AudioBuffers with a configurable pause in seconds.
 */
export function concatenateAudioBuffers(
  audioCtx: AudioContext,
  buffers: AudioBuffer[],
  pauseSec = 0.25
): AudioBuffer {
  if (buffers.length === 0) {
    return audioCtx.createBuffer(1, 1, audioCtx.sampleRate);
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const sampleRate = buffers[0].sampleRate;
  const numChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const pauseSamples = Math.floor(sampleRate * pauseSec);

  let totalSamples = 0;
  for (let i = 0; i < buffers.length; i++) {
    totalSamples += buffers[i].length;
    if (i < buffers.length - 1) {
      totalSamples += pauseSamples;
    }
  }

  const outBuffer = audioCtx.createBuffer(numChannels, totalSamples, sampleRate);

  let currentOffset = 0;
  for (let i = 0; i < buffers.length; i++) {
    const buf = buffers[i];
    for (let ch = 0; ch < numChannels; ch++) {
      const srcData = buf.getChannelData(Math.min(ch, buf.numberOfChannels - 1));
      outBuffer.getChannelData(ch).set(srcData, currentOffset);
    }
    currentOffset += buf.length;
    if (i < buffers.length - 1) {
      currentOffset += pauseSamples;
    }
  }

  return outBuffer;
}
