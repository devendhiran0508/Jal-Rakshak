import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SMSPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smsContent: string;
  onConfirm: () => void;
  loading?: boolean;
}

const SMSPreviewDialog: React.FC<SMSPreviewDialogProps> = ({
  open,
  onOpenChange,
  smsContent,
  onConfirm,
  loading = false
}) => {
  const { t } = useTranslation();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(smsContent);
      toast({
        title: t('messages.success'),
        description: t('offline.smsCopied')
      });
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('offline.smsCopyFailed'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            {t('offline.smsPreview')}
          </DialogTitle>
          <DialogDescription>
            {t('offline.smsPreviewDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Textarea
              value={smsContent}
              readOnly
              className="min-h-[120px] resize-none"
              placeholder={t('offline.smsContentPlaceholder')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{t('offline.smsInstructions')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t('offline.savingOffline') : t('offline.saveOffline')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SMSPreviewDialog;