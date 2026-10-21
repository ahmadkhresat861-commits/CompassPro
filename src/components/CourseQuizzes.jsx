import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

const TXT = {
  en: {
    title: 'Quizzes', none: 'No quizzes yet.', pass: 'Pass mark', attempts: 'Attempts', unlimited: 'unlimited', start: 'Start quiz', retake: 'Retake',
    best: 'Best score', passed: 'Passed', notPassed: 'Not passed yet', submit: 'Submit answers', cancel: 'Cancel', loading: 'Loading…',
    answerAll: 'Please answer every question.', result: 'Your result', correct: 'correct', done: 'Close', noAttempts: 'No attempts left', yourAnswer: 'Your answer',
    right: 'Correct answer', counts: (a, b) => `${a} of ${b} passed — each passed quiz counts toward your course progress.`, empty: 'This quiz has no questions yet.',
  },
  ar: {
    title: 'الاختبارات', none: 'لا توجد اختبارات بعد.', pass: 'علامة النجاح', attempts: 'المحاولات', unlimited: 'غير محدودة', start: 'ابدأ الاختبار', retake: 'إعادة المحاولة',
    best: 'أفضل نتيجة', passed: 'ناجح', notPassed: 'لم تنجح بعد', submit: 'تسليم الإجابات', cancel: 'إلغاء', loading: 'جاري التحميل…',
    answerAll: 'الرجاء الإجابة عن جميع الأسئلة.', result: 'نتيجتك', correct: 'صحيحة', done: 'إغلاق', noAttempts: 'لا توجد محاولات متبقية', yourAnswer: 'إجابتك',
    right: 'الإجابة الصحيحة', counts: (a, b) => `نجحت في ${a} من ${b} — كل اختبار تنجح فيه يُحتسب ضمن تقدمك في المادة.`, empty: 'لا توجد أسئلة في هذا الاختبار بعد.',
  },
};

