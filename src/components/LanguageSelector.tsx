import React from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../constants/ttsData';
import { LanguageOption } from '../types/tts';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          Idioma da Locução
        </span>
        {currentLang.hasRegionalAccents && (
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
            Sotaques Regionais Ativos
          </span>
        )}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl text-left text-sm text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label={currentLang.name}>
              {currentLang.flag}
            </span>
            <div>
              <div className="font-medium text-slate-100">{currentLang.name}</div>
              <div className="text-xs text-slate-400">{currentLang.nativeName}</div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-400' : ''
            }`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {LANGUAGES.map((lang: LanguageOption) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-300'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {lang.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {lang.nativeName}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
