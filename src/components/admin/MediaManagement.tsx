import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSiteMedia, uploadSiteAsset, SITE_ASSET_SLOTS } from '@/services/mediaService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, ImageIcon, Loader2, Plus } from 'lucide-react';

const MediaManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { media, refresh } = useSiteMedia();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (key: string, file: File | null) => {
    if (!file || !user) return;
    setUploadingKey(key);
    try {
      await uploadSiteAsset(key, file, user.id);
      await refresh();
      toast({ title: 'Uploaded', description: `${key} updated successfully.` });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploadingKey(null); }
  };

  const customSlots = Object.keys(media).filter(k => !SITE_ASSET_SLOTS.some(s => s.key === k));
  const allSlots = [
    ...SITE_ASSET_SLOTS.map(s => ({ key: s.key, label: s.label, description: s.description })),
    ...customSlots.map(k => ({ key: k, label: k, description: 'Custom asset' })),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Site Media</CardTitle>
          <CardDescription>
            Upload or replace images used across the site. Changes appear immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSlots.map(slot => {
              const current = media[slot.key];
              const isUploading = uploadingKey === slot.key;
              return (
                <Card key={slot.key} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{slot.label}</p>
                        <p className="text-xs text-muted-foreground">{slot.description}</p>
                        <code className="text-xs text-muted-foreground">{slot.key}</code>
                      </div>
                    </div>

                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-3 overflow-hidden">
                      {current ? (
                        <img src={current.file_url} alt={slot.label} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>

                    <input
                      ref={el => (fileInputs.current[slot.key] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleUpload(slot.key, e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => fileInputs.current[slot.key]?.click()}
                    >
                      {isUploading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                        : <><Upload className="h-4 w-4 mr-2" /> {current ? 'Replace' : 'Upload'}</>}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Add Custom Asset</CardTitle>
          <CardDescription>Upload an image with your own asset key (e.g. "homepage-banner").</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Asset key</Label>
            <Input
              value={customKey}
              onChange={e => setCustomKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="my-custom-asset"
            />
          </div>
          <div>
            <Label className="block mb-2">File</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={!customKey || uploadingKey === customKey}
              onChange={e => {
                if (customKey) {
                  handleUpload(customKey, e.target.files?.[0] || null);
                  setCustomKey('');
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaManagement;
