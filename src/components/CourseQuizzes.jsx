import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

const TXT = {
  en: {
    title: 'Quizzes', none: 'No quizzes yet.', pass: 'Pass mark', attempts: 'Attempts', unlimited: 'unlimited', start: 'Start quiz', retake: 'Retake',
    best: 'Best score', passed: 'Passed', notPassed: 'Not passed yet', submit: 'Submit answers', cancel: 'Cancel', loading: 'Loading…',
    answerAll: 'Please answer every question.', result: 'Your result', done: 'Close', noAttempts: 'No attempts left', yourAnswer: 'Your answer',
    right: 'Correct answer', counts: (a, b) => `${a} of ${b} passed — each passed quiz counts toward your course progress.`, empty: 'This quiz has no questions yet.',
    pwTitle: 'This quiz is password protected', pwLabel: 'Quiz password', pwGo: 'Continue', pwHint: 'Ask your instructor for the password.',
    waiting: 'Waiting for your instructor to grade the written answers', waitingShort: 'Waiting for grading',
    submittedWritten: 'Submitted. Your written answers will be graded by your instructor.', mcqPoints: 'Multiple-choice points so far', written: 'Written answer', pts: 'pt',
    typeHere: 'Type your answer here…', instructorNotes: 'Instructor notes', cheatTitle: 'Exam mode',
    cheatInfo: 'Copy, paste and right-click are disabled, and leaving this page is recorded for your instructor.',
    leftWarn: (n) => `You left this page ${n} time(s). This is recorded for your instructor.`,
    timeLimit: 'Time', min: 'min', noLimit: 'no limit', timeLeft: 'Time left', timeUpAuto: 'Time is up — your answers were submitted automatically.',
    expired: 'Time is up — this submission arrived after the time limit and was not accepted.', timerNote: 'The timer is kept by the server; refreshing the page does not reset it.',
  },
  ar: {
    title: 'الاختبارات', none: 'لا توجد اختبارات بعد.', pass: 'علامة النجاح', attempts: 'المحاولات', unlimited: 'غير محدودة', start: 'ابدأ الاختبار', retake: 'إعادة المحاولة',
    best: 'أفضل نتيجة', passed: 'ناجح', notPassed: 'لم تنجح بعد', submit: 'تسليم الإجابات', cancel: 'إلغاء', loading: 'جاري التحميل…',
    answerAll: 'الرجاء الإجابة عن جميع الأسئلة.', result: 'نتيجتك', done: 'إغلاق', noAttempts: 'لا توجد محاولات متبقية', yourAnswer: 'إجابتك',
    right: 'الإجابة الصحيحة', counts: (a, b) => `نجحت في ${a} من ${b} — كل اختبار تنجح فيه يُحتسب ضمن تقدمك في المادة.`, empty: 'لا توجد أسئلة في هذا الاختبار بعد.',
    pwTitle: 'هذا الاختبار محمي بكلمة سر', pwLabel: 'كلمة سر الاختبار', pwGo: 'متابعة', pwHint: 'اطلب كلمة السر من مدرّبك.',
    waiting: 'بانتظار تصحيح المدرب للإجابات الكتابية', waitingShort: 'بانتظار التصحيح',
    submittedWritten: 'تم التسليم. سيصحح المدرب إجاباتك الكتابية.', mcqPoints: 'نقاط الاختيار من متعدد حتى الآن', written: 'إجابة كتابية', pts: 'نقطة',
    typeHere: 'اكتب إجابتك هنا…', instructorNotes: 'ملاحظات المدرب', cheatTitle: 'وضع الاختبار',
    cheatInfo: 'النسخ واللصق والنقر بالزر الأيمن معطّلة، ومغادرتك لهذه الصفحة تُسجَّل للمدرب.',
    leftWarn: (n) => `غادرت هذه الصفحة ${n} مرة. يتم تسجيل ذلك للمدرب.`,
    timeLimit: 'الوقت', min: 'دقيقة', noLimit: 'بدون حد', timeLeft: 'الوقت المتبقي', timeUpAuto: 'انتهى الوقت — تم تسليم إجاباتك تلقائياً.',
    expired: 'انتهى الوقت — وصل هذا التسليم بعد انتهاء المدة ولم يُقبل.', timerNote: 'المؤقت محفوظ على السيرفر، وتحديث الصفحة لا يعيد ضبطه.',
  },
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const CourseQuizzes = ({ courseId, userId, dm, onStats }) => {
  const { lang } = useLang();
  const x = TXT[lang] || TXT.en;
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [active, setActive] = useState(null); // { quiz, pwd, questions, answers, result }
  const [pwAsk, setPwAsk] = useState(null); // { quiz, value }
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [leftCount, setLeftCount] = useState(0);
  const leftRef = useRef(0);
  const activeRef = useRef(null);
  const autoRef = useRef(false);
  const [remaining, setRemaining] = useState(null);

  const load = useCallback(async () => {
    const { data: q, error } = await supabase.from('quizzes').select('*').eq('course_id', courseId).eq('published', true).order('created_at');
    if (error) { setBroken(true); setLoaded(true); return; }
    setBroken(false);
    setQuizzes(q || []);
    const ids = (q || []).map((r) => r.id);
    if (!ids.length) { setAttempts({}); setLoaded(true); return; }
    const { data: a } = await supabase.from('quiz_attempts').select('quiz_id, score, passed, needs_grading, feedback, submitted_at').eq('student_id', userId).in('quiz_id', ids).order('submitted_at', { ascending: false });
    const by = {};
    (a || []).forEach((r) => {
      const cur = by[r.quiz_id] || { n: 0, best: null, passed: false, pending: false, feedback: null };
      if (cur.n === 0 && r.feedback) cur.feedback = r.feedback;
      by[r.quiz_id] = {
        n: cur.n + 1,
        best: r.score == null ? cur.best : Math.max(cur.best ?? 0, Number(r.score)),
        passed: cur.passed || r.passed === true,
        pending: cur.pending || r.needs_grading === true,
        feedback: cur.feedback,
      };
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

  // Anti-cheat: record leaving the page while a quiz is open
  const guarded = !!(active && !active.result && active.quiz.anti_cheat);
  useEffect(() => {
    if (!guarded) return undefined;
    let last = 0;
    const bump = () => {
      const now = new Date().getTime();
      if (now - last < 1000) return; // blur + visibilitychange fire together on a tab switch
      last = now;
      leftRef.current += 1;
      setLeftCount(leftRef.current);
    };
    const onVis = () => { if (document.hidden) bump(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', bump);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('blur', bump); };
  }, [guarded]);

  const begin = async (quiz, pwd) => {
    setMsg(null);
    setBusy(true);
    const { data, error } = await supabase.rpc('get_quiz_questions', { qid: quiz.id, pwd: pwd || null });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: /password/i.test(error.message) ? (lang === 'ar' ? 'كلمة السر غير صحيحة.' : 'Wrong quiz password.') : error.message }); return false; }
    if (!data?.questions?.length) { setMsg({ ok: false, text: x.empty }); return false; }
    leftRef.current = 0; setLeftCount(0);
    autoRef.current = false;
    setPwAsk(null);
    const offset = data.server_now ? new Date(data.server_now).getTime() - new Date().getTime() : 0;
    const ends = data.ends_at ? new Date(data.ends_at).getTime() - offset : null;
    setRemaining(ends ? Math.max(0, Math.ceil((ends - new Date().getTime()) / 1000)) : null);
    setActive({ quiz, pwd: pwd || null, ends, questions: quiz.anti_cheat ? shuffle(data.questions) : data.questions, answers: {}, result: null });
    return true;
  };

  const start = (quiz) => {
    setMsg(null);
    if (quiz.has_password) { setPwAsk({ quiz, value: '' }); return; }
    begin(quiz, null);
  };

  const answered = (q) => {
    const v = active.answers[q.id];
    return q.kind === 'written' ? typeof v === 'string' && v.trim() !== '' : v !== undefined;
  };

  const submit = async (auto = false) => {
    const cur = activeRef.current || active;
    if (!auto && cur.questions.some((q) => !answered(q))) { setMsg({ ok: false, text: x.answerAll }); return; }
    setMsg(null);
    setBusy(true);
    const { data, error } = await supabase.rpc('submit_quiz', { qid: cur.quiz.id, answers: cur.answers, pwd: cur.pwd, left_page: leftRef.current });
    setBusy(false);
    if (error) {
      if (/Start the quiz first/i.test(error.message)) {
        setRemaining(null); setActive(null);
        setMsg({ ok: false, text: lang === 'ar' ? 'انتهت جلسة الاختبار. ابدأ الاختبار من جديد.' : 'Your quiz session is no longer open. Please start the quiz again.' });
        return;
      }
      setMsg({ ok: false, text: error.message });
      return;
    }
    setRemaining(null);
    setActive({ ...cur, result: data, auto });
    load();
  };

  useEffect(() => { activeRef.current = active; }, [active]);

  // Countdown (server decides; this is only the display + auto-submit at zero)
  const timed = !!(active && !active.result && active.ends);
  useEffect(() => {
    if (!timed) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((activeRef.current.ends - new Date().getTime()) / 1000));
      setRemaining(left);
      if (left === 0 && !autoRef.current) { autoRef.current = true; submit(true); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed]);

  const clock = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  if (broken) return null;
  const chip = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800, marginInlineEnd: 6 });
  const btnStyle = { background: '#F0A500', color: '#003366', border: 'none', borderRadius: 999, padding: '9px 22px', fontWeight: 800, cursor: 'pointer' };
  const ghost = { ...btnStyle, background: 'transparent', border: '1px solid #CBD7E8', color: dm.heading };
  const block = (e) => e.preventDefault();

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
        const asking = pwAsk?.quiz.id === q.id;
        return (
          <div key={q.id} style={{ border: '1px solid rgba(0,51,102,0.12)', borderTop: '3px solid #0A5AA8', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <strong style={{ color: dm.heading, fontSize: '1.05rem' }}>{q.title}</strong>{' '}
            {q.has_password && <i className="fas fa-lock" title={x.pwTitle} style={{ color: dm.subtext }} />}
            <div style={{ fontSize: 13, color: dm.subtext, marginTop: 4 }}>
              {x.pass}: {q.pass_score}% · {x.attempts}: {at?.n || 0}/{q.max_attempts ?? x.unlimited} · {x.timeLimit}: {q.time_limit_min ? `${q.time_limit_min} ${x.min}` : x.noLimit}
            </div>
            {q.description && <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, margin: '10px 0' }}>{q.description}</p>}
            <div style={{ margin: '8px 0' }}>
              {at && (
                <>
                  {at.best != null && <span style={chip('#E6F0FB', '#003366')}>{x.best}: {at.best}%</span>}
                  {at.passed
                    ? <span style={chip('#E8F6EE', '#0a7a43')}>{x.passed}</span>
                    : at.pending
                      ? <span style={chip('#FFF2D6', '#b35c00')}>{x.waitingShort}</span>
                      : <span style={chip('#FFF2D6', '#8a5a00')}>{x.notPassed}</span>}
                </>
              )}
              {at?.feedback && <p style={{ margin: '8px 0 0', fontSize: 14 }}><strong>{x.instructorNotes}:</strong> {at.feedback}</p>}
            </div>

            {!isActive && !asking && (left === null || left > 0) && (
              <button type="button" style={btnStyle} disabled={busy} onClick={() => start(q)}>{at ? x.retake : x.start}</button>
            )}
            {!isActive && left !== null && left <= 0 && <span style={{ color: dm.subtext, fontSize: 13 }}>{x.noAttempts}</span>}

            {asking && (
              <form onSubmit={(e) => { e.preventDefault(); begin(q, pwAsk.value); }} style={{ marginTop: 8 }}>
                <label htmlFor={`pw-${q.id}`} style={{ display: 'block', fontWeight: 700, color: dm.heading, marginBottom: 6 }}><i className="fas fa-lock" /> {x.pwTitle}</label>
                <input id={`pw-${q.id}`} type="password" autoComplete="off" value={pwAsk.value} onChange={(e) => setPwAsk({ ...pwAsk, value: e.target.value })}
                  placeholder={x.pwLabel} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #CBD7E8', minWidth: 220, fontFamily: 'inherit' }} />
                <div style={{ fontSize: 12, color: dm.subtext, margin: '6px 0 10px' }}>{x.pwHint}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="submit" style={btnStyle} disabled={busy || !pwAsk.value.trim()}>{busy ? x.loading : x.pwGo}</button>
                  <button type="button" style={ghost} onClick={() => { setPwAsk(null); setMsg(null); }}>{x.cancel}</button>
                  {msg && <span role="status" style={{ color: '#b3261e', fontWeight: 600, fontSize: 14 }}>{msg.text}</span>}
                </div>
              </form>
            )}

            {isActive && !active.result && (
              <div
                style={{ marginTop: 12 }}
                onCopy={q.anti_cheat ? block : undefined}
                onCut={q.anti_cheat ? block : undefined}
                onPaste={q.anti_cheat ? block : undefined}
                onContextMenu={q.anti_cheat ? block : undefined}
                onDragStart={q.anti_cheat ? block : undefined}
              >
                {remaining !== null && (
                  <div role="timer" aria-live="off" style={{ position: 'sticky', top: 8, zIndex: 5, display: 'inline-block', background: remaining <= 60 ? '#b3261e' : '#003366', color: '#fff', borderRadius: 999, padding: '6px 16px', fontWeight: 800, marginBottom: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                    <i className="fas fa-clock" /> {x.timeLeft}: {clock(remaining)}
                    <div style={{ fontWeight: 500, fontSize: 11, opacity: 0.85 }}>{x.timerNote}</div>
                  </div>
                )}
                {q.anti_cheat && (
                  <div role="note" style={{ background: 'rgba(240,165,0,0.15)', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
                    <strong><i className="fas fa-shield-alt" /> {x.cheatTitle}:</strong> {x.cheatInfo}
                    {leftCount > 0 && <div style={{ color: '#b3261e', fontWeight: 700, marginTop: 4 }}>⚠ {x.leftWarn(leftCount)}</div>}
                  </div>
                )}
                {active.questions.map((qq, n) => (
                  <fieldset key={qq.id} style={{ border: 'none', padding: 0, margin: '0 0 16px' }}>
                    <legend style={{ fontWeight: 700, color: dm.heading, marginBottom: 6, userSelect: q.anti_cheat ? 'none' : 'auto', WebkitUserSelect: q.anti_cheat ? 'none' : 'auto' }}>
                      {n + 1}. {qq.prompt} <span style={{ fontWeight: 600, fontSize: 12, color: dm.subtext }}>({qq.points} {x.pts})</span>
                    </legend>
                    {qq.kind === 'written' ? (
                      <textarea
                        aria-label={`${x.written} ${n + 1}`}
                        rows={5}
                        placeholder={x.typeHere}
                        value={active.answers[qq.id] || ''}
                        onChange={(e) => setActive({ ...active, answers: { ...active.answers, [qq.id]: e.target.value } })}
                        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD7E8', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
                      />
                    ) : (qq.options || []).map((o, i) => (
                      <label key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,51,102,0.15)', marginBottom: 6, cursor: 'pointer', userSelect: q.anti_cheat ? 'none' : 'auto', WebkitUserSelect: q.anti_cheat ? 'none' : 'auto', background: active.answers[qq.id] === i ? 'rgba(240,165,0,0.18)' : 'transparent' }}>
                        <input type="radio" name={`q-${qq.id}`} checked={active.answers[qq.id] === i} onChange={() => setActive({ ...active, answers: { ...active.answers, [qq.id]: i } })} />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" style={btnStyle} disabled={busy} onClick={() => submit(false)}>{busy ? x.loading : x.submit}</button>
                  <button type="button" style={ghost} onClick={() => { setActive(null); setMsg(null); }}>{x.cancel}</button>
                  {msg && <span role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14 }}>{msg.text}</span>}
                </div>
              </div>
            )}

            {isActive && active.result && (
              <div style={{ marginTop: 12, background: 'rgba(0,51,102,0.05)', borderRadius: 12, padding: 14 }}>
                {active.result.expired ? (
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#b3261e' }}>{x.expired}</div>
                ) : active.result.needs_grading ? (
                  <>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b35c00' }}>{x.submittedWritten}</div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>{x.mcqPoints}: {active.result.auto_points}/{active.result.max_points}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: active.result.passed ? '#0a7a43' : '#b3261e' }}>
                    {x.result}: {active.result.score}% · {active.result.passed ? x.passed : x.notPassed}
                  </div>
                )}
                {active.auto && !active.result.expired && <div style={{ fontSize: 13, color: '#b35c00', margin: '6px 0' }}>{x.timeUpAuto}</div>}
                {(active.result.review || []).filter((r) => r.kind === 'mcq').map((r) => {
                  const qq = active.questions.find((k) => k.id === r.question_id);
                  if (!qq) return null;
                  return (
                    <div key={r.question_id} style={{ marginTop: 10, fontSize: 14 }}>
                      <strong>{qq.prompt}</strong>
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
