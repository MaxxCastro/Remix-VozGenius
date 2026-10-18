import React from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Layers,
  Code2,
  Sparkles,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Sliders,
  Mic2,
  Smile
} from 'lucide-react';
import { SpeechSegment, SpeakerConfig } from '../types/tts';
import { SPEAKER_COLORS, BRAZILIAN_ACCENTS, VOICE_STYLE_TAGS, VOCAL_BURSTS } from '../constants/ttsData';
import {
  parseScriptToSegments,
  formatSegmentsToScript,
  removeTagFromText,
  addTagToText,
  toggleTagInText
} from '../utils/ttsParser';

interface ScriptEditorProps {
  rawScript: string;
  onChangeRawScript: (text: string) => void;
  speakers: SpeakerConfig[];
  activeSpeakerId: number;
  onSelectActiveSpeaker: (id: number) => void;
  currentlyPlayingSpeakerId?: number;
  onGenerateAiScript?: () => void;
  isGeneratingAiScript?: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  rawScript,
  onChangeRawScript,
  speakers,
  activeSpeakerId,
  onSelectActiveSpeaker,
  currentlyPlayingSpeakerId,
  onGenerateAiScript,
  isGeneratingAiScript = false
}) => {
  const [viewMode, setViewMode] = React.useState<'blocks' | 'raw'>('blocks');
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [openToolbarIndex, setOpenToolbarIndex] = React.useState<number | null>(null);

  // Parse segments for block view
  const segments = React.useMemo(() => {
    return parseScriptToSegments(rawScript, speakers);
  }, [rawScript, speakers]);

  // Update a single segment text
  const handleUpdateSegmentText = (index: number, newText: string) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], text: newText };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Change speaker of a segment
  const handleChangeSegmentSpeaker = (index: number, newSpeakerId: number) => {
    const updated = [...segments];
    const targetSpeaker = speakers.find((s) => s.id === newSpeakerId) || speakers[0];
    updated[index] = {
      ...updated[index],
      speakerId: newSpeakerId,
      speakerName: targetSpeaker.name
    };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Remove individual tag from a specific dialogue block
  const handleRemoveTag = (index: number, tagToRemove: string) => {
    const seg = segments[index];
    const newText = removeTagFromText(seg.text, tagToRemove);
    const newTags = (seg.tags || []).filter(
      (t) => t.toLowerCase() !== tagToRemove.toLowerCase()
    );
    const updated = [...segments];
    updated[index] = { ...seg, text: newText, tags: newTags };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Toggle individual expression tag on a specific dialogue block
  const handleToggleExpression = (index: number, expressionTag: string) => {
    const seg = segments[index];
    const newText = toggleTagInText(seg.text, expressionTag);
    const isPresent = (seg.tags || []).includes(expressionTag.toLowerCase());
    const newTags = isPresent
      ? (seg.tags || []).filter((t) => t.toLowerCase() !== expressionTag.toLowerCase())
      : [...(seg.tags || []), expressionTag.toLowerCase()];
    const updated = [...segments];
    updated[index] = { ...seg, text: newText, tags: newTags };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Set regional accent on a specific dialogue block
  const handleSetAccent = (index: number, accentId: string) => {
    const seg = segments[index];
    // Remove any previous accent tag
    let updatedText = seg.text;
    BRAZILIAN_ACCENTS.forEach((acc) => {
      updatedText = removeTagFromText(updatedText, acc.id);
    });
    if (accentId !== 'neutro') {
      updatedText = addTagToText(updatedText, accentId);
    }
    const updated = [...segments];
    updated[index] = {
      ...seg,
      text: updatedText,
      accent: accentId !== 'neutro' ? accentId : undefined
    };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Set individual intonation (pitch) on a specific dialogue block
  const handleSetIntonation = (index: number, pitchOffset: number) => {
    const seg = segments[index];
    // Clean old pitch tag if present like [tom: +3st]
    let cleanText = seg.text.replace(/\[tom:\s*[-+]?\d+st?\]/gi, '').trim();
    if (pitchOffset !== 0) {
      const pitchTag = `tom: ${pitchOffset > 0 ? '+' : ''}${pitchOffset}st`;
      cleanText = addTagToText(cleanText, pitchTag);
    }
    const updated = [...segments];
    updated[index] = {
      ...seg,
      text: cleanText,
      pitch: pitchOffset
    };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Append vocal burst/reaction to specific block
  const handleAppendBurst = (index: number, burstTag: string) => {
    const seg = segments[index];
    const newText = `${seg.text} ${burstTag}`.trim();
    const updated = [...segments];
    updated[index] = { ...seg, text: newText };
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Delete a segment
  const handleDeleteSegment = (index: number) => {
    const updated = segments.filter((_, i) => i !== index);
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Duplicate a segment
  const handleDuplicateSegment = (index: number) => {
    const seg = segments[index];
    const updated = [
      ...segments.slice(0, index + 1),
      { ...seg, id: `seg-dup-${Date.now()}` },
      ...segments.slice(index + 1)
    ];
    onChangeRawScript(formatSegmentsToScript(updated));
  };

  // Append new segment for a specific speaker
  const handleAppendSegment = (speakerId: number) => {
    const sp = speakers.find((s) => s.id === speakerId) || speakers[0];
    const newSegLine = `\n\n[Speaker ${sp.id} - ${sp.name}]: `;
    onChangeRawScript(rawScript.trim() + newSegLine);
    onSelectActiveSpeaker(speakerId);
  };

  const wordCount = rawScript.trim() ? rawScript.trim().split(/\s+/).length : 0;
  const charCount = rawScript.length;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all duration-300">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Top-left corner: Collapse Button + Icon + Title */}
        <div className="flex items-center gap-2.5">
          {/* Visual collapse button in top-left corner */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir Roteiro e Diálogos' : 'Recolher Roteiro e Diálogos'}
            title={isCollapsed ? 'Expandir roteiro e diálogos' : 'Recolher roteiro e diálogos'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 active:bg-indigo-500/35 text-indigo-300 border border-indigo-500/30 transition-all shadow-sm cursor-pointer hover:scale-105"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Expandir</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Recolher</span>
              </>
            )}
          </button>

          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Roteiro & Diálogos com Múltiplos Speakers
              {isCollapsed && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                  Recolhido
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Formato: <code className="text-indigo-400 font-mono">[Speaker 1 - Nome]: texto</code> (Até 5 locutores com cores distintas)
            </p>
          </div>
        </div>

        {/* View mode toggle & Stats */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            {segments.length} blocos • {wordCount} palavras • {charCount} carac.
          </div>

          {!isCollapsed && (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('blocks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'blocks'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Blocos Coloridos</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'raw'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Texto Puro</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Body (collapsible) */}
      {!isCollapsed && (
        <>
          {viewMode === 'blocks' ? (
            <div className="space-y-3">
          {segments.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">
                Nenhum bloco de diálogo encontrado. Comece adicionando a fala de um speaker!
              </p>
              <button
                type="button"
                onClick={() => handleAppendSegment(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Fala de Speaker 1
              </button>
            </div>
          ) : (
            segments.map((segment, index) => {
              const colorConfig =
                SPEAKER_COLORS.find((c) => c.id === segment.speakerId) ||
                SPEAKER_COLORS[0];
              const isPlayingThisSpeaker =
                currentlyPlayingSpeakerId === segment.speakerId;

              return (
                <div
                  key={segment.id || index}
                  className={`p-3.5 rounded-xl border transition-all duration-200 relative ${
                    isPlayingThisSpeaker
                      ? 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-950/40'
                      : ''
                  }`}
                  style={{
                    backgroundColor: `${colorConfig.primary}0a`,
                    borderColor: `${colorConfig.primary}40`
                  }}
                  onClick={() => onSelectActiveSpeaker(segment.speakerId)}
                >
                  {/* Left accent strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                    style={{ backgroundColor: colorConfig.primary }}
                  />

                  {/* Header row of segment block */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono"
                        style={{
                          backgroundColor: `${colorConfig.primary}20`,
                          color: colorConfig.primary
                        }}
                      >
                        [Speaker {segment.speakerId} - {segment.speakerName}]
                      </span>

                      {/* Speaker Quick Switcher */}
                      <select
                        value={segment.speakerId}
                        onChange={(e) =>
                          handleChangeSegmentSpeaker(
                            index,
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="text-[11px] bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-300 focus:outline-none cursor-pointer"
                      >
                        {speakers.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            Mudar para: {sp.name} (Speaker {sp.id})
                          </option>
                        ))}
                      </select>

                      {/* Toggle Toolbar Button for this specific dialogue block */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenToolbarIndex(openToolbarIndex === index ? null : index);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                          openToolbarIndex === index
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                        }`}
                        title="Alternar expressões, sotaque e entonação desta fala"
                      >
                        <Smile className="w-3 h-3 text-indigo-400" />
                        <span>Alternar Expressão & Tom</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${openToolbarIndex === index ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Actions: Duplicate and Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSegment(index);
                        }}
                        title="Duplicar fala"
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(index);
                        }}
                        title="Remover fala"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Removable Tags Strip (Opcionais, Individuais & Removíveis) */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 pl-2">
                    {/* Active tags with individual 'x' remove button */}
                    {segment.tags && segment.tags.length > 0 && segment.tags.map((tg) => (
                      <span
                        key={tg}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-900 text-indigo-300 border border-indigo-500/30 group hover:border-indigo-500/60 transition-colors"
                      >
                        <span>[{tg}]</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(index, tg);
                          }}
                          title={`Remover tag [${tg}] deste diálogo`}
                          className="text-slate-400 hover:text-rose-400 p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label={`Remover [${tg}]`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    {/* Individual Pitch Badge (if set) */}
                    {segment.pitch !== undefined && segment.pitch !== 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/40">
                        <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                        <span>Tom: {segment.pitch > 0 ? `+${segment.pitch}` : segment.pitch}st</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetIntonation(index, 0);
                          }}
                          title="Restaurar tom natural (0 st)"
                          className="text-slate-400 hover:text-rose-400 p-0.5 rounded hover:bg-purple-900/50 transition-colors cursor-pointer"
                          aria-label="Restaurar tom natural"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}

                    {/* Individual Accent Badge (if set) */}
                    {segment.accent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                        <span>Sotaque: {segment.accent}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetAccent(index, 'neutro');
                          }}
                          title="Remover sotaque deste diálogo"
                          className="text-slate-400 hover:text-rose-400 p-0.5 rounded hover:bg-emerald-900/50 transition-colors cursor-pointer"
                          aria-label="Remover sotaque"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}

                    {/* Quick helper if no tags applied */}
                    {(!segment.tags || segment.tags.length === 0) && !segment.pitch && !segment.accent && (
                      <span className="text-[10px] text-slate-500 italic">
                        Sem tags individuais aplicadas (tom padrão do locutor)
                      </span>
                    )}
                  </div>

                  {/* Textarea for dialogue */}
                  <textarea
                    rows={2}
                    value={segment.text}
                    onChange={(e) =>
                      handleUpdateSegmentText(index, e.target.value)
                    }
                    placeholder="Digite o texto da fala aqui... Use tags como [brava], [carioca] ou reações como <laugh>, |yeah|..."
                    className="w-full pl-2.5 pr-2.5 py-1.5 bg-slate-950/70 border border-slate-800/80 focus:border-slate-600 rounded-lg text-xs text-slate-100 focus:outline-none leading-relaxed resize-none font-sans"
                  />

                  {/* Expandable Alternator Bar (Alternância de Expressões e Entonação neste diálogo) */}
                  {openToolbarIndex === index && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2.5 shadow-inner">
                      {/* 1. Alternador de Expressões & Emoções */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            Alternar Expressão / Emoção desta fala:
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Clique para alternar (ativar/desativar)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'alegre',
                            'brava',
                            'calma',
                            'confiante',
                            'animada',
                            'sussurrada',
                            'irônica',
                            'dramática',
                            'conversacional',
                            'misteriosa',
                            'autoritária'
                          ].map((expr) => {
                            const isSelected = (segment.tags || []).includes(expr.toLowerCase());
                            return (
                              <button
                                key={expr}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleExpression(index, expr);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                [{expr}]
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Alternador de Entonação / Tom (Pitch) */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-purple-400" />
                            Entonação / Tom:
                          </span>
                          <div className="flex items-center gap-1">
                            {[
                              { label: 'Grave (-3)', val: -3 },
                              { label: 'Natural (0)', val: 0 },
                              { label: 'Agudo (+3)', val: 3 },
                              { label: 'Enfático (+5)', val: 5 }
                            ].map((p) => {
                              const isCurrentPitch = (segment.pitch ?? 0) === p.val;
                              return (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetIntonation(index, p.val);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                                    isCurrentPitch
                                      ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Alternador de Sotaque */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                            Sotaque:
                          </span>
                          <select
                            value={segment.accent || 'neutro'}
                            onChange={(e) => {
                              handleSetAccent(index, e.target.value);
                            }}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="neutro">Padrão do Locutor</option>
                            {BRAZILIAN_ACCENTS.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.label} ({acc.region.split('/')[0].trim()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 4. Reações Rápidas (Vocal Bursts) */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                          <Mic2 className="w-3 h-3 text-amber-400" />
                          Inserir Reação:
                        </span>
                        {VOCAL_BURSTS.map((burst) => (
                          <button
                            key={burst.tag}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppendBurst(index, burst.tag);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-[10px] font-mono transition-colors cursor-pointer"
                            title={burst.desc}
                          >
                            + {burst.tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Raw textarea mode */
        <div className="space-y-2">
          <textarea
            rows={10}
            value={rawScript}
            onChange={(e) => onChangeRawScript(e.target.value)}
            placeholder="[Speaker 1 - Mariana]: Olá a todos, bem-vindos!\n[Speaker 2 - Carlos]: Que ótimo estar aqui com você hoje!"
            className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
          />
          <p className="text-[11px] text-slate-500">
            Dica: Digite cada fala começando com <code className="text-indigo-400">[Speaker 1 - Nome]:</code> até <code className="text-cyan-400">[Speaker 5 - Nome]:</code>. Tags entre colchetes como <code className="text-amber-400">[carioca]</code> ou <code className="text-emerald-400">[animada]</code> serão aplicadas automaticamente!
          </p>
        </div>
      )}

      {/* Quick Add Speaker buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Adicionar Bloco:
        </span>
        {speakers.map((sp) => {
          const colorConfig =
            SPEAKER_COLORS.find((c) => c.id === sp.id) || SPEAKER_COLORS[0];
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => handleAppendSegment(sp.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:brightness-110 shadow-sm"
              style={{
                backgroundColor: `${colorConfig.primary}15`,
                borderColor: `${colorConfig.primary}50`,
                color: colorConfig.primary
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                Speaker {sp.id} ({sp.name})
              </span>
            </button>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
};
