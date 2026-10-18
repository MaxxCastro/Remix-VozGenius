import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseScriptToSegments,
  formatSegmentsToScript,
  formatSecondsToTime,
  removeTagFromText,
  addTagToText,
  toggleTagInText
} from '../src/utils/ttsParser.ts';
import { INITIAL_SPEAKERS } from '../src/constants/ttsData.ts';

describe('TTS Parser Unit Tests', () => {
  test('parses multi-speaker formatted lines correctly', () => {
    const raw = `[Speaker 1 - Mariana]: Olá pessoal, tudo bem?
[Speaker 2 - Carlos]: Tudo ótimo por aqui!
[Speaker 3 - Roberto]: Que excelente dia para gravar.`;

    const segments = parseScriptToSegments(raw, INITIAL_SPEAKERS);

    assert.equal(segments.length, 3);
    assert.equal(segments[0].speakerId, 1);
    assert.equal(segments[0].speakerName, 'Mariana');
    assert.equal(segments[0].text, 'Olá pessoal, tudo bem?');

    assert.equal(segments[1].speakerId, 2);
    assert.equal(segments[1].speakerName, 'Carlos');
    assert.equal(segments[1].text, 'Tudo ótimo por aqui!');

    assert.equal(segments[2].speakerId, 3);
    assert.equal(segments[2].speakerName, 'Roberto');
  });

  test('extracts inline tags like [brava] and [carioca]', () => {
    const raw = `[Speaker 1 - Mariana]: [brava] [carioca] Por que você não me avisou antes?!`;
    const segments = parseScriptToSegments(raw, INITIAL_SPEAKERS);

    assert.equal(segments.length, 1);
    assert.ok(segments[0].tags.includes('brava'));
    assert.ok(segments[0].tags.includes('carioca'));
  });

  test('formats seconds to mm:ss correctly', () => {
    assert.equal(formatSecondsToTime(0), '00:00');
    assert.equal(formatSecondsToTime(65), '01:05');
    assert.equal(formatSecondsToTime(124.8), '02:04');
  });

  test('round-trips segments through formatSegmentsToScript', () => {
    const raw = `[Speaker 1 - Mariana]: Primeira linha de fala.\n\n[Speaker 2 - Carlos]: Segunda linha de fala.`;
    const segments = parseScriptToSegments(raw, INITIAL_SPEAKERS);
    const formatted = formatSegmentsToScript(segments);
    assert.ok(formatted.includes('[Speaker 1 - Mariana]: Primeira linha de fala.'));
    assert.ok(formatted.includes('[Speaker 2 - Carlos]: Segunda linha de fala.'));
  });

  test('removes individual tag cleanly from segment text', () => {
    const text = '[brava] [carioca] Por que você não me avisou?';
    const result = removeTagFromText(text, 'brava');
    assert.equal(result, '[carioca] Por que você não me avisou?');

    const result2 = removeTagFromText(result, 'carioca');
    assert.equal(result2, 'Por que você não me avisou?');
  });

  test('adds tag to segment text', () => {
    const text = 'Olá amigo!';
    const result = addTagToText(text, 'animada');
    assert.equal(result, '[animada] Olá amigo!');

    // Does not duplicate tag
    const result2 = addTagToText(result, 'animada');
    assert.equal(result2, '[animada] Olá amigo!');
  });

  test('toggles tag in segment text', () => {
    const text = 'Olá amigo!';
    const added = toggleTagInText(text, 'calma');
    assert.equal(added, '[calma] Olá amigo!');
    const removed = toggleTagInText(added, 'calma');
    assert.equal(removed, 'Olá amigo!');
  });
});
