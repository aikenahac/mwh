'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { Moon, Sun, Monitor, Smartphone } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t('theme.toggle')}</span>
      </Button>
    );
  }

  const SystemIcon = isMobile ? Smartphone : Monitor;

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme} className="group overflow-hidden">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-700 ease-in-out dark:rotate-[360deg] dark:scale-0 data-[theme=system]:rotate-[360deg] data-[theme=system]:scale-0 group-hover:rotate-12 group-hover:scale-110" data-theme={theme} />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] -rotate-[360deg] scale-0 transition-all duration-700 ease-in-out dark:rotate-0 dark:scale-100 dark:data-[theme=system]:rotate-[360deg] dark:data-[theme=system]:scale-0 group-hover:dark:rotate-12 group-hover:dark:scale-110" data-theme={theme} />
      <SystemIcon className="absolute h-[1.2rem] w-[1.2rem] -rotate-[360deg] scale-0 transition-all duration-700 ease-in-out data-[theme=system]:rotate-0 data-[theme=system]:scale-100 group-hover:data-[theme=system]:scale-125 group-hover:data-[theme=system]:-rotate-12" data-theme={theme} />
      <span className="sr-only">{t('theme.toggle')}</span>
    </Button>
  );
}
