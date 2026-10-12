import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import DualOrbitLoader from './DualOrbitLoader';

const NAVY = '#003366';
const card = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
};

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const Kpi = ({ icon, label, value, hint, color = NAVY }) => (
  <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
      background: `${color}15`, color, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 18,
    }}>
      <i className={icon}></i>
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{hint}</div>}
    </div>
  </div>
);

const Empty = ({ text }) => (
  <div style={{ padding: '30px 10px', textAlign: 'center', color: '#999', fontSize: 14 }}>{text}</div>
);

const TrendChart = ({ points }) => {
  const W = 600, H = 200, P = { l: 30, r: 10, t: 12, b: 24 };
  const max = Math.max(1, ...points.map((p) => p.count));
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const x = (i) => P.l + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const y = (v) => P.t + ih - (v / max) * ih;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.count)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${P.t + ih} L${x(0)},${P.t + ih} Z`;
  const ticks = [0, Math.ceil(max / 2), max];
  const labelIdx = [0, Math.floor(points.length / 2), points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Enrollments trend">
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={P.l} x2={W - P.r} y1={y(tk)} y2={y(tk)} stroke="#eee" />
          <text x={P.l - 6} y={y(tk) + 4} fontSize="10" fill="#999" textAnchor="end">{tk}</text>
        </g>
      ))}
      <path d={area} fill={`${NAVY}18`} />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => p.count > 0 && (
        <circle key={p.key} cx={x(i)} cy={y(p.count)} r="3" fill={NAVY}><title>{`${p.key}: ${p.count}`}</title></circle>
      ))}
      {labelIdx.map((i) => (
        <text key={i} x={x(i)} y={H - 6} fontSize="10" fill="#999" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
          {points[i].key.slice(5)}
        </text>
      ))}
    </svg>
  );
};

const BarList = ({ rows, color = NAVY, format = (v) => v }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <strong style={{ color: '#1a1a2e', flexShrink: 0 }}>{format(r.value)}</strong>
          </div>
          <div style={{ height: 8, background: '#eef2f7', borderRadius: 99 }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [data, setData] = useState({ enrollments: [], courses: [], reviews: [], messages: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [e, c, r, m] = await Promise.all([
        supabase.from('enrollments').select('id,user_id,course_id,enrolled_at,progress,completed'),
        supabase.from('courses').select('id,title,category,price,students'),
        supabase.from('reviews').select('id,course_id,rating'),
        supabase.from('messages').select('id,created_at'),
      ]);
      if (!alive) return;
      setData({
        enrollments: e.data || [],
        courses: c.data || [],
        reviews: r.data || [],
        messages: m.data || [],
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const { enrollments, courses, reviews, messages } = data;
    const titleOf = (id) => courses.find((c) => c.id === id)?.title || `#${id}`;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (range - 1));

    const buckets = {};
    for (let i = 0; i < range; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets[dayKey(d)] = 0;
    }
    let inRange = 0;
    enrollments.forEach((en) => {
      if (!en.enrolled_at) return;
      const k = dayKey(en.enrolled_at);
      if (k in buckets) { buckets[k]++; inRange++; }
    });
    const trend = Object.entries(buckets).map(([key, count]) => ({ key, count }));

    const completed = enrollments.filter((e) => e.completed).length;
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (Number(e.progress) || 0), 0) / enrollments.length)
      : 0;
    const learners = new Set(enrollments.map((e) => e.user_id)).size;

    const perCourse = {};
    enrollments.forEach((e) => { perCourse[e.course_id] = (perCourse[e.course_id] || 0) + 1; });
    const topCourses = Object.entries(perCourse)
      .map(([id, value]) => ({ label: titleOf(Number(id) || id), value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);

    const rev = {};
    reviews.forEach((r) => {
      (rev[r.course_id] ||= []).push(Number(r.rating) || 0);
    });
    const allRatings = reviews.map((r) => Number(r.rating) || 0);
    const avgRating = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
    const ratings = Object.entries(rev)
      .map(([id, arr]) => ({ label: titleOf(Number(id) || id), value: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) }))
      .sort((a, b) => b.value - a.value).slice(0, 6);

    const cats = {};
    courses.forEach((c) => { const k = c.category || 'Other'; cats[k] = (cats[k] || 0) + (perCourse[c.id] || 0); });
    const categories = Object.entries(cats).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    const revenue = enrollments.reduce((s, e) => s + (Number(courses.find((c) => c.id === e.course_id)?.price) || 0), 0);

    const msgInRange = messages.filter((m) => m.created_at && new Date(m.created_at) >= since).length;

    return {
      trend, inRange, completed, avgProgress, learners, topCourses, ratings, avgRating,
      categories, revenue, msgInRange,
      total: enrollments.length,
      completionRate: enrollments.length ? Math.round((completed / enrollments.length) * 100) : 0,
    };
  }, [data, range]);

  if (loading) {
    return <div style={{ padding: 60 }}><DualOrbitLoader size={40} inline={false} /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Live data from your platform</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${NAVY}`,
                background: range === d ? NAVY : '#fff',
                color: range === d ? '#fff' : NAVY,
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Kpi icon="fas fa-user-graduate" label="Total enrollments" value={stats.total} hint={`${stats.inRange} in last ${range} days`} />
        <Kpi icon="fas fa-users" label="Active learners" value={stats.learners} color="#0e7c66" />
        <Kpi icon="fas fa-circle-check" label="Completion rate" value={`${stats.completionRate}%`} hint={`${stats.completed} completed`} color="#2e7d32" />
        <Kpi icon="fas fa-gauge-high" label="Average progress" value={`${stats.avgProgress}%`} color="#e67e22" />
        <Kpi icon="fas fa-star" label="Average rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} hint={`${data.reviews.length} reviews`} color="#f1b100" />
        <Kpi icon="fas fa-envelope" label="Contact messages" value={data.messages.length} hint={`${stats.msgInRange} in last ${range} days`} color="#8e44ad" />
      </div>

      <div style={{ ...card, marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 12px', color: NAVY, fontSize: 16 }}>Enrollments over time</h3>
        {stats.inRange === 0 ? <Empty text="No enrollments in this period" /> : <TrendChart points={stats.trend} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 16 }}>Top courses by enrollments</h3>
          {stats.topCourses.length ? <BarList rows={stats.topCourses} /> : <Empty text="No data yet" />}
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 16 }}>Highest rated courses</h3>
          {stats.ratings.length ? <BarList rows={stats.ratings} color="#f1b100" format={(v) => `${v} ★`} /> : <Empty text="No reviews yet" />}
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 16 }}>Enrollments by category</h3>
          {stats.categories.length ? <BarList rows={stats.categories} color="#0e7c66" /> : <Empty text="No data yet" />}
        </div>
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', color: NAVY, fontSize: 16 }}>Estimated revenue</h3>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e' }}>${stats.revenue.toLocaleString()}</div>
          <p style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
            Sum of course prices across all enrollments. Not actual payments (payments are not integrated yet).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
