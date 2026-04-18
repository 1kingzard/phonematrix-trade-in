import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface SiteMediaRow {
  id: string;
  asset_key: string;
  file_url: string;
  file_path: string;
}

// Default site asset slots
export const SITE_ASSET_SLOTS = [
  { key: 'logo-light', label: 'Light Mode Logo', description: 'Shown in header & footer when light theme is active' },
  { key: 'logo-dark', label: 'Dark Mode Logo', description: 'Shown in header & footer when dark theme is active' },
  { key: 'hero', label: 'Hero Image', description: 'Homepage hero background or product shot' },
  { key: 'og-image', label: 'Social Share Image', description: 'OpenGraph / Twitter card preview' },
  { key: 'favicon', label: 'Favicon', description: 'Browser tab icon (PNG, ICO, SVG)' },
] as const;

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
export const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const useSiteMedia = () => {
  const [media, setMedia] = useState<Record<string, SiteMediaRow>>({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.from('site_media').select('*');
    const map: Record<string, SiteMediaRow> = {};
    (data || []).forEach((r: any) => { map[r.asset_key] = r as SiteMediaRow; });
    setMedia(map);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('site-media-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_media' }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { media, loading, refresh };
};

export const uploadSiteAsset = async (
  assetKey: string,
  file: File,
  userId: string
): Promise<SiteMediaRow> => {
  // Validate file
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`);
  }

  const path = `${assetKey}/${Date.now()}.${ext}`;
  const contentType = file.type || (ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : `image/${ext}`);
  const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });
  if (upErr) throw new Error(upErr.message || 'Upload failed. Please try again.');

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
  const file_url = urlData.publicUrl;

  const { data, error } = await supabase
    .from('site_media')
    .upsert({ asset_key: assetKey, file_url, file_path: path, updated_by: userId }, { onConflict: 'asset_key' })
    .select()
    .single();

  if (error) throw error;
  return data as SiteMediaRow;
};
