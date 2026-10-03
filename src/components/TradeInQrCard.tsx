import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, ExternalLink, MessageCircle } from 'lucide-react';

interface Props {
  url: string;
  code: string;
  onWhatsApp?: () => void;
  showView?: boolean;
}

const TradeInQrCard: React.FC<Props> = ({ url, code, onWhatsApp, showView = true }) => {
  const { toast } = useToast();
  const wrap = useRef<HTMLDivElement>(null);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast({ title: 'Link copied' }); }
    catch { toast({ title: 'Could not copy', description: url }); }
  };

  const save = () => {
    const src = wrap.current?.querySelector('canvas');
    if (!src) return;
    const pad = 40, size = src.width;
    const c = document.createElement('canvas');
    c.width = size + pad * 2; c.height = size + pad * 2 + 60;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(src, pad, pad);
    ctx.fillStyle = '#111111'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Phone Matrix • ${code}`, c.width / 2, size + pad + 45);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png'); a.download = `${code}-qr.png`; a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={wrap} className="rounded-xl bg-white p-4 shadow-sm">
        <QRCodeCanvas value={url} size={220} level="M" marginSize={1} />
      </div>
      <p className="text-xs text-center text-muted-foreground max-w-xs">
        Save this link or screenshot your QR code. You can use it to retrieve your trade-in request when you visit Phone Matrix.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full">
        <Button variant="outline" onClick={save}><Download className="h-4 w-4 mr-1" />Save QR</Button>
        <Button variant="outline" onClick={copy}><Copy className="h-4 w-4 mr-1" />Copy Link</Button>
        {showView && (
          <Button variant="outline" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />View Request</a></Button>
        )}
        {onWhatsApp && (
          <Button onClick={onWhatsApp} className={showView ? '' : 'col-span-2'}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
        )}
      </div>
    </div>
  );
};

export default TradeInQrCard;
