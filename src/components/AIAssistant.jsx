import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

const AIAssistant = () => {
  const { darkMode } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 مرحباً! أنا مساعدك الذكي في Zephyr Academy. كيف أقدر أساعدك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const dm = {
    bg:          darkMode ? '#1e2130' : 'white',
    header:      'linear-gradient(135deg, #003366, #005599)',
    inputBg:     darkMode ? '#262a3e' : '#f5f7fa',
    inputBorder: darkMode ? '#3a4060' : '#ddd',
    inputColor:  darkMode ? '#e0e6f0' : '#333',
    userBubble:  'linear-gradient(135deg, #003366, #005599)',
    aiBubble:    darkMode ? '#262a3e' : '#f0f4ff',
    aiText:      darkMode ? '#c8d0e0' : '#333',
    shadow:      darkMode ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,51,102,0.2)',
    border:      darkMode ? '#2e3250' : '#e8edf5',
    time:        darkMode ? '#5a6480' : '#aab',
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('zephyr-ai', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const reply = data?.content?.map(b => b.text).join('') || 'عذراً، حدث خطأ. حاول مرة أخرى.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ تعذّر الاتصال. تحقق من الإنترنت وحاول مجدداً.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = () => new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px',
          width: '370px', height: '520px',
          background: dm.bg, borderRadius: '20px',
          boxShadow: dm.shadow, border: `1px solid ${dm.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          animation: 'slideUp 0.25s ease',
        }}>

          {/* Header */}
          <div style={{ background: dm.header, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🤖
              </div>
              <div>
                <p style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '0.95rem' }}>Zephyr AI</p>
                <p style={{ margin: 0, color: '#a8c8f0', fontSize: '0.75rem' }}>
                  <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', marginRight: '5px' }}></span>
                  متصل الآن
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMessages([{ role: 'assistant', content: '👋 مرحباً! كيف أقدر أساعدك؟' }])}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.85rem' }}
                title="مسح المحادثة">
                🗑️
              </button>
              <button onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', fontWeight: '700' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? dm.userBubble : dm.aiBubble,
                  color: msg.role === 'user' ? 'white' : dm.aiText,
                  fontSize: '0.9rem', lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '0.7rem', color: dm.time, marginTop: '3px', paddingInline: '4px' }}>
                  {formatTime()}
                </span>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: dm.aiBubble, borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(n => (
                    <span key={n} style={{
                      width: '7px', height: '7px', borderRadius: '50%', background: '#003366',
                      display: 'inline-block', opacity: 0.4,
                      animation: `bounce 1s ease ${n * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${dm.border}`, display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="اكتب سؤالك هنا..."
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '12px',
                border: `1px solid ${dm.inputBorder}`, background: dm.inputBg,
                color: dm.inputColor, fontSize: '0.9rem', resize: 'none',
                outline: 'none', fontFamily: 'inherit', lineHeight: '1.4',
                maxHeight: '80px', overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #003366, #005599)' : (darkMode ? '#2a2a3a' : '#ddd'),
                border: 'none', color: 'white', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '58px', height: '58px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #003366, #005599)',
          border: 'none', color: 'white', cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(0,51,102,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', zIndex: 9999,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,51,102,0.5)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,51,102,0.4)'; }}
        title="AI Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
