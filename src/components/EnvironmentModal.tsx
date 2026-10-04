import React from 'react';
import { X, Settings, Check } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const languages = [
    'TypeScript',
    'JavaScript',
    'Python',
    'Go',
    'Rust',
    'React / Next.js',
    'Node.js / Express',
    'SQL / PostgreSQL',
    'C++',
    'HTML / CSS',
  ];

  const experienceLevels = [
    {
      id: 'beginner' as const,
      label: 'Beginner / Educational',
      desc: 'Plain language explanations, extensive inline code comments, and guided step-by-step setup instructions.',
    },
    {
      id: 'intermediate' as const,
      label: 'Intermediate',
      desc: 'Production-ready architecture, clear trade-offs, standard conventions, and practical unit tests.',
    },
    {
      id: 'expert' as const,
      label: 'Production / Senior Engineer',
      desc: 'High performance algorithms, strict typing, failure modes, concurrency, and security hardening.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-neutral-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Environment & Experience Profile</h2>
              <p className="text-[11px] text-neutral-400">
                Tailor DevPartner code formatting, depth of commentary, and target stack
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Target Language / Stack */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Preferred Language or Framework
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {languages.map((lang) => {
                const isSelected = profile.preferredLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onUpdateProfile({ ...profile, preferredLanguage: lang })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <span>{lang}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Target Experience Level & Tone
            </label>
            <div className="space-y-2">
              {experienceLevels.map((lvl) => {
                const isSelected = profile.experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onUpdateProfile({ ...profile, experienceLevel: lvl.id })}
                    className={`w-full p-3 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/30'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-sky-300' : 'text-neutral-200'}`}>
                        {lvl.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors"
          >
            Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
