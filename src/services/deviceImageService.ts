import { useEffect, useState } from 'react';

/**
 * Fetches an official-looking image for a device by Brand + Model.
 *
 * Strategy (browser-only, no API keys, CORS-safe):
 *   1. Check localStorage cache (`pm_device_img:{brand}-{model}`).
 *   2. Query Wikipedia REST API for a page summary thumbnail.
 *      Wikipedia is CORS-enabled and returns clean product images for
 *      most mainstream phones (iPhone, Galaxy, Pixel, etc).
 *   3. On failure, return null and let the UI render a placeholder.
 *
 * URLs are cached forever (no TTL) — clear localStorage to refresh.
 */

const CACHE_PREFIX = 'pm_device_img:';
const NEGATIVE_VALUE = '__none__';

const cacheKey = (brand: string, model: string) =>
  `${CACHE_PREFIX}${brand.trim().toLowerCase()}-${model.trim().toLowerCase()}`;

export const getCachedDeviceImage = (brand: string, model: string): string | null | undefined => {
  if (typeof window === 'undefined') return undefined;
  const v = localStorage.getItem(cacheKey(brand, model));
  if (v === null) return undefined; // not yet fetched
  if (v === NEGATIVE_VALUE) return null; // fetched, no image
  return v;
};

const setCachedDeviceImage = (brand: string, model: string, url: string | null) => {
  try {
    localStorage.setItem(cacheKey(brand, model), url ?? NEGATIVE_VALUE);
  } catch {
    // localStorage full / disabled — ignore
  }
};

/**
 * Search Wikimedia Commons for a back-of-device image.
 * We bias the query toward "back" / "rear" / "back panel" so we get the
 * rear of the phone (where the cameras are) instead of the screen.
 */
const searchWikimediaForBack = async (brand: string, model: string): Promise<string | null> => {
  const queries = [
    `${brand} ${model} back`,
    `${brand} ${model} rear`,
    `${brand} ${model} back panel`,
  ];

  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?` + new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `${q} filetype:bitmap`,
      gsrlimit: '8',
      gsrnamespace: '6', // File namespace
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '600',
      origin: '*',
    }).toString();

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) continue;

      const candidates = Object.values(pages) as Array<{
        title?: string;
        imageinfo?: Array<{ url?: string; thumburl?: string }>;
      }>;

      // Prefer titles that mention "back" or "rear" explicitly
      const ranked = candidates
        .map((p) => {
          const title = (p.title || '').toLowerCase();
          const info = p.imageinfo?.[0];
          const src = info?.thumburl || info?.url;
          if (!src || !/\.(jpg|jpeg|png|webp)$/i.test(src)) return null;
          let score = 0;
          if (/\bback\b/.test(title)) score += 3;
          if (/\brear\b/.test(title)) score += 3;
          if (/back\s*panel|rear\s*panel|backside/.test(title)) score += 2;
          if (/\bfront\b|\bscreen\b|\bdisplay\b/.test(title)) score -= 5;
          return { src, score };
        })
        .filter((x): x is { src: string; score: number } => !!x)
        .sort((a, b) => b.score - a.score);

      const top = ranked[0];
      if (top && top.score > 0) return top.src;
    } catch {
      // try next query
    }
  }
  return null;
};

/**
 * Fallback: Wikipedia REST API summary thumbnail (usually shows the front).
 * Used only when no back-of-device image was found.
 */
const fetchFromWikipediaSummary = async (brand: string, model: string): Promise<string | null> => {
  const candidates = [
    `${brand} ${model}`,
    `${model}`,
    `${brand}_${model}`.replace(/\s+/g, '_'),
  ];

  for (const title of candidates) {
    const encoded = encodeURIComponent(title.replace(/\s+/g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data = await res.json();
      const src: string | undefined =
        data?.originalimage?.source || data?.thumbnail?.source;
      if (src && /\.(jpg|jpeg|png|webp|svg)/i.test(src)) {
        return src;
      }
    } catch {
      // try next
    }
  }
  return null;
};

export const fetchDeviceImage = async (brand: string, model: string): Promise<string | null> => {
  if (!brand || !model) return null;
  const cached = getCachedDeviceImage(brand, model);
  if (cached !== undefined) return cached;

  // Prefer back-of-device shot, fall back to Wikipedia summary thumbnail
  const result =
    (await searchWikimediaForBack(brand, model)) ??
    (await fetchFromWikipediaSummary(brand, model));

  setCachedDeviceImage(brand, model, result);
  return result;
};

/**
 * React hook — returns the image URL once resolved.
 * `loading` stays true until the first fetch settles.
 */
export const useDeviceImage = (brand: string, model: string) => {
  const initial = getCachedDeviceImage(brand, model);
  const [src, setSrc] = useState<string | null>(initial ?? null);
  const [loading, setLoading] = useState<boolean>(initial === undefined);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedDeviceImage(brand, model);
    if (cached !== undefined) {
      setSrc(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDeviceImage(brand, model)
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [brand, model]);

  return { src, loading };
};
