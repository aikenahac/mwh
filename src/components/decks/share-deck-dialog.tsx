'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shareDeck, removeShare, updateSharePermission } from '@/app/(app)/decks/[id]/actions';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Share {
  id: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  permission: 'view' | 'collaborate';
  createdAt: Date;
  username?: string;
}

interface ShareDeckDialogProps {
  deckId: string;
  shares: Array<Share>;
  isOwner: boolean;
}

export function ShareDeckDialog({ deckId, shares, isOwner }: ShareDeckDialogProps) {
  const router = useRouter();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'view' | 'collaborate'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingShareId, setUpdatingShareId] = useState<string | null>(null);
  const [removingShareId, setRemovingShareId] = useState<string | null>(null);
  const [shareToRemove, setShareToRemove] = useState<string | null>(null);

  const handleShare = async () => {
    if (!username.trim()) {
      toast.error(t('deck.shareDialog.pleaseEnterUsername'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await shareDeck({
        deckId,
        username: username.trim(),
        permission,
      });

      if (result.success) {
        toast.success(t('deck.shareDialog.deckSharedSuccessfully'));
        setUsername('');
        setPermission('view');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || t('deck.shareDialog.failedToShareDeck'));
      }
    } catch {
      toast.error(t('deck.shareDialog.errorSharingDeck'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveShare = async () => {
    if (!shareToRemove) return;

    setRemovingShareId(shareToRemove);
    try {
      const result = await removeShare({ shareId: shareToRemove });

      if (result.success) {
        toast.success(t('deck.shareDialog.shareRemovedSuccessfully'));
        router.refresh();
      } else {
        toast.error(result.error || t('deck.shareDialog.failedToRemoveShare'));
      }
    } catch {
      toast.error(t('deck.shareDialog.errorRemovingShare'));
    } finally {
      setRemovingShareId(null);
      setShareToRemove(null);
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'collaborate') => {
    setUpdatingShareId(shareId);
    try {
      const result = await updateSharePermission({
        shareId,
        permission: newPermission,
      });

      if (result.success) {
        toast.success(t('deck.shareDialog.permissionUpdatedSuccessfully'));
        router.refresh();
      } else {
        toast.error(result.error || t('deck.shareDialog.failedToUpdatePermission'));
      }
    } catch {
      toast.error(t('deck.shareDialog.errorUpdatingPermission'));
    } finally {
      setUpdatingShareId(null);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={buttonVariants({ variant: 'outline' })}>
          <Share2 />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('deck.shareDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deck.shareDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">{t('deck.shareDialog.usernameLabel')}</Label>
            <Input
              id="username"
              placeholder={t('deck.shareDialog.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="permission">{t('deck.shareDialog.permissionLabel')}</Label>
            <Select value={permission} onValueChange={(value) => setPermission(value as 'view' | 'collaborate')}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">{t('deck.shareDialog.viewOnly')}</SelectItem>
                <SelectItem value="collaborate">{t('deck.shareDialog.collaborate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {shares.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">{t('deck.shareDialog.currentShares')}</h4>
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{share.username || share.sharedWithUserId}</p>
                    <div className="mt-1">
                      <Select
                        value={share.permission}
                        onValueChange={(value) => handleUpdatePermission(share.id, value as 'view' | 'collaborate')}
                        disabled={updatingShareId === share.id}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">{t('deck.shareDialog.viewOnly')}</SelectItem>
                          <SelectItem value="collaborate">{t('deck.shareDialog.collaborate')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShareToRemove(share.id)}
                    disabled={removingShareId === share.id}
                  >
                    {removingShareId === share.id ? t('deck.shareDialog.removing') : t('deck.shareDialog.remove')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('deck.shareDialog.cancel')}
          </Button>
          <Button type="submit" onClick={handleShare} disabled={isSubmitting}>
            {isSubmitting ? t('deck.shareDialog.sharing') : t('deck.shareDialog.share')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!shareToRemove} onOpenChange={(open) => !open && setShareToRemove(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deck.shareDialog.removeShareTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deck.shareDialog.removeShareDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('deck.shareDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemoveShare}>{t('deck.shareDialog.remove')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
