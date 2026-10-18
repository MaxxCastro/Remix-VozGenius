import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  FastForward,
  Rewind,
  Sparkles,
  Sliders,
  Music2
} from 'lucide-react';
import { SegmentTiming } from '../types/tts';
import { SPEAKER_COLORS } from '../constants/ttsData';
import { formatSecondsToTime } from '../utils/ttsParser';
import { globalAudioEngine } from '../utils/audioEngine';

interface AudioPlayerProps {
  audioUrl: string;
  segmentsTiming?: SegmentTiming[];
  onCurrentTimeChange?: (time: number, activeSpeakerId?: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  segmentsTiming = [],
  onCurrentTimeChange
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1.0);
  const [isMuted, setIsMuted] = React.useState(false);

  // Speed (0.5x to 2.0x) and Pitch (-10 to +10 semitones) sliders
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1.0);
  const [pitchSemitones, setPitchSemitones] = React.useState(0);

  // Connect Audio Engine on mount / audio change
  React.useEffect(() => {
    if (audioRef.current) {
      globalAudioEngine.init(audioRef.current);
    }
  }, [audioUrl]);

  // Update speed & pitch
  React.useEffect(() => {
    if (audioRef.current) {
      // If pitch shift is nonzero, we can modulate playback rate or preservesPitch
      globalAudioEngine.setPlaybackRate(playbackSpeed, pitchSemitones === 0);
    }
  }, [playbackSpeed, pitchSemitones]);

  // Canvas visualizer loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = globalAudioEngine.getFrequencyData();
      const numBars = 36;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        // Map data or simulate if idle
        const val = isPlaying
          ? freqData[i % freqData.length] || 40
          : 15 + Math.sin(Date.now() / 300 + i) * 6;

        const barHeight = Math.max(3, (val / 255) * height);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Find currently speaking segment
  const activeSegment = React.useMemo(() => {
    if (!segmentsTiming || segmentsTiming.length === 0) return null;
    return segmentsTiming.find(
      (seg) =>
        currentTime >= seg.startTime &&
        currentTime <= seg.startTime + seg.duration
    );
  }, [currentTime, segmentsTiming]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      if (onCurrentTimeChange) {
        const active = segmentsTiming.find(
          (seg) => time >= seg.startTime && time <= seg.startTime + seg.duration
        );
        onCurrentTimeChange(time, active?.speakerId);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    globalAudioEngine.resume();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Audio play error:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const targetTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    globalAudioEngine.setVolume(val);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      globalAudioEngine.setVolume(volume || 1);
      setIsMuted(false);
    } else {
      globalAudioEngine.setVolume(0);
      setIsMuted(true);
    }
  };

  const isMp3 = audioUrl.startsWith('data:audio/mp3') || audioUrl.includes('.mp3');
  const fileExt = isMp3 ? 'mp3' : 'wav';

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    globalAudioEngine.downloadWav(audioUrl, `vozgenius-tts-${timestamp}.${fileExt}`);
  };

  const speakerColor = activeSegment
    ? SPEAKER_COLORS.find((c) => c.id === activeSegment.speakerId) || SPEAKER_COLORS[0]
    : null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Top row: Title, Active Speaker Tracker & Download button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <Music2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Player de Áudio Masterizado
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {isMp3 ? 'Áudio Masterizado (MP3 24kHz)' : 'WAV 24kHz Mono Master'}
            </span>
          </div>

          {/* Active Speaker Speaking indicator */}
          {activeSegment && speakerColor && (
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Falando agora:</span>
              <span
                className="font-bold px-2 py-0.5 rounded text-[11px] font-mono border"
                style={{
                  backgroundColor: `${speakerColor.primary}20`,
                  color: speakerColor.primary,
                  borderColor: `${speakerColor.primary}40`
                }}
              >
                Speaker {activeSegment.speakerId}: {activeSegment.speakerName}
              </span>
              <span className="text-[11px] text-slate-300 italic truncate max-w-xs">
                "{activeSegment.text}"
              </span>
            </div>
          )}
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Áudio ({fileExt.toUpperCase()})</span>
        </button>
      </div>

      {/* Visualizer Canvas */}
      <div className="w-full h-16 bg-slate-950/80 rounded-xl border border-slate-800 p-2 mb-4 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={56}
          className="w-full h-full"
        />
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-1.5 mb-5">
        <div className="relative group">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{formatSecondsToTime(currentTime)}</span>
          <span>{formatSecondsToTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            title="Voltar 5 segundos"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-transform active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            title="Avançar 5 segundos"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Speed and Pitch Sliders with Current Values Displayed */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          {/* Speed Slider: 0.5x to 2.0x */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" />
              Velocidade:
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 min-w-[50px] text-center">
              {playbackSpeed.toFixed(2)}x
            </span>
          </div>

          {/* Pitch Slider: -10 to +10 semitones */}
          <div className="flex items-center gap-2 sm:pl-3 sm:border-l sm:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Tom:
            </label>
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={pitchSemitones}
              onChange={(e) => setPitchSemitones(parseInt(e.target.value, 10))}
              className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 min-w-[50px] text-center">
              {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
