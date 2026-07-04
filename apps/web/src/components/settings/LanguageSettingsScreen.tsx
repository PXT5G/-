'use client';

import { useUpdateSettings, useSupportedLanguages, useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

export function LanguageSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { t } = useTranslation();
  const settings = useSettings();
  const update = useUpdateSettings();
  const { data: languages, isLoading } = useSupportedLanguages();

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.language')}</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5">
            {(languages ?? []).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { tap(); update.mutate({ language: lang.code }); }}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-3 text-left hover:bg-white/5 transition-colors',
                  settings.language === lang.code && 'bg-banana-gold/10'
                )}
              >
                <div>
                  <p className="text-sm text-white">{lang.name}</p>
                  <p className="text-xs text-white/40">{lang.nativeName}</p>
                </div>
                {settings.language === lang.code && (
                  <span className="text-banana-gold text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
