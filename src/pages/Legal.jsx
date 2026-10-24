import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

// Privacy Policy and Terms of Use (EN / AR). Content lives here so the
// wording stays next to the page; update LAST_UPDATED when it changes.
const LAST_UPDATED = { en: 'October 2026', ar: 'أكتوبر 2026' };

const CONTENT = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      intro:
        'CompassPro is an online learning platform. This policy explains what personal data we collect, why we collect it, and the choices you have.',
      sections: [
        {
          h: 'Data we collect',
          p: [
            'Account data: your email address and password. Passwords are handled by our authentication provider and are never stored in readable form.',
            'Profile data you choose to add: username, full name, bio, phone number, country and profile photo.',
            'Learning activity: the courses you enrol in, lesson progress, completion status, certificates and reviews you post.',
            'Messages: the name, email and text you send through the Contact page, and notifications we send you.',
            'Technical data stored in your browser: your login session, language and theme preferences, and a counter used to limit repeated failed logins.',
          ],
        },
        {
          h: 'How we use it',
          p: [
            'To run the platform: sign you in, show your courses and progress, and issue certificates.',
            'To answer your messages and send you notifications about your courses and live sessions.',
            'To keep the service secure and prevent abuse.',
            'We do not sell your personal data and we do not use advertising trackers.',
          ],
        },
        {
          h: 'Services we rely on',
          p: [
            'Supabase provides our database, authentication and file storage.',
            'Vercel hosts the website.',
            'When you choose a password, your browser checks it against the HaveIBeenPwned breach database. Only the first five characters of a one-way hash leave your device, never the password itself.',
            'If you use the AI assistant, the text you type is sent to our backend and to an AI provider to produce an answer. Do not enter sensitive personal information in it.',
          ],
        },
        {
          h: 'What others can see',
          p: [
            'Administrators can see user accounts, profiles, enrolments and the messages you send us, to operate and support the platform.',
            'Reviews and ratings you post may be shown on course pages.',
            'If someone enters a valid certificate number on the verification page, they will see the holder name, course title and issue date for that certificate only.',
          ],
        },
        {
          h: 'Retention and your rights',
          p: [
            'We keep your data while your account is active. You can edit your profile at any time from the Profile page.',
            'You can ask us to access, correct or delete your data, or to close your account, by writing to us through the Contact page.',
          ],
        },
        {
          h: 'Children',
          p: ['CompassPro is not intended for children under 13. If you believe a child has created an account, contact us and we will remove it.'],
        },
        {
          h: 'Changes and contact',
          p: [
            'We may update this policy; the date at the top shows the latest version.',
            'Questions? Reach us through the Contact page.',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة الخصوصية',
      intro:
        'كومباس برو منصة تعلّم إلكتروني. توضح هذه السياسة ما البيانات الشخصية التي نجمعها، ولماذا نجمعها، وما الخيارات المتاحة لك.',
      sections: [
        {
          h: 'البيانات التي نجمعها',
          p: [
            'بيانات الحساب: بريدك الإلكتروني وكلمة المرور. تتم معالجة كلمات المرور عبر مزوّد المصادقة ولا تُخزَّن بصيغة مقروءة.',
            'بيانات الملف الشخصي التي تختار إضافتها: اسم المستخدم، الاسم الكامل، نبذة، رقم الهاتف، الدولة وصورة الملف الشخصي.',
            'نشاط التعلّم: الدورات التي تسجّل بها، تقدّمك في الدروس، حالة الإكمال، الشهادات والتقييمات التي تنشرها.',
            'الرسائل: الاسم والبريد والنص الذي ترسله عبر صفحة التواصل، والإشعارات التي نرسلها لك.',
            'بيانات تقنية في متصفحك: جلسة تسجيل الدخول، تفضيلات اللغة والمظهر، وعدّاد للحد من محاولات الدخول الفاشلة المتكررة.',
          ],
        },
        {
          h: 'كيف نستخدمها',
          p: [
            'لتشغيل المنصة: تسجيل دخولك، عرض دوراتك وتقدّمك، وإصدار الشهادات.',
            'للرد على رسائلك وإرسال إشعارات عن دوراتك وجلساتك المباشرة.',
            'للحفاظ على أمان الخدمة ومنع إساءة الاستخدام.',
            'نحن لا نبيع بياناتك الشخصية ولا نستخدم أدوات تتبّع إعلانية.',
          ],
        },
        {
          h: 'الخدمات التي نعتمد عليها',
          p: [
            'يوفّر Supabase قاعدة البيانات والمصادقة وتخزين الملفات.',
            'تستضيف Vercel الموقع.',
            'عند اختيار كلمة مرور، يفحصها متصفحك مقابل قاعدة بيانات التسريبات HaveIBeenPwned. يغادر جهازك أول خمسة أحرف فقط من بصمة أحادية الاتجاه، وليس كلمة المرور نفسها.',
            'إذا استخدمت المساعد الذكي، يُرسل النص الذي تكتبه إلى خادمنا ومزوّد ذكاء اصطناعي لإنتاج الإجابة. لا تدخل فيه معلومات شخصية حساسة.',
          ],
        },
        {
          h: 'ما الذي يمكن للآخرين رؤيته',
          p: [
            'يستطيع المشرفون رؤية الحسابات والملفات الشخصية والتسجيلات والرسائل التي ترسلها لنا، بهدف التشغيل والدعم.',
            'قد تظهر التقييمات التي تنشرها في صفحات الدورات.',
            'إذا أدخل شخص رقم شهادة صحيحاً في صفحة التحقق، فسيرى اسم حامل الشهادة وعنوان الدورة وتاريخ الإصدار لتلك الشهادة فقط.',
          ],
        },
        {
          h: 'الاحتفاظ بالبيانات وحقوقك',
          p: [
            'نحتفظ ببياناتك طالما حسابك نشط. يمكنك تعديل ملفك الشخصي في أي وقت من صفحة الملف الشخصي.',
            'يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها أو إغلاق حسابك بمراسلتنا عبر صفحة التواصل.',
          ],
        },
        {
          h: 'الأطفال',
          p: ['المنصة غير موجّهة للأطفال دون 13 عاماً. إذا كنت تعتقد أن طفلاً أنشأ حساباً، تواصل معنا وسنقوم بحذفه.'],
        },
        {
          h: 'التغييرات والتواصل',
          p: [
            'قد نحدّث هذه السياسة، ويبيّن التاريخ في الأعلى آخر نسخة.',
            'لأي استفسار، تواصل معنا عبر صفحة التواصل.',
          ],
        },
      ],
    },
  },
  terms: {
    en: {
      title: 'Terms of Use',
      intro:
        'By creating an account or using CompassPro you agree to these terms. If you do not agree, please do not use the platform.',
      sections: [
        {
          h: 'Your account',
          p: [
            'Provide accurate information and keep your password private. You are responsible for activity under your account.',
            'You must be at least 13 years old to use CompassPro.',
          ],
        },
        {
          h: 'Acceptable use',
          p: [
            'Do not attempt to break, overload or gain unauthorised access to the platform or other users’ accounts.',
            'Do not post unlawful, abusive or misleading content in reviews, messages or any other part of the platform.',
            'Do not copy, resell or redistribute course materials.',
          ],
        },
        {
          h: 'Courses and certificates',
          p: [
            'Course content belongs to CompassPro or its instructors. You get a personal, non-commercial right to use it for your own learning.',
            'A certificate is issued when you complete a course. Each certificate has a number that anyone can check on the verification page.',
            'Course information, availability and live session times may change.',
          ],
        },
        {
          h: 'Your content',
          p: [
            'You keep ownership of what you post (such as reviews and messages) and allow us to display and store it to operate the platform.',
            'We may remove content that breaks these terms.',
          ],
        },
        {
          h: 'AI assistant',
          p: ['The AI assistant can make mistakes. Treat its answers as guidance, not as professional advice.'],
        },
        {
          h: 'Availability and liability',
          p: [
            'The platform is provided “as is”. We try to keep it available and accurate but do not guarantee uninterrupted or error-free service.',
            'To the extent permitted by law, CompassPro is not liable for indirect or consequential losses arising from use of the platform.',
          ],
        },
        {
          h: 'Suspension and changes',
          p: [
            'We may suspend or close accounts that break these terms.',
            'We may update these terms; continuing to use the platform means you accept the updated version.',
            'Questions? Reach us through the Contact page.',
          ],
        },
      ],
    },
    ar: {
      title: 'شروط الاستخدام',
      intro:
        'بإنشاء حساب أو استخدام كومباس برو فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة.',
      sections: [
        {
          h: 'حسابك',
          p: [
            'قدّم معلومات صحيحة وحافظ على سرية كلمة مرورك. أنت مسؤول عن النشاط الذي يتم عبر حسابك.',
            'يجب ألا يقل عمرك عن 13 عاماً لاستخدام المنصة.',
          ],
        },
        {
          h: 'الاستخدام المقبول',
          p: [
            'لا تحاول تعطيل المنصة أو إرهاقها أو الوصول غير المصرّح به إليها أو إلى حسابات المستخدمين الآخرين.',
            'لا تنشر محتوى غير قانوني أو مسيئاً أو مضلّلاً في التقييمات أو الرسائل أو أي جزء آخر من المنصة.',
            'لا تنسخ مواد الدورات أو تعيد بيعها أو توزيعها.',
          ],
        },
        {
          h: 'الدورات والشهادات',
          p: [
            'محتوى الدورات ملك لكومباس برو أو لمدرّسيها. لك حق شخصي غير تجاري في استخدامه لتعلّمك الخاص.',
            'تُصدر الشهادة عند إكمال الدورة، ولكل شهادة رقم يمكن لأي شخص التحقق منه في صفحة التحقق.',
            'قد تتغير معلومات الدورات وتوفرها ومواعيد الجلسات المباشرة.',
          ],
        },
        {
          h: 'المحتوى الذي تنشره',
          p: [
            'تحتفظ بملكية ما تنشره (مثل التقييمات والرسائل)، وتسمح لنا بعرضه وتخزينه لتشغيل المنصة.',
            'يجوز لنا إزالة أي محتوى يخالف هذه الشروط.',
          ],
        },
        {
          h: 'المساعد الذكي',
          p: ['قد يخطئ المساعد الذكي. اعتبر إجاباته إرشاداً وليست نصيحة مهنية.'],
        },
        {
          h: 'التوفّر والمسؤولية',
          p: [
            'تُقدَّم المنصة "كما هي". نسعى لإبقائها متاحة ودقيقة لكننا لا نضمن خدمة دون انقطاع أو أخطاء.',
            'بالقدر الذي يسمح به القانون، لا تتحمل كومباس برو مسؤولية الخسائر غير المباشرة الناتجة عن استخدام المنصة.',
          ],
        },
        {
          h: 'الإيقاف والتغييرات',
          p: [
            'يجوز لنا إيقاف الحسابات المخالفة لهذه الشروط أو إغلاقها.',
            'قد نحدّث هذه الشروط، واستمرارك في استخدام المنصة يعني قبولك للنسخة المحدّثة.',
            'لأي استفسار، تواصل معنا عبر صفحة التواصل.',
          ],
        },
      ],
    },
  },
};

