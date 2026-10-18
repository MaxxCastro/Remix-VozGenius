import React from 'react';
import { Tag, Sparkles, Smile, Flame, Shield, Clock, Heart, Mic2, ChevronDown, ChevronUp } from 'lucide-react';
import { VOICE_STYLE_TAGS, VOCAL_BURSTS } from '../constants/ttsData';
import { VoiceStyleTag } from '../types/tts';

interface VoiceStyleTagsBarProps {
  activeSpeakerName: string;
  activeSpeakerColor: string;
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onInsertTagIntoText: (tagString: string) => void;
}

export const VoiceStyleTagsBar: React.FC<VoiceStyleTagsBarProps> = ({
  activeSpeakerName,
  activeSpeakerColor,
  selectedTags,
  onToggleTag,
  onInsertTagIntoText
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'todos' | 'emocao' | 'tom' | 'ritmo' | 'bursts'>('todos');

  const filteredTags = activeTab === 'todos' 
    ? VOICE_STYLE_TAGS 
    : VOICE_STYLE_TAGS.filter((t) => t.category === activeTab);

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        {/* Top-left corner: Collapse Button + Icon + Title */}
        <div className="flex items-center gap-2.5">
          {/* Visual collapse button in top-left corner */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir Tags de Estilo e Tom' : 'Recolher Tags de Estilo e Tom'}
            title={isCollapsed ? 'Expandir menu de tags' : 'Recolher menu de tags'}
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
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Tags de Estilo & Tom da Voz
              <span className="text-[10px] font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Expressões Funcionais
              </span>
              {isCollapsed && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                  Recolhido
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Personalizando a narração de:{' '}
              <span className="font-semibold" style={{ color: activeSpeakerColor }}>
                {activeSpeakerName}
              </span>
              {selectedTags.length > 0 && (
                <span className="ml-2 text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                  {selectedTags.map(t => `[${t}]`).join(' ')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Category Filter Tabs (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'todos', label: 'Todas as Tags' },
              { id: 'emocao', label: 'Emoções' },
              { id: 'tom', label: 'Tons' },
              { id: 'ritmo', label: 'Ritmo' },
              { id: 'bursts', label: 'Reações Vocais' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags Grid (hidden when collapsed) */}
      {!isCollapsed && (
        <>
          {activeTab !== 'bursts' ? (
            <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag: VoiceStyleTag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  onToggleTag(tag.id);
                  onInsertTagIntoText(`[${tag.id}]`);
                }}
                title={tag.description}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-900/30 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="font-mono text-indigo-400 font-bold">[{tag.label}]</span>
                <span className="text-[10px] text-slate-400 hidden md:inline">
                  {tag.description}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Vocal Bursts & Backchanneling */
        <div className="flex flex-wrap gap-2">
          {VOCAL_BURSTS.map((burst) => (
            <button
              key={burst.tag}
              type="button"
              onClick={() => onInsertTagIntoText(` ${burst.tag} `)}
              title={burst.desc}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
            >
              <Mic2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold">{burst.tag}</span>
              <span className="text-[10px] text-amber-200/70">{burst.desc}</span>
            </button>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
};
