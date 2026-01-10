'use client';

import { useState, FormEvent } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { OAuthButton } from '@/components/oauth-button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Routes } from '@/lib/routes';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const t = useTranslations('auth');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    // Clerk username requirements:
    // - At least 4 characters
    // - Only alphanumeric, underscores, and hyphens
    // - Cannot start or end with underscore or hyphen
    if (username.length < 4) {
      return t('usernameMinLength');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return t('usernameInvalidChars');
    }
    if (/^[_-]|[_-]$/.test(username)) {
      return t('usernameInvalidStartEnd');
    }
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError(t('invalidEmail'));
    } else {
      setEmailError('');
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value) {
      const error = validateUsername(value);
      setUsernameError(error);
    } else {
      setUsernameError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signUp) return;

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      toast.error(t('allFieldsRequired'));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('invalidEmail'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordsDontMatch'));
      return;
    }

    if (!acceptedTerms) {
      toast.error(t('mustAcceptTerms'));
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        username,
        password,
        legalAccepted: true,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerifying(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Sign-up error:', err);
      const errorMessage =
        err?.errors?.[0]?.message || 'An error occurred during sign-up';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();

    console.log('handleVerify called, code:', code, 'length:', code.length);

    if (!isLoaded || !signUp) {
      console.log('Not loaded or signUp not available');
      return;
    }

    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting email verification with code:', code);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('Sign-up verification status:', completeSignUp.status);
      console.log('Full response:', completeSignUp);
      console.log('Missing fields:', completeSignUp.missingFields);
      console.log('Unverified fields:', completeSignUp.unverifiedFields);

      if (completeSignUp.status === 'complete') {
        console.log('Verification complete, setting active session');
        await setActive({ session: completeSignUp.createdSessionId });
        console.log('Redirecting to home');
        router.push(Routes.HOME);
      } else if (completeSignUp.status === 'missing_requirements') {
        // User verified email but Clerk needs more info - just complete the sign-up
        console.log('Missing requirements, attempting to complete sign-up anyway');
        try {
          await setActive({ session: completeSignUp.createdSessionId });
          router.push(Routes.HOME);
        } catch (e) {
          console.error('Failed to set session:', e);
          toast.error('Please complete your profile information');
        }
      } else {
        // Handle other incomplete statuses
        console.error('Sign-up incomplete:', completeSignUp);
        toast.error(
          `Verification incomplete. Status: ${completeSignUp.status}`,
        );
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
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
        <h1 className="text-2xl font-bold">{t('signUpTitle')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('signUpDescription')}
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
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isLoading}
              className={emailError ? 'border-red-500' : ''}
            />
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t('usernamePlaceholder')}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={isLoading}
              className={usernameError ? 'border-red-500' : ''}
            />
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) =>
                setAcceptedTerms(checked === true)
              }
              disabled={isLoading}
              className="mt-1"
            />
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('acceptTermsPrefix')}{' '}
              <Link
                href={Routes.DOCS_PRIVACY_POLICY}
                className="text-primary hover:underline"
                target="_blank"
              >
                {t('privacyPolicy')}
              </Link>{' '}
              {t('and')}{' '}
              <Link
                href={Routes.DOCS_TERMS_OF_SERVICE}
                className="text-primary hover:underline"
                target="_blank"
              >
                {t('termsOfService')}
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !email ||
              !username ||
              !password ||
              !confirmPassword ||
              !acceptedTerms ||
              !!emailError ||
              !!usernameError
            }
          >
            {isLoading ? 'Creating account...' : t('continue')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link href={Routes.SIGN_IN} className="text-primary hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
