'use client';

import { useState, FormEvent } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OAuthButton } from '@/components/oauth-button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Routes } from '@/lib/routes';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const t = useTranslations('auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    // Validation
    if (!email || !password) {
      toast.error(t('allFieldsRequired'));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('invalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push(Routes.HOME);
      } else if (signInAttempt.status === 'needs_second_factor') {
        // Prepare email verification
        await signInAttempt.prepareSecondFactor({ strategy: 'email_code' });
        setIsVerifying(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const errorMessage =
        err?.errors?.[0]?.message || 'An error occurred during sign-in';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push(Routes.HOME);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage =
        err?.errors?.[0]?.message || 'Invalid verification code';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return null;
  }

  if (isVerifying) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{t('verifyEmail')}</h1>
            <p className="text-sm text-muted-foreground">{t('enterCode')}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : t('verify')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clerk CAPTCHA container */}
      <div id="clerk-captcha" />

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('signInTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('signInDescription')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <OAuthButton strategy="oauth_google" className="w-1/2">
            {t('google')}
          </OAuthButton>
          <OAuthButton strategy="oauth_apple" className="w-1/2">
            {t('apple')}
          </OAuthButton>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('or')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : t('continue')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href={Routes.SIGN_UP} className="text-primary hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
