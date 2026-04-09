import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  KeyIcon,
  LanguageIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const { isAuthenticated, requestBrandOtp, verifyBrandOtp } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/setup', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(t.auth.emailRequired);
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError(t.auth.emailInvalid);
      return;
    }

    setIsLoading(true);
    const result = await requestBrandOtp(normalizedEmail);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || t.auth.emailInvalid);
      return;
    }

    setEmail(result.email);
    setStep('otp');
    toast.success(t.auth.otpSent);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError(t.auth.otpRequired);
      return;
    }

    setIsLoading(true);
    const result = await verifyBrandOtp({ email, otp });
    setIsLoading(false);

    if (!result.success) {
      setError(t.auth.otpInvalid);
      return;
    }

    toast.success(t.auth.loginSuccess);
    navigate('/setup', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="relative hidden overflow-hidden bg-gray-950 text-white lg:block">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-gray-950/25" />
          <div className="relative flex min-h-screen flex-col justify-end p-12">
            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <ShieldCheckIcon className="h-5 w-5" />
              {t.auth.sessionReady}
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight">{t.auth.title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-gray-200">{t.auth.subtitle}</p>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">
                  {t.header.localBrand}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{t.auth.title}</h1>
              </div>
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <LanguageIcon className="h-5 w-5" />
                {language === 'en' ? 'AR' : 'EN'}
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t.auth.emailLabel}
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      dir="ltr"
                      className={`w-full rounded-lg border border-gray-300 bg-white py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${isRtl ? 'pl-4 pr-10 text-right' : 'pl-10 pr-4'}`}
                      placeholder={t.auth.emailPlaceholder}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? t.auth.sendingOtp : t.auth.sendOtp}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
                  <p className="font-semibold">{t.auth.otpTitle}</p>
                  <p className="mt-1 break-all">{t.auth.otpHelp} {email}</p>
                  <p className="mt-3 font-semibold">{t.auth.mockHint}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t.auth.otpLabel}
                  </label>
                  <div className="relative">
                    <KeyIcon className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      dir="ltr"
                      className={`w-full rounded-lg border border-gray-300 bg-white py-3 text-lg font-bold tracking-[0.35em] text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white ${isRtl ? 'pl-4 pr-10 text-right' : 'pl-10 pr-4'}`}
                      placeholder={t.auth.otpPlaceholder}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? t.auth.verifyingOtp : t.auth.verifyOtp}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
                >
                  <ArrowLeftIcon className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                  {t.auth.changeEmail}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
