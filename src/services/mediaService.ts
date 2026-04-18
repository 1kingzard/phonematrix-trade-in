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
  { key: 'logo', label: 'Site Logo', description: 'Header / nav logo' },
  { key: 'hero', label: 'Hero Image', description: 'Homepage hero background or product shot' },
  { key: 'og-image', label: 'Social Share Image', description: 'OpenGraph / Twitter card preview' },
  { key: 'favicon', label: 'Favicon', description: 'Browser tab icon (PNG)' },
] as const;

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
  const ext = file.name.split('.').pop() || 'png';
  const path = `${assetKey}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (upErr) throw upErr;

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