const CourseQuizzes = ({ courseId, userId, dm, onStats }) => {
  const { lang } = useLang();
  const x = TXT[lang] || TXT.en;
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [active, setActive] = useState(null); // { quiz, questions, answers, result }
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: q, error } = await supabase.from('quizzes').select('*').eq('course_id', courseId).eq('published', true).order('created_at');
    if (error) { setBroken(true); setLoaded(true); return; }
    setBroken(false);
    setQuizzes(q || []);
    const ids = (q || []).map((r) => r.id);
    if (!ids.length) { setAttempts({}); setLoaded(true); return; }
    const { data: a } = await supabase.from('quiz_attempts').select('quiz_id, score, passed').eq('student_id', userId).in('quiz_id', ids);
    const by = {};
    (a || []).forEach((r) => {
      const cur = by[r.quiz_id] || { n: 0, best: 0, passed: false };
      by[r.quiz_id] = { n: cur.n + 1, best: Math.max(cur.best, Number(r.score)), passed: cur.passed || r.passed };
    });
    setAttempts(by);
    setLoaded(true);
  }, [courseId, userId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!onStats) return;
    onStats({
      loaded,
      total: broken ? 0 : quizzes.length,
      done: broken ? 0 : quizzes.filter((q) => attempts[q.id]?.passed).length,
    });
  }, [quizzes, attempts, broken, loaded, onStats]);

  const start = async (quiz) => {
    setMsg(null);
    setBusy(true);
    const { data, error } = await supabase.rpc('get_quiz_questions', { qid: quiz.id });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    if (!data?.length) { setMsg({ ok: false, text: x.empty }); return; }
    setActive({ quiz, questions: data, answers: {}, result: null });
  };

  const submit = async () => {
    if (active.questions.some((q) => active.answers[q.id] === undefined)) { setMsg({ ok: false, text: x.answerAll }); return; }
    setMsg(null);
    setBusy(true);
    const { data, error } = await supabase.rpc('submit_quiz', { qid: active.quiz.id, answers: active.answers });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setActive({ ...active, result: data });
    load();
  };

  if (broken) return null;
  const chip = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800, marginInlineEnd: 6 });
  const btnStyle = { background: '#F0A500', color: '#003366', border: 'none', borderRadius: 999, padding: '9px 22px', fontWeight: 800, cursor: 'pointer' };

  return (
    <section aria-label={x.title} style={{ background: dm.reviewBg, borderRadius: 15, padding: 22, boxShadow: dm.shadow, marginBottom: 40, color: dm.text }}>
      <h2 style={{ color: dm.heading, margin: '0 0 14px', fontSize: '1.3rem' }}><i className="fas fa-question-circle" /> {x.title}</h2>
      {!quizzes.length && <p style={{ color: dm.subtext, margin: 0 }}>{x.none}</p>}
      {quizzes.length > 0 && <p style={{ color: dm.subtext, margin: '0 0 14px', fontSize: 13 }}>{x.counts(quizzes.filter((q) => attempts[q.id]?.passed).length, quizzes.length)}</p>}
      {msg && !active && <p role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600 }}>{msg.text}</p>}

      {quizzes.map((q) => {
        const at = attempts[q.id];
        const left = q.max_attempts == null ? null : q.max_attempts - (at?.n || 0);
        const isActive = active?.quiz.id === q.id;
        return (
          <div key={q.id} style={{ border: '1px solid rgba(0,51,102,0.12)', borderTop: '3px solid #0A5AA8', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <strong style={{ color: dm.heading, fontSize: '1.05rem' }}>{q.title}</strong>
            <div style={{ fontSize: 13, color: dm.subtext, marginTop: 4 }}>
              {x.pass}: {q.pass_score}% · {x.attempts}: {at?.n || 0}/{q.max_attempts ?? x.unlimited}
            </div>
            {q.description && <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, margin: '10px 0' }}>{q.description}</p>}
            <div style={{ margin: '8px 0' }}>
              {at ? (
                <>
                  <span style={chip('#E6F0FB', '#003366')}>{x.best}: {at.best}%</span>
                  <span style={at.passed ? chip('#E8F6EE', '#0a7a43') : chip('#FFF2D6', '#8a5a00')}>{at.passed ? x.passed : x.notPassed}</span>
                </>
              ) : null}
            </div>
            {!isActive && (left === null || left > 0) && (
              <button type="button" style={btnStyle} disabled={busy} onClick={() => start(q)}>{at ? x.retake : x.start}</button>
            )}
            {!isActive && left !== null && left <= 0 && <span style={{ color: dm.subtext, fontSize: 13 }}>{x.noAttempts}</span>}

            {isActive && !active.result && (
              <div style={{ marginTop: 12 }}>
                {active.questions.map((qq, n) => (
                  <fieldset key={qq.id} style={{ border: 'none', padding: 0, margin: '0 0 16px' }}>
                    <legend style={{ fontWeight: 700, color: dm.heading, marginBottom: 6 }}>{n + 1}. {qq.prompt}</legend>
                    {qq.options.map((o, i) => (
                      <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,51,102,0.15)', marginBottom: 6, cursor: 'pointer', background: active.answers[qq.id] === i ? 'rgba(240,165,0,0.18)' : 'transparent' }}>
                        <input type="radio" name={`q-${qq.id}`} checked={active.answers[qq.id] === i} onChange={() => setActive({ ...active, answers: { ...active.answers, [qq.id]: i } })} />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" style={btnStyle} disabled={busy} onClick={submit}>{busy ? x.loading : x.submit}</button>
                  <button type="button" style={{ ...btnStyle, background: 'transparent', border: '1px solid #CBD7E8', color: dm.heading }} onClick={() => { setActive(null); setMsg(null); }}>{x.cancel}</button>
                  {msg && <span role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14 }}>{msg.text}</span>}
                </div>
              </div>
            )}

            {isActive && active.result && (
              <div style={{ marginTop: 12, background: 'rgba(0,51,102,0.05)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: active.result.passed ? '#0a7a43' : '#b3261e' }}>
                  {x.result}: {active.result.score}% ({active.result.correct}/{active.result.total}) · {active.result.passed ? x.passed : x.notPassed}
                </div>
                {active.result.review.map((r, n) => {
                  const qq = active.questions.find((k) => k.id === r.question_id);
                  if (!qq) return null;
                  return (
                    <div key={r.question_id} style={{ marginTop: 10, fontSize: 14 }}>
                      <strong>{n + 1}. {qq.prompt}</strong>
                      <div style={{ color: r.is_correct ? '#0a7a43' : '#b3261e' }}>
                        {r.is_correct ? '✓' : '✗'} {x.yourAnswer}: {r.chosen != null ? qq.options[r.chosen] : '—'}
                      </div>
                      {!r.is_correct && r.correct_index != null && <div style={{ color: '#0a7a43' }}>{x.right}: {qq.options[r.correct_index]}</div>}
                    </div>
                  );
                })}
                <button type="button" style={{ ...btnStyle, marginTop: 14 }} onClick={() => setActive(null)}>{x.done}</button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default CourseQuizzes;