const Legal = ({ kind }) => {
  const { lang, darkMode } = useLang();
  const navigate = useNavigate();
  const c = CONTENT[kind][lang === 'ar' ? 'ar' : 'en'];
  const isAr = lang === 'ar';
  const dm = {
    bg: darkMode ? '#0f0f0f' : '#F3F7FC',
    card: darkMode ? '#1a1a2e' : '#ffffff',
    heading: darkMode ? '#ffffff' : '#003366',
    text: darkMode ? '#a8c8f0' : '#4A5D78',
    line: darkMode ? '#2e3250' : '#CBD7E8',
  };

  return (
    <main style={{ background: dm.bg, minHeight: '100vh', padding: '110px 16px 60px', boxSizing: 'border-box' }}>
      <article
        style={{
          maxWidth: 820,
          margin: '0 auto',
          background: dm.card,
          borderRadius: 24,
          padding: 'clamp(24px, 5vw, 48px)',
          boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
        }}
      >
        <h1 style={{ color: dm.heading, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, margin: '0 0 6px' }}>{c.title}</h1>
        <p style={{ color: dm.text, fontSize: '0.9rem', margin: '0 0 18px' }}>
          {isAr ? 'آخر تحديث: ' : 'Last updated: '}{LAST_UPDATED[isAr ? 'ar' : 'en']}
        </p>
        <p style={{ color: dm.text, fontSize: '1.05rem', lineHeight: 1.8, margin: '0 0 8px' }}>{c.intro}</p>

        {c.sections.map((s, i) => (
          <section key={i} style={{ borderTop: `1px solid ${dm.line}`, marginTop: 24, paddingTop: 20 }}>
            <h2 style={{ color: dm.heading, fontSize: '1.25rem', fontWeight: 700, margin: '0 0 10px' }}>{s.h}</h2>
            <ul style={{ color: dm.text, lineHeight: 1.8, margin: 0, paddingInlineStart: 22 }}>
              {s.p.map((line, j) => <li key={j} style={{ marginBottom: 6 }}>{line}</li>)}
            </ul>
          </section>
        ))}

        <p style={{ marginTop: 28 }}>
          <a
            href="/contact"
            onClick={(e) => { e.preventDefault(); navigate('/contact'); }}
            style={{ background: '#F0A500', color: '#002347', padding: '12px 26px', borderRadius: 999, textDecoration: 'none', fontWeight: 800, display: 'inline-block' }}
          >
            {isAr ? 'تواصل معنا' : 'Contact us'}
          </a>
        </p>
      </article>
    </main>
  );
};

export default Legal;
