'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportAllDecksAsJSON } from '@/app/(app)/decks/actions';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ExportAllDecksButton() {
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportAllDecksAsJSON();

      // Create a blob and download it
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_decks_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export decks:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download />
      {isExporting ? t('decksPage.exporting') : t('decksPage.exportAll')}
    </Button>
  );
}
