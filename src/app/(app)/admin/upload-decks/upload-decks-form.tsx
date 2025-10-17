'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { uploadSystemDecks, UploadProgress } from './actions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function UploadDecksForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Please upload a JSON file');
      return;
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be under 5MB');
      return;
    }

    setIsUploading(true);
    setProgress(null);

    try {
      const content = await file.text();
      const result = await uploadSystemDecks(content);
      setProgress(result);
    } catch (error) {
      setProgress({
        totalDecks: 0,
        processedDecks: 0,
        currentDeck: null,
        totalCards: 0,
        processedCards: 0,
        skippedDecks: [],
        skippedCards: 0,
        errors: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
        status: 'error',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    if (progress.totalCards === 0) return 0;
    return Math.round((progress.processedCards / progress.totalCards) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Upload System Decks
        </CardTitle>
        <CardDescription>
          Import Cards Against Humanity decks from a JSON file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Source</AlertTitle>
          <AlertDescription className="block">
            Download the <span className="font-mono text-sm">full.json</span>{' '}
            file from{' '}
            <a
              href="https://crhallberg.com/cah"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              crhallberg.com/cah
            </a>
            . The file must follow the exact format with{' '}
            <span className="font-mono text-sm">name</span>,{' '}
            <span className="font-mono text-sm">white</span>, and{' '}
            <span className="font-mono text-sm">black</span> arrays.
          </AlertDescription>
        </Alert>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose JSON File
              </>
            )}
          </Button>
        </div>

        {isUploading && progress && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decks:</span>
                <span className="font-medium">
                  {progress.processedDecks} / {progress.totalDecks}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cards:</span>
                <span className="font-medium">
                  {progress.processedCards.toLocaleString()} /{' '}
                  {progress.totalCards.toLocaleString()}
                </span>
              </div>
              {progress.currentDeck && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Current: </span>
                  <span className="font-medium">{progress.currentDeck}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {progress && !isUploading && (
          <div className="space-y-3">
            {progress.status === 'completed' && progress.errors.length === 0 ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">
                  Upload Successful!
                </AlertTitle>
                <AlertDescription className="text-green-600 block">
                  Successfully imported{' '}
                  {progress.processedDecks - progress.skippedDecks.length}{' '}
                  deck(s) with{' '}
                  {(
                    progress.processedCards - progress.skippedCards
                  ).toLocaleString()}{' '}
                  card(s).
                  {progress.skippedDecks.length > 0 && (
                    <span className="block mt-1">
                      Skipped {progress.skippedDecks.length} existing deck(s)
                      with {progress.skippedCards.toLocaleString()} card(s).
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Completed with Errors</AlertTitle>
                <AlertDescription className="block">
                  {progress.processedDecks -
                    progress.errors.length -
                    progress.skippedDecks.length}{' '}
                  deck(s) imported successfully.
                </AlertDescription>
              </Alert>
            )}

            {progress.skippedDecks.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-1">
                  Skipped Decks (already exist):
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground max-h-32 overflow-y-auto">
                  {progress.skippedDecks.map((name, idx) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {progress.errors.length > 0 && (
              <div className="text-sm">
                <p className="font-medium mb-1 text-destructive">Errors:</p>
                <ul className="list-disc list-inside space-y-1 text-destructive max-h-32 overflow-y-auto">
                  {progress.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
