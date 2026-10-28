import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AccountAccessForm from '@/components/AccountAccessForm';
export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>PhoneMatrix account</DialogTitle></DialogHeader><AccountAccessForm onSuccess={onClose} /></DialogContent></Dialog>;
}
