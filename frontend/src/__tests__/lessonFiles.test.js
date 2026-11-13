import { describe, it, expect, vi } from 'vitest';

vi.mock('../supabase', () => ({ supabase: {} }));
const { lessonFilePath } = await import('../utils/lessonFiles');

describe('lessonFilePath', () => {
  it('returns a storage path unchanged', () => {
    expect(lessonFilePath('8/123.pdf')).toBe('8/123.pdf');
  });

  it('extracts the path from a legacy public URL', () => {
    const url = 'https://x.supabase.co/storage/v1/object/public/lesson-files/8/123.pdf';
    expect(lessonFilePath(url)).toBe('8/123.pdf');
  });

  it('decodes encoded names and ignores query strings', () => {
    const url = 'https://x.supabase.co/storage/v1/object/sign/lesson-files/8/my%20file.pdf?token=abc';
    expect(lessonFilePath(url)).toBe('8/my file.pdf');
  });

  it('returns null for empty values', () => {
    expect(lessonFilePath('')).toBeNull();
    expect(lessonFilePath(null)).toBeNull();
  });
});
