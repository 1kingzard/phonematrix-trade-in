import { useEffect } from 'react';
import { useSiteMedia } from '@/services/mediaService';

/** Keeps <link rel="icon"> in sync with the uploaded favicon asset. */
const FaviconSync = () => {
  const { media } = useSiteMedia();
  const url = media['favicon']?.file_url;

  useEffect(() => {
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
    try {
      localStorage.setItem('site-favicon', url);
    } catch {}
  }, [url]);

  // On first mount, try cached favicon for instant paint
  useEffect(() => {
    try {
      const cached = localStorage.getItem('site-favicon');
      if (cached && !url) {
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = cached;
      }
    } catch {}
  }, []);

  return null;
};

export default FaviconSync;
