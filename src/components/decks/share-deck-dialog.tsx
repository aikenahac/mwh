'use client';

import { useState } from 'react';
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

interface Share {
  id: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  permission: 'view' | 'collaborate';
  createdAt: Date;
}

interface ShareDeckDialogProps {
  deckId: string;
  shares: Share[];
  isOwner: boolean;
}

export function ShareDeckDialog({ deckId, shares, isOwner }: ShareDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [permission, setPermission] = useState<'view' | 'collaborate'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await shareDeck({
        deckId,
        sharedWithUserId: userId.trim(),
        permission,
      });

      if (result.success) {
        toast.success('Deck shared successfully');
        setUserId('');
        setPermission('view');
        setOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to share deck');
      }
    } catch {
      toast.error('An error occurred while sharing the deck');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) {
      return;
    }

    try {
      const result = await removeShare({ shareId });

      if (result.success) {
        toast.success('Share removed successfully');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to remove share');
      }
    } catch {
      toast.error('An error occurred while removing the share');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'collaborate') => {
    try {
      const result = await updateSharePermission({
        shareId,
        permission: newPermission,
      });

      if (result.success) {
        toast.success('Permission updated successfully');
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to update permission');
      }
    } catch {
      toast.error('An error occurred while updating the permission');
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share Deck</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share Deck</DialogTitle>
          <DialogDescription>
            Share this deck with other users. They can view or collaborate based on the permission you set.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="permission">Permission</Label>
            <Select value={permission} onValueChange={(value) => setPermission(value as 'view' | 'collaborate')}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="collaborate">Collaborate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {shares.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Current Shares</h4>
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{share.sharedWithUserId}</p>
                    <div className="mt-1">
                      <Select
                        value={share.permission}
                        onValueChange={(value) => handleUpdatePermission(share.id, value as 'view' | 'collaborate')}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View Only</SelectItem>
                          <SelectItem value="collaborate">Collaborate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveShare(share.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleShare} disabled={isSubmitting}>
            {isSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
