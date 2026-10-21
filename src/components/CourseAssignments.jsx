import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

const TXT = {
  en: {
    title: 'Assignments', none: 'No assignments yet.', due: 'Due', max: 'Max mark', late: 'Late', graded: 'Graded',
    submitted: 'Submitted', notGraded: 'Waiting for the instructor to grade', file: 'Your file', note: 'Note to the instructor (optional)',
    submit: 'Submit', resubmit: 'Replace submission', uploading: 'Uploading…', feedback: 'Instructor notes',
    chooseFile: 'Choose a file first.', tooBig: (m) => `File is too large (max ${m}MB).`, videoOk: 'Video allowed (up to 50MB). Other files up to 10MB.',
    filesOnly: 'Files up to 10MB.', noVideo: 'Video files are not allowed for this assignment.', open: 'Open my file', done: 'Submitted successfully.',
    locked: 'Graded submissions can no longer be changed.', counts: (a, b) => `${a} of ${b} submitted — each submission counts toward your course progress.`, attached: 'Files from your instructor', setup: 'Assignments are not set up yet.',
  },
  ar: {
    title: 'الواجبات', none: 'لا توجد واجبات بعد.', due: 'آخر موعد', max: 'العلامة العظمى', late: 'متأخر', graded: 'تم التصحيح',
    submitted: 'تم التسليم', notGraded: 'بانتظار تصحيح المدرب', file: 'ملفك', note: 'ملاحظة للمدرب (اختياري)',
    submit: 'تسليم', resubmit: 'استبدال التسليم', uploading: 'جاري الرفع…', feedback: 'ملاحظات المدرب',
    chooseFile: 'اختر ملفاً أولاً.', tooBig: (m) => `حجم الملف كبير (الحد الأقصى ${m} ميغابايت).`, videoOk: 'يُسمح بالفيديو (حتى 50 ميغابايت). باقي الملفات حتى 10 ميغابايت.',
    filesOnly: 'ملفات حتى 10 ميغابايت.', noVideo: 'ملفات الفيديو غير مسموحة في هذا الواجب.', open: 'فتح ملفي', done: 'تم التسليم بنجاح.',
    locked: 'لا يمكن تعديل تسليم تم تصحيحه.', counts: (a, b) => `تم تسليم ${a} من ${b} — كل واجب تسلّمه يُحتسب ضمن تقدمك في المادة.`, attached: 'ملفات من المدرب', setup: 'الواجبات غير مفعّلة بعد.',
  },
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const CourseAssignments = ({ courseId, userId, dm, onStats }) => {
  const { lang } = useLang();
  const x = TXT[lang] || TXT.en;
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState({});
  const [atts, setAtts] = useState({});
  const [files, setFiles] = useState({});
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(null);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data: a, error } = await supabase.from('assignments').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (error) { setBroken(true); setLoaded(true); return; }
    setBroken(false);
    setItems(a || []);
    const ids = (a || []).map((r) => r.id);
    if (!ids.length) { setSubs({}); setAtts({}); setLoaded(true); return; }
    const { data: af } = await supabase.from('assignment_files').select('*').in('assignment_id', ids).order('created_at');
    const by = {};
    (af || []).forEach((f) => { (by[f.assignment_id] = by[f.assignment_id] || []).push(f); });
    setAtts(by);
    const { data: s } = await supabase.from('submissions').select('*').eq('student_id', userId).in('assignment_id', ids);
    setSubs(Object.fromEntries((s || []).map((r) => [r.assignment_id, r])));
    setLoaded(true);
  }, [courseId, userId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const submit = async (a) => {
    const f = files[a.id];
    const say = (ok, text) => setMsg((m) => ({ ...m, [a.id]: { ok, text } }));
    if (!f) { say(false, x.chooseFile); return; }
    const isVideo = (f.type || '').startsWith('video/');
    if (isVideo && !a.allow_video) { say(false, x.noVideo); return; }
    const maxMb = isVideo ? 50 : 10;
    if (f.size > maxMb * 1048576) { say(false, x.tooBig(maxMb)); return; }
    setBusy(a.id);
    const safe = f.name.replace(/[^\w.-]+/g, '_');
    const path = `${a.id}/${userId}/${new Date().getTime()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('submissions').upload(path, f, { contentType: f.type || undefined });
    if (upErr) { setBusy(null); say(false, upErr.message); return; }
    const row = { assignment_id: a.id, student_id: userId, file_path: path, file_name: f.name, file_type: f.type || null, file_size: f.size, comment: (notes[a.id] || '').trim() || null };
    const prev = subs[a.id];
    const { error } = prev
      ? await supabase.from('submissions').update(row).eq('id', prev.id)
      : await supabase.from('submissions').insert(row);
    if (error) {
      await supabase.storage.from('submissions').remove([path]);
      setBusy(null); say(false, error.message); return;
    }
    if (prev?.file_path) await supabase.storage.from('submissions').remove([prev.file_path]);
    setBusy(null);
    setFiles((p) => ({ ...p, [a.id]: null }));
    say(true, x.done);
    load();
  };

  const openAtt = async (f) => {
    const { data } = await supabase.storage.from('assignment-files').createSignedUrl(f.file_path, 3600, { download: f.file_name || true });
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };

  const open = async (s) => {
    const { data } = await supabase.storage.from('submissions').createSignedUrl(s.file_path, 3600, { download: s.file_name || true });
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  };

  useEffect(() => {
    if (!onStats || broken) return;
    onStats({ loaded: loaded, total: items.length, submitted: items.filter((a) => subs[a.id]).length });
  }, [items, subs, broken, loaded, onStats]);

  if (broken) return null;
  const chip = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800, marginInlineEnd: 6 });

  return (
    <section aria-label={x.title} style={{ background: dm.reviewBg, borderRadius: 15, padding: 22, boxShadow: dm.shadow, marginBottom: 40, color: dm.text }}>
      <h2 style={{ color: dm.heading, margin: '0 0 14px', fontSize: '1.3rem' }}><i className="fas fa-tasks" /> {x.title}</h2>
      {!items.length && <p style={{ color: dm.subtext, margin: 0 }}>{x.none}</p>}
      {items.length > 0 && <p style={{ color: dm.subtext, margin: '0 0 14px', fontSize: 13 }}>{x.counts(items.filter((a) => subs[a.id]).length, items.length)}</p>}
      {items.map((a) => {
        const s = subs[a.id];
        const late = s && a.due_at && new Date(s.submitted_at).getTime() > new Date(a.due_at).getTime();
        const locked = !!s?.graded_at;
        return (
          <div key={a.id} style={{ border: '1px solid rgba(0,51,102,0.12)', borderTop: '3px solid #F0A500', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <strong style={{ color: dm.heading, fontSize: '1.05rem' }}>{a.title}</strong>
            <div style={{ fontSize: 13, color: dm.subtext, marginTop: 4 }}>
              {x.due}: {fmt(a.due_at)} · {x.max}: {a.max_score}
            </div>
            {a.description && <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, margin: '10px 0' }}>{a.description}</p>}
            {(atts[a.id] || []).length > 0 && (
              <div style={{ margin: '10px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: dm.subtext, marginBottom: 6 }}>{x.attached}</div>
                {atts[a.id].map((f) => (
                  <button key={f.id} type="button" onClick={() => openAtt(f)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 8px 8px 0', padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(0,51,102,0.18)', background: 'rgba(0,51,102,0.05)', color: dm.heading, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    <i className="fas fa-paperclip" /> {f.file_name}
                  </button>
                ))}
              </div>
            )}
            {s && (
              <div style={{ background: 'rgba(0,51,102,0.05)', borderRadius: 12, padding: 12, margin: '10px 0' }}>
                <span style={chip('#E6F0FB', '#003366')}>{x.submitted} · {fmt(s.submitted_at)}</span>
                {late && <span style={chip('#FDE7E7', '#b3261e')}>{x.late}</span>}
                {locked
                  ? <span style={chip('#E8F6EE', '#0a7a43')}>{x.graded}: {s.score}/{a.max_score}</span>
                  : <span style={chip('#FFF2D6', '#8a5a00')}>{x.notGraded}</span>}
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => open(s)} style={{ background: 'none', border: 'none', color: dm.heading, fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    {x.open}{s.file_name ? `: ${s.file_name}` : ''}
                  </button>
                </div>
                {locked && s.feedback && <p style={{ margin: '10px 0 0' }}><strong>{x.feedback}:</strong> {s.feedback}</p>}
              </div>
            )}
            {locked ? (
              <p style={{ color: dm.subtext, fontSize: 13, margin: 0 }}>{x.locked}</p>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: dm.subtext, margin: '8px 0 4px' }} htmlFor={`f-${a.id}`}>
                  {x.file} — {a.allow_video ? x.videoOk : x.filesOnly}
                </label>
                <input id={`f-${a.id}`} type="file" accept={a.allow_video ? undefined : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg,.java,.py,.js,.html,.css,.cpp,.c'}
                  onChange={(e) => setFiles((p) => ({ ...p, [a.id]: e.target.files?.[0] || null }))} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: dm.subtext, margin: '10px 0 4px' }} htmlFor={`n-${a.id}`}>{x.note}</label>
                <input id={`n-${a.id}`} value={notes[a.id] || ''} onChange={(e) => setNotes((p) => ({ ...p, [a.id]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #CBD7E8', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" disabled={busy === a.id} onClick={() => submit(a)}
                    style={{ background: '#F0A500', color: '#003366', border: 'none', borderRadius: 999, padding: '9px 22px', fontWeight: 800, cursor: 'pointer' }}>
                    {busy === a.id ? x.uploading : (s ? x.resubmit : x.submit)}
                  </button>
                  {msg[a.id] && <span role="status" style={{ color: msg[a.id].ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14 }}>{msg[a.id].text}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default CourseAssignments;
