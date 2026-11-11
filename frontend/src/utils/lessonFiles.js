import { supabase } from '../supabase';

// Accepts a storage path ("8/123.pdf") or a legacy public URL and returns the path.
export function lessonFilePath(value) {
  if (!value) return null;
  const m = String(value).match(/\/lesson-files\/(.+?)(?:\?.*)?$/);
  return m ? decodeURIComponent(m[1]) : value;
}

// Opens a private lesson file via a short-lived signed URL.
export async function openLessonFile(value) {
  const path = lessonFilePath(value);
  if (!path) return;
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;
  const { data, error } = await supabase.storage.from('lesson-files').createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    if (win) win.close();
    alert('تعذّر فتح الملف / Could not open the file');
    return;
  }
  if (win) win.location.href = data.signedUrl;
  else window.location.href = data.signedUrl;
}
