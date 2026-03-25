'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createRegistrationBundleV2, persistRegistrationBundleV2 } from '@/lib/e2ee-registration';
import { registerUserWithBundleV2 } from '@/lib/e2ee-register-runtime';

export default function RegisterV2Page() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Preparing E2EE v2 registration...');

  const fetchCaptcha = async () => {
    try {
      const response = await fetch('/api/captcha');
      const data = await response.json();
      if (data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaImage(data.image);
      }
    } catch {
      setError('Failed to load captcha.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      setStatus('Generating signing and agreement keys...');
      const bundle = await createRegistrationBundleV2();
      await persistRegistrationBundleV2(bundle);

      setStatus('Validating signed pre-key bundle...');
      const result = await registerUserWithBundleV2({
        username,
        password,
        confirmPassword,
        agreementPublicKey: bundle.agreementPublicKey,
        signingPublicKey: bundle.signingPublicKey,
        signedPreKey: bundle.signedPreKey,
        signedPreKeySig: bundle.signedPreKeySig,
        captchaId,
        captchaAnswer,
      });

      if (result?.error) {
        setError(result.error);
        await fetchCaptcha();
      } else {
        router.replace('/auth/login');
      }
    } catch {
      setError('Registration failed.');
    } finally {
      setIsLoading(false);
      setStatus('Preparing E2EE v2 registration...');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-zinc-50 mb-2">Register with E2EE v2</h1>
        <p className="text-zinc-400 text-center text-sm mb-8">This flow generates signed prekeys and agreement keys before your account is created.</p>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {captchaImage && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center justify-center">
                  <img src={captchaImage} alt="Captcha" className="h-[50px] w-auto" />
                </div>
                <button type="button" onClick={fetchCaptcha} className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-emerald-500 transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50" placeholder="Captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required />
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating account...</> : 'Create secure account'}
          </button>
        </form>
        <p className="text-zinc-500 text-sm text-center mt-4">{status}</p>
        <p className="text-center text-zinc-500 text-sm mt-6">Already have an account? <Link href="/auth/login" className="text-emerald-400 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
