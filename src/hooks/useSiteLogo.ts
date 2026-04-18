import { useSiteMedia } from '@/services/mediaService';
import { useThemeMode } from './useThemeMode';

const FALLBACK_LIGHT = 'https://i.imgur.com/TcJEewx.png';
const FALLBACK_DARK = 'https://i.imgur.com/dAkmFGF.png';

/** Returns the correct logo URL for the active theme, with graceful fallback. */
export const useSiteLogo = (): string => {
  const mode = useThemeMode();
  const { media } = useSiteMedia();
  const light = media['logo-light']?.file_url;
  const dark = media['logo-dark']?.file_url;

  if (mode === 'dark') return dark || light || FALLBACK_DARK;
  return light || dark || FALLBACK_LIGHT;
};
