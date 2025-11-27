'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportDeckAsJSON } from '@/app/(app)/decks/[id]/actions';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ExportDeckButton({ deckId, deckName }: { deckId: string; deckName: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportDeckAsJSON(deckId);

      // Create a blob and download it
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deckName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export deck:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download />
      {isExporting ? t('deck.exporting') : ''}
    </Button>
  );
}
