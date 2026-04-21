import { LanguageIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { usePalette } from '../hooks/usePalette';

const BrandSetup = () => {
  const { language, setLanguage } = useLanguage();
  const { palette, palettes, setPalette } = usePalette();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-5 py-8 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Choose your palette</h1>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <LanguageIcon className="h-5 w-5" />
            {language === 'en' ? 'AR' : 'EN'}
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Pick one theme once, then continue to the dashboard.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {palettes.map((option) => {
            const isSelected = option.id === palette.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPalette(option.id)}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isSelected
                    ? 'border-[var(--brand-primary)] bg-white shadow-md dark:bg-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950 dark:text-white">{option.name}</p>
                  {isSelected && <CheckCircleIcon className="h-5 w-5 text-[var(--brand-primary)]" />}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <span className="h-14 rounded-2xl" style={{ backgroundColor: option.primary }} />
                  <span className="h-14 rounded-2xl" style={{ backgroundColor: option.primaryDark }} />
                  <span className="h-14 rounded-2xl" style={{ backgroundColor: option.primarySoft }} />
                  <span className="h-14 rounded-2xl" style={{ backgroundColor: option.sidebar }} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="rounded-2xl bg-[var(--brand-primary)] px-6 py-3 font-bold text-white shadow-lg transition hover:bg-[var(--brand-primary-dark)]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandSetup;
