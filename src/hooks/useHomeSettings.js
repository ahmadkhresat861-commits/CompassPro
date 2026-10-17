import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Defaults mirror the current Home page. Empty text = use the built-in translation.
export const HOME_DEFAULTS = {
  hero: { title1_en: '', title2_en: '', sub_en: '', title1_ar: '', title2_ar: '', sub_ar: '' },
  sections: { stats: true, popular: true, available: true, why: true, cta: true },
  popularIds: [],
  availableCount: 6,
  cta: { title_en: '', sub_en: '', title_ar: '', sub_ar: '' },
};

export const defaultsFor = (key) => (key === 'landing' ? HOME_DEFAULTS : { ...HOME_DEFAULTS, availableCount: 3 });

export const mergeHome = (saved, key = 'home') => ({
  ...defaultsFor(key),
  ...(saved || {}),
  hero: { ...HOME_DEFAULTS.hero, ...(saved?.hero || {}) },
  sections: { ...HOME_DEFAULTS.sections, ...(saved?.sections || {}) },
  cta: { ...HOME_DEFAULTS.cta, ...(saved?.cta || {}) },
  popularIds: Array.isArray(saved?.popularIds) ? saved.popularIds : [],
});

export function useHomeSettings(key = 'home') {
  const [settings, setSettings] = useState(() => defaultsFor(key));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();
        if (alive && !error && data?.value) setSettings(mergeHome(data.value, key));
      } catch {
        /* table missing or offline: keep defaults */
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [key]);

  return { settings, loaded };
}
