import type { SpeechSegment, SpeakerConfig } from '../types/tts.ts';

/**
 * Parses script text with block identifiers in the format:
 * [Speaker 1 - Nome]: texto
 * or [Speaker 2]: texto
 * Also recognizes inline tags like [brava], [carioca] and preserves vocal bursts like <laugh>, |yeah|
 */
export function parseScriptToSegments(
  rawText: string,
  speakers: SpeakerConfig[]
): SpeechSegment[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split('\n');
  const segments: SpeechSegment[] = [];

  // Regex to match header: [Speaker 1 - Nome]: or [Speaker 1]: or [Nome]:
  const speakerHeaderRegex = /^\[(?:Speaker\s*(\d+)(?:\s*-\s*([^\]]+))?|([^\]]+))\]\s*:\s*(.*)$/i;

  let currentSpeakerId = 1;
  let currentSpeakerName = speakers[0]?.name || 'Narrador';
  let currentBuffer: string[] = [];
  let currentSegmentTags: string[] = [];

  const flushSegment = () => {
    const fullText = currentBuffer.join(' ').trim();
    if (!fullText) return;

    // Check if there are inline style tags like [brava], [alegre] in the text
    const inlineTagRegex = /\[([a-zA-ZÀ-ÿ\s]+)\]/g;
    const extractedTags = [...currentSegmentTags];
    let cleanedText = fullText;

    let match;
    while ((match = inlineTagRegex.exec(fullText)) !== null) {
      const tagContent = match[1].trim().toLowerCase();
      // Skip if it looks like a speaker header or non-tag
      if (!tagContent.startsWith('speaker')) {
        if (!extractedTags.includes(tagContent)) {
          extractedTags.push(tagContent);
        }
      }
    }

    const matchedSpeaker = speakers.find((s) => s.id === currentSpeakerId) || speakers[0];

    segments.push({
      id: `seg-${segments.length + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      speakerId: currentSpeakerId,
      speakerName: currentSpeakerName,
      text: cleanedText,
      tags: extractedTags.length > 0 ? extractedTags : matchedSpeaker?.tags || [],
      accent: matchedSpeaker?.accent,
      speed: matchedSpeaker?.speed || 1.0,
      pitch: matchedSpeaker?.pitch || 0,
      voiceName: matchedSpeaker?.voiceName,
      provider: matchedSpeaker?.provider
    });

    currentBuffer = [];
    currentSegmentTags = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBuffer.length > 0) {
        flushSegment();
      }
      continue;
    }

    const match = trimmed.match(speakerHeaderRegex);
    if (match) {
      flushSegment();

      const numStr = match[1];
      const namePart = match[2]?.trim();
      const directName = match[3]?.trim();
      const dialogueText = match[4]?.trim() || '';

      if (numStr) {
        currentSpeakerId = Math.min(5, Math.max(1, parseInt(numStr, 10)));
        const defaultSpeaker = speakers.find((s) => s.id === currentSpeakerId);
        currentSpeakerName = namePart || defaultSpeaker?.name || `Speaker ${currentSpeakerId}`;
      } else if (directName) {
        // Try to find matching speaker by name
        const found = speakers.find(
          (s) => s.name.toLowerCase() === directName.toLowerCase()
        );
        if (found) {
          currentSpeakerId = found.id;
          currentSpeakerName = found.name;
        } else {
          currentSpeakerName = directName;
        }
      }

      if (dialogueText) {
        currentBuffer.push(dialogueText);
      }
    } else {
      currentBuffer.push(trimmed);
    }
  }

  flushSegment();

  // If no speaker tags were present at all, wrap entire content as Speaker 1
  if (segments.length === 0 && rawText.trim()) {
    const matchedSpeaker = speakers[0];
    segments.push({
      id: `seg-1-${Date.now()}`,
      speakerId: 1,
      speakerName: matchedSpeaker?.name || 'Speaker 1',
      text: rawText.trim(),
      tags: matchedSpeaker?.tags || [],
      accent: matchedSpeaker?.accent,
      speed: matchedSpeaker?.speed || 1.0,
      pitch: matchedSpeaker?.pitch || 0
    });
  }

  return segments;
}

/**
 * Formats segments back to string representation
 */
export function formatSegmentsToScript(segments: SpeechSegment[]): string {
  return segments
    .map((seg) => `[Speaker ${seg.speakerId} - ${seg.speakerName}]: ${seg.text}`)
    .join('\n\n');
}

/**
 * Format seconds into mm:ss
 */
export function formatSecondsToTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Removes a specific bracketed tag (e.g. "brava", "carioca") from segment text
 */
export function removeTagFromText(text: string, tag: string): string {
  const cleanTag = tag.trim().replace(/^\[|\]$/g, '');
  const escaped = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'gi');
  return text.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Adds a tag to the beginning of segment text if not already present
 */
export function addTagToText(text: string, tag: string): string {
  const cleanTag = tag.trim().replace(/^\[|\]$/g, '');
  const escaped = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'i');
  if (regex.test(text)) {
    return text;
  }
  return `[${cleanTag}] ${text.trim()}`.trim();
}

/**
 * Toggles a tag in segment text (removes if present, adds if not)
 */
export function toggleTagInText(text: string, tag: string): string {
  const cleanTag = tag.trim().replace(/^\[|\]$/g, '');
  const escaped = cleanTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'i');
  if (regex.test(text)) {
    return removeTagFromText(text, cleanTag);
  } else {
    return addTagToText(text, cleanTag);
  }
}
