import { describe, it, expect } from 'vitest';
import { translations } from '../i18n';

describe('translations', () => {
  const en = Object.keys(translations.en);
  const ar = Object.keys(translations.ar);

  it('every English key has an Arabic translation', () => {
    expect(en.filter((k) => !ar.includes(k))).toEqual([]);
  });

  it('every Arabic key has an English translation', () => {
    expect(ar.filter((k) => !en.includes(k))).toEqual([]);
  });

  it('no translation is empty', () => {
    for (const lang of ['en', 'ar']) {
      const empty = Object.entries(translations[lang]).filter(([, v]) => typeof v === 'string' && !v.trim());
      expect(empty.map(([k]) => k)).toEqual([]);
    }
  });
});
