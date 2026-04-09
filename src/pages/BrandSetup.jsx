import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, LanguageIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { usePalette } from '../hooks/usePalette';

const BrandSetup = () => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { palette, palettes, setPalette } = usePalette();
  const navigate = useNavigate();
  const text = t.setup;

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8 text-gray-950 dark:bg-gray-950 dark:text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-primary-dark)]">
            <SparklesIcon className="h-5 w-5" />
            {text.badge}
          </div>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <LanguageIcon className="h-5 w-5" />
            {language === 'en' ? 'AR' : 'EN'}
          </button>
        </header>

        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_440px]">
          <section>
            <p className="text-sm font-bold uppercase text-[var(--brand-primary)]">{text.kicker}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-950 dark:text-white lg:text-6xl">
              {text.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              {text.subtitle}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-gray-500 dark:text-gray-400">
              {text.brandPromise}
            </p>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{text.signedIn}</p>
              <p className="mt-2 break-all text-lg font-bold text-gray-950 dark:text-white">{user?.email}</p>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-xl shadow-gray-950/5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{text.paletteTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{text.paletteSubtitle}</p>

            <div className="mt-6 space-y-4">
              {palettes.map((option) => {
                const isSelected = option.id === palette.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPalette(option.id)}
                    className={`w-full rounded-lg border p-4 text-start transition ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-950 dark:text-white">{text.palettes[option.id]?.name || option.name}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{text.palettes[option.id]?.description || option.description}</p>
                      </div>
                      {isSelected && <CheckCircleIcon className="h-7 w-7 flex-shrink-0 text-[var(--brand-primary)]" />}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {[option.primary, option.primaryDark, option.primarySoft, option.sidebar].map((color) => (
                        <span key={color} className="h-8 flex-1 rounded" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="mt-8 w-full rounded-lg bg-[var(--brand-primary)] px-6 py-4 font-bold text-white shadow-lg transition hover:bg-[var(--brand-primary-dark)]"
            >
              {text.continue}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BrandSetup;
