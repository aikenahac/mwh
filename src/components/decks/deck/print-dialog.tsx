'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VisuallyHidden } from 'radix-ui';
import { Card } from '@/lib/api/card';
import { PDFViewer } from '@react-pdf/renderer';
import { PrintDocument } from './print-document';
import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PrintDeckDialog({ cards }: { cards?: Array<Card> }) {
  const t = useTranslations();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[80vw] h-[60vh]">
        <VisuallyHidden.Root>
          <DialogTitle>{t('deck.printDialog.printDocument')}</DialogTitle>
        </VisuallyHidden.Root>
        <PDFViewer className="w-full h-full">
          <PrintDocument cards={cards} />
        </PDFViewer>
      </DialogContent>
    </Dialog>
  );
}
