'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/lib/supabase/api/card';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PDFViewer } from '@react-pdf/renderer';
import { useTranslations } from 'next-intl';
import { PrintDocument } from './print-document';

export function PrintDeckDialog({ cards }: { cards?: Array<Card> }) {
  const t = useTranslations();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <FontAwesomeIcon icon={faPrint} />
        </Button>
      </DialogTrigger>
      <DialogContent className='w-full h-[80vh]'>
        <DialogHeader>
          <DialogTitle>{t("deck.printDialog.title")}</DialogTitle>
        </DialogHeader>
        <PDFViewer className='w-full h-full'>
          <PrintDocument cards={cards} />
        </PDFViewer>
      </DialogContent>
    </Dialog>
  )
}