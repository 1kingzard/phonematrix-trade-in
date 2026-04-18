import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceData, formatCurrency } from '@/services/deviceDataService';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';
import DeviceImage from '@/components/DeviceImage';

const WHATSAPP_NUMBER = '18765472061';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().min(7, 'Valid phone required').max(30),
  color: z.string().min(1, 'Please select a color'),
  notes: z.string().max(500).optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  device: DeviceData;
  initialColor?: string;
}

const PurchaseRequestModal: React.FC<Props> = ({ open, onClose, device, initialColor }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState(initialColor || device.Colors[0] || '');
  const [notes, setNotes] = useState('');

  const handleSend = () => {
    const result = schema.safeParse({ name, phone, color, notes });
    if (!result.success) {
      toast({
        title: 'Please fix the form',
        description: result.error.errors[0]?.message || 'Invalid input',
        variant: 'destructive',
      });
      return;
    }

    const message = `Hello Phone Matrix! I'd like to request a purchase.

Device: ${device.Brand} ${device.Model}
Condition: ${device.Condition}
Storage: ${device.Storage}
Color: ${color}
Price: ${formatCurrency(device.Price)}

Name: ${name}
Phone: ${phone}
Notes: ${notes || 'N/A'}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast({ title: 'Opening WhatsApp', description: 'Your request is ready to send.' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Purchase</DialogTitle>
          <DialogDescription>
            We'll open WhatsApp with your request pre-filled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
            <div className="w-20 shrink-0 rounded-md overflow-hidden bg-background">
              <DeviceImage brand={device.Brand} model={device.Model} aspectClass="aspect-[3/4]" />
            </div>
            <div className="flex-1 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Device</span><span className="font-medium">{device.Brand} {device.Model}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Condition</span><span className="font-medium">{device.Condition}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-medium">{device.Storage}</span></div>
              <div className="flex justify-between pt-1 border-t border-border/60 mt-1"><span className="text-muted-foreground">Price</span><span className="font-bold text-base">{formatCurrency(device.Price)}</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="color"><SelectValue placeholder="Select color" /></SelectTrigger>
              <SelectContent>
                {device.Colors.length === 0 && <SelectItem value="Default">Default</SelectItem>}
                {device.Colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (876) 555-0000" maxLength={30} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else we should know?" maxLength={500} rows={3} />
          </div>

          <Button onClick={handleSend} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Request via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseRequestModal;
