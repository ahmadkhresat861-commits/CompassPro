import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import '../App.css';

// ============================================================
// STAR RATING
// ============================================================

const StarRating = ({ rating = 0, onRate }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '5px',
        animation: 'fadeIn 0.5s ease both',
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={
            star <= Number(rating)
              ? 'fas fa-star'
              : 'far fa-star'
          }
          style={{
            color: '#f0a500',
            cursor: onRate ? 'pointer' : 'default',
            fontSize: '1.2rem',
            transition: 'transform 0.2s ease',
          }}
          onClick={() => {
            if (onRate) {
              onRate(star);
            }
          }}
          onMouseEnter={(e) => {
            if (onRate) {
              e.currentTarget.style.transform =
                'scale(1.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (onRate) {
              e.currentTarget.style.transform =
                'scale(1)';
            }
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// COURSES
// ============================================================

const Courses = () => {
  const { darkMode } = useLang();
  const navigate = useNavigate();

  // ============================================================
  // COLORS
  // ============================================================

  const dm = {
    bg: darkMode ? '#0f1117' : '#f5f7fa',
    card: darkMode ? '#1e2130' : '#ffffff',
    cardBorder: darkMode ? '#2e3250' : '#f0f0f0',
    heading: darkMode ? '#a0b4ff' : '#003366',
    text: darkMode ? '#c8d0e0' : '#555555',
    subtext: darkMode ? '#7a8499' : '#888888',
    input: darkMode ? '#1e2130' : '#ffffff',
    inputBorder: darkMode ? '#3a4060' : '#dddddd',
    inputColor: darkMode ? '#e0e6f0' : '#333333',

    catActive: darkMode ? '#ffffff' : '#ffffff',
    catActiveBg: darkMode ? '#2a3580' : '#003366',
    catBorder: darkMode ? '#a0b4ff' : '#003366',
    catInactive: darkMode ? '#a0b4ff' : '#003366',

    reviewBg: darkMode ? '#161a28' : '#ffffff',
    successBg: darkMode ? '#0d2318' : '#f0fff4',

    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 15px rgba(0,0,0,0.08)',

    tagBg: darkMode ? '#2a3050' : '#f0f0f0',
    tagColor: darkMode ? '#a0b4ff' : '#555555',

    btnBack: darkMode ? '#2a3580' : '#003366',

    lessonActive: darkMode
      ? '#252c52'
      : '#eef4ff',

    lessonCompleted: darkMode
      ? '#123525'
      : '#ecfdf5',
  };

  // ============================================================
  // COURSES STATE
  // ============================================================

  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);

  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState(null);

  // ============================================================
  // ENROLLMENT
  // ============================================================

  const [enrollment, setEnrollment] = useState(null);

  // ============================================================
  // LESSONS
  // ============================================================

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [lessonProgress, setLessonProgress] =
    useState([]);
// ============================================================
  // REVIEWS
  // ============================================================

  const [reviews, setReviews] = useState([]);

  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [enrolling, setEnrolling] =
    useState(false);

  const [lessonsLoading, setLessonsLoading] =
    useState(false);

  const [lessonSaving, setLessonSaving] =
    useState(false);

  // ============================================================
  // UI
  // ============================================================

  const [pageVisible, setPageVisible] =
    useState(false);

  const [detailsVisible, setDetailsVisible] =
    useState(false);

  const [message, setMessage] =
    useState('');

  // ============================================================
  // LOAD USER + COURSES
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser || null);

        const {
          data: coursesData,
          error: coursesError,
        } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

        if (coursesError) {
          console.error(
            'Error loading courses:',
            coursesError
          );
        } else {
          setCourses(coursesData || []);
        }

        setTimeout(() => {
          setPageVisible(true);
        }, 100);
      } catch (error) {
        console.error(
          'Unexpected loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ============================================================
  // WHEN COURSE SELECTED
  // ============================================================

  useEffect(() => {
    if (!selected) {
      return;
    }

    setDetailsVisible(false);

    setTimeout(() => {
      setDetailsVisible(true);
    }, 100);

    setSelectedLesson(null);
    setLessons([]);
    setLessonProgress([]);
    setReviews([]);
    setEnrollment(null);
    setMessage('');

    fetchReviews();
    checkEnrollment();
  }, [selected, user]);

  // ============================================================
  // FETCH REVIEWS
  // ============================================================

  const fetchReviews = async () => {
    if (!selected) {
      return;
    }

    setReviewLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from('reviews')
        .select('*')
        .eq('course_id', selected.id)
        .order('id', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Error loading reviews:',
          error
        );
      }

      setReviews(data || []);
    } catch (error) {
      console.error(
        'Unexpected reviews error:',
        error
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // ============================================================
  // CHECK ENROLLMENT
  // ============================================================

  const checkEnrollment = async () => {
    if (!user || !selected) {
      setEnrollment(null);
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', selected.id)
        .maybeSingle();

      if (error) {
        console.error(
'Enrollment check error:',
          error
        );
        return;
      }

      setEnrollment(data || null);

      if (data) {
        await fetchLessons();
      }
    } catch (error) {
      console.error(
        'Unexpected enrollment error:',
        error
      );
    }
  };

  // ============================================================
  // FETCH LESSONS
  // ============================================================

  const fetchLessons = async () => {
    if (!selected || !user) {
      return;
    }

    setLessonsLoading(true);

    try {
      // --------------------------------------------------------
      // GET LESSONS
      // --------------------------------------------------------

      const {
        data: lessonsData,
        error: lessonsError,
      } = await supabase
        .from('lessons')
        .select(
          `
            id,
            course_id,
            title,
            description,
            content,
            lesson_order,
            video_url,
            pdf_url,
            created_at
          `
        )
        .eq('course_id', selected.id)
        .order('lesson_order', {
          ascending: true,
        });

      if (lessonsError) {
        console.error(
          'Error loading lessons:',
          lessonsError
        );

        setLessons([]);
        return;
      }

      const loadedLessons =
        lessonsData || [];

      setLessons(loadedLessons);

      // --------------------------------------------------------
      // GET LESSON PROGRESS
      // --------------------------------------------------------

      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in(
          'lesson_id',
          loadedLessons.map(
            (lesson) => lesson.id
          )
        );

      if (progressError) {
        console.error(
          'Error loading lesson progress:',
          progressError
        );

        setLessonProgress([]);
      } else {
        setLessonProgress(
          progressData || []
        );
      }

      // --------------------------------------------------------
      // SELECT FIRST UNCOMPLETED LESSON
      // --------------------------------------------------------

      if (loadedLessons.length > 0) {
        const progressRows =
          progressData || [];

        const firstUncompleted =
          loadedLessons.find(
            (lesson) => {
              const progress =
                progressRows.find(
                  (item) =>
                    item.lesson_id ===
                    lesson.id
                );

              return !progress?.completed;
            }
          );

        setSelectedLesson(
          firstUncompleted ||
            loadedLessons[0]
        );
      }
    } catch (error) {
      console.error(
        'Unexpected lessons error:',
        error
      );
    } finally {
      setLessonsLoading(false);
    }
  };

  // ============================================================
  // ENROLL
  // ============================================================

  const handleEnroll = async () => {
    setMessage('');

    if (!user) {
      setMessage(
        'Please login first to enroll in this course.'
      );
      return;
    }

    if (!selected) {
      return;
    }

    if (enrollment) {
      setMessage(
        'You are already enrolled in this course.'
      );
      return;
    }

    setEnrolling(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from('enrollments')
        .insert([
          {
            user_id: user.id,
            course_id: selected.id,
            progress: 0,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(
          'Enrollment error:',
          error
        );

        if (error.code === '23505') {
          setMessage(
'You are already enrolled in this course.'
          );

          await checkEnrollment();
        } else {
          setMessage(
            'Something went wrong. Please try again.'
          );
        }

        return;
      }

      setEnrollment(data);

      // --------------------------------------------------------
      // UPDATE STUDENTS COUNT
      // --------------------------------------------------------

      const currentStudents =
        Number(selected.students) || 0;

      const {
        error: updateError,
      } = await supabase
        .from('courses')
        .update({
          students:
            currentStudents + 1,
        })
        .eq('id', selected.id);

      if (updateError) {
        console.error(
          'Students count update error:',
          updateError
        );
      }

      const updatedCourse = {
        ...selected,
        students:
          currentStudents + 1,
      };

      setSelected(updatedCourse);

      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === selected.id
            ? updatedCourse
            : course
        )
      );

      setMessage(
        'You have successfully enrolled in this course! 🎉'
      );

      await fetchLessons();
    } catch (error) {
      console.error(
        'Unexpected enrollment error:',
        error
      );

      setMessage(
        'Something went wrong. Please try again.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  // ============================================================
  // CHECK IF LESSON COMPLETED
  // ============================================================

  const isLessonCompleted = (
    lessonId
  ) => {
    return lessonProgress.some(
      (item) =>
        item.lesson_id === lessonId &&
        item.completed === true
    );
  };

  // ============================================================
  // CALCULATE COURSE PROGRESS
  // ============================================================

  const calculatedProgress = useMemo(() => {
    if (!lessons.length) {
      return Number(
        enrollment?.progress || 0
      );
    }

    const completedCount =
      lessons.filter((lesson) =>
        isLessonCompleted(lesson.id)
      ).length;

    return Math.round(
      (completedCount /
        lessons.length) *
        100
    );
  }, [
    lessons,
    lessonProgress,
    enrollment,
  ]);

  // ============================================================
  // MARK LESSON COMPLETED
  // ============================================================

  const handleCompleteLesson = async () => {
    if (
      !user ||
      !selected ||
      !selectedLesson ||
      !enrollment
    ) {
      return;
    }

    setLessonSaving(true);
    setMessage('');

    try {
      // --------------------------------------------------------
      // CHECK EXISTING PROGRESS
      // --------------------------------------------------------

      const {
        data: existingProgress,
        error: existingError,
      } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq(
          'lesson_id',
          selectedLesson.id
        )
        .maybeSingle();

      if (existingError) {
        console.error(
          'Progress check error:',
          existingError
        );

        setMessage(
          'Could not update lesson progress.'
        );

        return;
      }

      // --------------------------------------------------------
      // INSERT OR UPDATE PROGRESS
      // --------------------------------------------------------

      let progressData;

      if (existingProgress) {
        const {
          data,
          error,
        } = await supabase
          .from('lesson_progress')
          .update({
            completed: true,
          })
          .eq(
            'id',
            existingProgress.id
          )
          .select()
          .single();

        if (error) {
          throw error;
        }
progressData = data;
      } else {
        const {
          data,
          error,
        } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id:
              selectedLesson.id,
            completed: true,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        progressData = data;
      }

      // --------------------------------------------------------
      // UPDATE LOCAL PROGRESS
      // --------------------------------------------------------

      setLessonProgress((prev) => {
        const exists = prev.some(
          (item) =>
            item.lesson_id ===
            selectedLesson.id
        );

        if (exists) {
          return prev.map((item) =>
            item.lesson_id ===
            selectedLesson.id
              ? progressData
              : item
          );
        }

        return [
          ...prev,
          progressData,
        ];
      });

      // --------------------------------------------------------
      // CALCULATE NEW PROGRESS
      // --------------------------------------------------------

      const completedCount =
        lessons.filter((lesson) => {
          if (
            lesson.id ===
            selectedLesson.id
          ) {
            return true;
          }

          return isLessonCompleted(
            lesson.id
          );
        }).length;

      const newProgress =
        lessons.length > 0
          ? Math.round(
              (completedCount /
                lessons.length) *
                100
            )
          : 100;

      const courseCompleted =
        newProgress >= 100;

      // --------------------------------------------------------
      // UPDATE ENROLLMENT
      // --------------------------------------------------------

      const {
        data: updatedEnrollment,
        error: enrollmentError,
      } = await supabase
        .from('enrollments')
        .update({
          progress: newProgress,
          completed:
            courseCompleted,
        })
        .eq('id', enrollment.id)
        .select()
        .single();

      if (enrollmentError) {
        throw enrollmentError;
      }

      setEnrollment(
        updatedEnrollment
      );

      setMessage(
        courseCompleted
          ? 'Congratulations! You completed the course! 🎉🏆'
          : 'Lesson completed successfully! ✅'
      );
    } catch (error) {
      console.error(
        'Complete lesson error:',
        error
      );

      setMessage(
        'Could not save your progress. Please try again.'
      );
    } finally {
      setLessonSaving(false);
    }
  };

  // ============================================================
  // GO TO NEXT LESSON
  // ============================================================

  const handleNextLesson = () => {
    if (!selectedLesson) {
      return;
    }

    const currentIndex =
      lessons.findIndex(
        (lesson) =>
          lesson.id ===
          selectedLesson.id
      );

    if (
      currentIndex === -1 ||
      currentIndex >=
        lessons.length - 1
    ) {
      setMessage(
        'You have reached the last lesson. 🎉'
      );
      return;
    }

    setSelectedLesson(
      lessons[currentIndex + 1]
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ============================================================
  // PREVIOUS LESSON
  // ============================================================

  const handlePreviousLesson = () => {
    if (!selectedLesson) {
      return;
    }

    const currentIndex =
      lessons.findIndex(
        (lesson) =>
          lesson.id ===
          selectedLesson.id
      );

    if (
      currentIndex <= 0
    ) {
      return;
    }

    setSelectedLesson(
      lessons[currentIndex - 1]
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ============================================================
// SUBMIT REVIEW
  // ============================================================

  const handleSubmitReview = async () => {
    if (!user) {
      setMessage(
        'Please login first to leave a review.'
      );
      return;
    }

    if (!myRating) {
      setMessage(
        'Please select a rating first.'
      );
      return;
    }

    if (!selected) {
      return;
    }

    setReviewLoading(true);

    try {
      const {
        error,
      } = await supabase
        .from('reviews')
        .upsert(
          {
            course_id:
              selected.id,
            user_id: user.id,
            rating: myRating,
            comment:
              comment.trim(),
          },
          {
            onConflict:
              'user_id,course_id',
          }
        );

      if (error) {
        throw error;
      }

      setSubmitted(true);

      setMessage(
        'Your review has been submitted successfully! ⭐'
      );

      await fetchReviews();
    } catch (error) {
      console.error(
        'Review error:',
        error
      );

      setMessage(
        'Could not submit your review.'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // ============================================================
  // BACK TO COURSES
  // ============================================================

  const handleBack = () => {
    setDetailsVisible(false);

    setTimeout(() => {
      setSelected(null);
      setSelectedLesson(null);

      setLessons([]);
      setLessonProgress([]);

      setReviews([]);
      setEnrollment(null);

      setSubmitted(false);
      setMyRating(0);
      setComment('');
      setMessage('');
    }, 250);
  };

  // ============================================================
  // AVERAGE RATING
  // ============================================================

  const avgRating = reviews.length
    ? (
        reviews.reduce(
          (total, review) =>
            total +
            Number(
              review.rating || 0
            ),
          0
        ) / reviews.length
      ).toFixed(1)
    : null;

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = [
    'All',
    ...new Set(
      courses
        .map(
          (course) =>
            course.category
        )
        .filter(Boolean)
    ),
  ];

  // ============================================================
  // FILTER COURSES
  // ============================================================

  const filtered = courses.filter(
    (course) => {
      const matchesCategory =
        category === 'All' ||
        course.category ===
          category;

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        course.title
          ?.toLowerCase()
          .includes(searchText) ||
        course.category
          ?.toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <section
        style={{
          minHeight: '100vh',
          background: dm.bg,
          display: 'flex',
          justifyContent:
            'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <i
            className="fas fa-spinner fa-spin"
            style={{
              fontSize: '3rem',
              color: dm.heading,
              marginBottom: '15px',
            }}
          />

          <p
            style={{
              color: dm.text,
            }}
          >
            Loading courses...
          </p>
        </div>
      </section>
    );
  }

  // ============================================================
  // COURSE DETAILS + LEARNING
// ============================================================

  if (selected) {
    return (
      <section
        style={{
          padding: '40px 20px 80px',
          maxWidth:
            enrollment
              ? '1200px'
              : '800px',
          margin: '0 auto',
          background: dm.bg,
          minHeight: '100vh',

          opacity:
            detailsVisible
              ? 1
              : 0,

          transform:
            detailsVisible
              ? 'translateY(0)'
              : 'translateY(20px)',

          transition:
            'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <button
          onClick={handleBack}
          style={{
            marginBottom: '30px',
            padding:
              '10px 20px',
            background:
              dm.btnBack,
            color: 'white',
            border: 'none',
            borderRadius:
              '8px',
            cursor:
              'pointer',
          }}
        >
          <i className="fas fa-arrow-left" />{' '}
          Back to Courses
        </button>

        {/* ================================================== */}
        {/* COURSE HEADER */}
        {/* ================================================== */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          {selected.image_url ? (
            <img
              src={selected.image_url}
              alt={selected.title}
              style={{
                width: '100%',
                maxWidth: '500px',
                height: '220px',
                objectFit: 'cover',
                borderRadius: '16px',
                margin: '0 auto 20px',
                display: 'block',
                boxShadow: '0 10px 30px rgba(0,51,102,0.25)',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '90px',
                height: '90px',
                margin:
                  '0 auto 20px',
                borderRadius:
                  '50%',
                background:
                  'linear-gradient(135deg, #003366, #005599)',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                boxShadow:
                  '0 10px 30px rgba(0,51,102,0.25)',
              }}
            >
              <i
                className="fas fa-book-open"
                style={{
                  fontSize:
                    '2.5rem',
                  color:
                    '#f0a500',
                }}
              />
            </div>
          )}

          <h1
            style={{
              color:
                dm.heading,
            }}
          >
            {selected.title}
          </h1>

          {selected.category && (
            <span
              style={{
                display:
                  'inline-block',
                marginTop:
                  '10px',
                padding:
                  '6px 15px',
                background:
                  dm.tagBg,
                color:
                  dm.tagColor,
                borderRadius:
                  '20px',
                fontSize:
                  '0.85rem',
              }}
            >
              {selected.category}
            </span>
          )}

          {selected.description && (
            <p
              style={{
                maxWidth: '650px',
                margin: '18px auto 0',
                color: dm.text,
                lineHeight: '1.7',
              }}
            >
              {selected.description}
            </p>
          )}

          {selected.instructor && (
            <p
              style={{
                color: dm.subtext,
                marginTop: '10px',
                fontSize: '0.9rem',
              }}
            >
              <i className="fas fa-chalkboard-teacher" />{' '}
              Instructor: {selected.instructor}
            </p>
          )}

          {/* STATS */}

          <div
            style={{
              display:
                'flex',
              justifyContent:
                'center',
              gap: '30px',
              flexWrap:
                'wrap',
              marginTop:
                '25px',
            }}
          >
            <div>
              <i
                className="fas fa-users"
                style={{
                  color:
                    '#10b981',
                }}
              />

              <p
                style={{
                  color:
                    dm.text,
                  marginTop:
                    '5px',
                }}
              >
                {selected.students ||
                  0}{' '}
                Students
              </p>
            </div>

            <div>
              <i
                className="fas fa-star"
                style={{
                  color:
                    '#f0a500',
                }}
              />

              <p
                style={{
color:
                    dm.text,
                  marginTop:
                    '5px',
                }}
              >
                {avgRating ||
                  selected.rating ||
                  'No rating'}
              </p>
            </div>

            <div>
              <i
                className="fas fa-tag"
                style={{
                  color: dm.heading,
                }}
              />

              <p
                style={{
                  color: dm.text,
                  marginTop: '5px',
                  fontWeight: '700',
                }}
              >
                {Number(selected.price) > 0
                  ? `$${Number(selected.price).toFixed(2)}`
                  : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* ENROLLMENT */}
        {/* ================================================== */}

        <div
          style={{
            background:
              dm.reviewBg,
            borderRadius:
              '15px',
            padding:
              '25px',
            boxShadow:
              dm.shadow,
            marginBottom:
              '30px',
            textAlign:
              'center',
          }}
        >
          {enrollment ? (
            <>
              <div
                style={{
                  color:
                    '#10b981',
                  fontSize:
                    '2rem',
                  marginBottom:
                    '10px',
                }}
              >
                <i className="fas fa-check-circle" />
              </div>

              <h3
                style={{
                  color:
                    dm.heading,
                }}
              >
                You are enrolled 🎉
              </h3>

              <p
                style={{
                  color:
                    dm.text,
                  marginTop:
                    '10px',
                }}
              >
                Your progress:{' '}
                <strong>
                  {calculatedProgress}%
                </strong>
              </p>

              <div
                style={{
                  width:
                    '100%',
                  height:
                    '10px',
                  background:
                    darkMode
                      ? '#2a2d3d'
                      : '#e5e7eb',
                  borderRadius:
                    '10px',
                  overflow:
                    'hidden',
                  marginTop:
                    '15px',
                }}
              >
                <div
                  style={{
                    width: `${calculatedProgress}%`,
                    height:
                      '100%',
                    background:
                      'linear-gradient(90deg, #003366, #f0a500)',
                    borderRadius:
                      '10px',
                    transition:
                      'width 0.5s ease',
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h3
                style={{
                  color:
                    dm.heading,
                }}
              >
                Ready to start learning?
              </h3>

              <p
                style={{
                  color:
                    dm.text,
                  margin:
                    '10px 0 20px',
                }}
              >
                {user
                  ? 'Enroll now and start your learning journey.'
                  : 'Please login or create an account to enroll in this course.'}
              </p>

              {user ? (
                <button
                  onClick={
                    handleEnroll
                  }
                  disabled={
                    enrolling
                  }
                  style={{
                    width:
                      '100%',
                    padding:
                      '14px',
                    background:
                      enrolling
                        ? '#888'
                        : 'linear-gradient(90deg, #003366, #005599)',
                    color:
                      'white',
                    border:
                      'none',
                    borderRadius:
                      '10px',
                    fontWeight:
                      '700',
                    fontSize:
                      '1rem',
                    cursor:
                      enrolling
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  <i
className={
                      enrolling
                        ? 'fas fa-spinner fa-spin'
                        : 'fas fa-graduation-cap'
                    }
                  />{' '}
                  {enrolling
                    ? 'Enrolling...'
                    : 'Enroll Now'}
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      flex: '1 1 150px',
                      padding: '14px',
                      background:
                        'linear-gradient(90deg, #003366, #005599)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fas fa-sign-in-alt" />{' '}
                    Login
                  </button>

                  <button
                    onClick={() => navigate('/signup')}
                    style={{
                      flex: '1 1 150px',
                      padding: '14px',
                      background: '#f0a500',
                      color: '#003366',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fas fa-user-plus" />{' '}
                    Sign Up
                  </button>
                </div>
              )}
            </>
          )}

          {message && (
            <p
              style={{
                marginTop:
                  '15px',
                color:
                  message.includes(
                    'successfully'
                  ) ||
                  message.includes(
                    'completed'
                  ) ||
                  message.includes(
                    'Congratulations'
                  )
                    ? '#10b981'
                    : dm.heading,
                fontWeight:
                  '600',
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* ================================================== */}
        {/* LEARNING AREA */}
        {/* يظهر فقط بعد التسجيل */}
        {/* ================================================== */}

        {enrollment && (
          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                '280px minmax(0, 1fr)',
              gap:
                '25px',
              alignItems:
                'start',
              marginBottom:
                '40px',
            }}
          >
            {/* ================================================= */}
            {/* LESSON SIDEBAR */}
            {/* ================================================= */}

            <aside
              style={{
                background:
                  dm.reviewBg,
                borderRadius:
                  '15px',
                padding:
                  '20px',
                boxShadow:
                  dm.shadow,
                position:
                  'sticky',
                top:
                  '20px',
              }}
            >
              <h3
                style={{
                  color:
                    dm.heading,
                  marginTop:
                    0,
                }}
              >
                <i className="fas fa-list" />{' '}
                Course Lessons
              </h3>

              {lessonsLoading ? (
                <p
                  style={{
                    color:
                      dm.subtext,
                    textAlign:
                      'center',
                  }}
                >
                  <i className="fas fa-spinner fa-spin" />{' '}
                  Loading lessons...
                </p>
              ) : lessons.length ===
                0 ? (
                <p
                  style={{
                    color:
                      dm.subtext,
                    textAlign:
                      'center',
                  }}
                >
                  No lessons available yet.
                </p>
              ) : (
                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap:
                      '10px',
                    marginTop:
                      '20px',
                  }}
                >
                  {lessons.map(
                    (
                      lesson,
                      index
                    ) => {
                      const completed =
                        isLessonCompleted(
                          lesson.id
                        );

                      const active =
                        selectedLesson?.id ===
                        lesson.id;

                      return (
                        <button
                          key={
                            lesson.id
                          }
                          onClick={() =>
setSelectedLesson(
                              lesson
                            )
                          }
                          style={{
                            width:
                              '100%',
                            textAlign:
                              'left',
                            padding:
                              '14px',
                            border:
                              active
                                ? `2px solid ${dm.heading}`
                                : `1px solid ${dm.cardBorder}`,
                            borderRadius:
                              '10px',
                            background:
                              completed
                                ? dm.lessonCompleted
                                : active
                                ? dm.lessonActive
                                : 'transparent',
                            color:
                              dm.text,
                            cursor:
                              'pointer',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap:
                                '10px',
                            }}
                          >
                            <span
                              style={{
                                minWidth:
                                  '28px',
                                height:
                                  '28px',
                                borderRadius:
                                  '50%',
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                background:
                                  completed
                                    ? '#10b981'
                                    : dm.btnBack,
                                color:
                                  'white',
                                fontSize:
                                  '0.8rem',
                              }}
                            >
                              {completed ? (
                                <i className="fas fa-check" />
                              ) : (
                                index +
                                1
                              )}
                            </span>

                            <span
                              style={{
                                fontWeight:
                                  '600',
                              }}
                            >
                              {lesson.title}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </aside>

            {/* ================================================= */}
            {/* LESSON CONTENT */}
            {/* ================================================= */}

            <main>
              {!selectedLesson ? (
                <div
                  style={{
                    background:
                      dm.reviewBg,
                    borderRadius:
                      '15px',
                    padding:
                      '50px 30px',
                    boxShadow:
                      dm.shadow,
                    textAlign:
                      'center',
                  }}
                >
                  <i
                    className="fas fa-book-reader"
                    style={{
                      fontSize:
'3rem',
                      color:
                        dm.heading,
                    }}
                  />

                  <h2
                    style={{
                      color:
                        dm.heading,
                    }}
                  >
                    Start Learning
                  </h2>
                </div>
              ) : (
                <div
                  style={{
                    background:
                      dm.reviewBg,
                    borderRadius:
                      '15px',
                    padding:
                      '30px',
                    boxShadow:
                      dm.shadow,
                  }}
                >
                  {/* LESSON HEADER */}

                  <div
                    style={{
                      marginBottom:
                        '25px',
                    }}
                  >
                    <span
                      style={{
                        color:
                          dm.subtext,
                        fontSize:
                          '0.9rem',
                      }}
                    >
                      Lesson{' '}
                      {lessons.findIndex(
                        (lesson) =>
                          lesson.id ===
                          selectedLesson.id
                      ) + 1}{' '}
                      of{' '}
                      {lessons.length}
                    </span>

                    <h2
                      style={{
                        color:
                          dm.heading,
                        marginTop:
                          '8px',
                      }}
                    >
                      {selectedLesson.title}
                    </h2>

                    {selectedLesson.description && (
                      <p
                        style={{
                          color:
                            dm.text,
                          lineHeight:
                            '1.7',
                        }}
                      >
                        {
                          selectedLesson.description
                        }
                      </p>
                    )}
                  </div>

                  {/* VIDEO */}

                  {selectedLesson.video_url && (
                    <div
                      style={{
                        width:
                          '100%',
                        marginBottom:
                          '25px',
                        borderRadius:
                          '12px',
                        overflow:
                          'hidden',
                        background:
                          '#000',
                      }}
                    >
                      <video
                        src={
                          selectedLesson.video_url
                        }
                        controls
                        style={{
                          width:
                            '100%',
                          display:
                            'block',
                          maxHeight:
                            '550px',
                        }}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}

                  {/* PDF ATTACHMENT */}

                  {selectedLesson.pdf_url && (
                    <a
                      href={selectedLesson.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 20px',
                        marginBottom: '25px',
                        background: dm.card,
                        border: `1px solid ${dm.cardBorder}`,
                        borderRadius: '10px',
                        color: dm.heading,
                        fontWeight: '600',
                        textDecoration: 'none',
                      }}
                    >
                      <i
                        className="fas fa-file-pdf"
                        style={{ color: '#ef4444', fontSize: '1.3rem' }}
                      />
                      Download Lesson PDF
                    </a>
                  )}

                  {/* CONTENT */}

                  {selectedLesson.content && (
                    <div
                      style={{
                        color:
                          dm.text,
                        lineHeight:
                          '1.8',
                        fontSize:
                          '1rem',
                        whiteSpace:
                          'pre-wrap',
                        marginBottom:
                          '30px',
                      }}
                    >
                      {
                        selectedLesson.content
}
                    </div>
                  )}

                  {/* LESSON ACTIONS */}

                  <div
                    style={{
                      display:
                        'flex',
                      gap:
                        '10px',
                      flexWrap:
                        'wrap',
                      borderTop:
                        `1px solid ${dm.cardBorder}`,
                      paddingTop:
                        '20px',
                    }}
                  >
                    <button
                      onClick={
                        handlePreviousLesson
                      }
                      disabled={
                        lessons.findIndex(
                          (lesson) =>
                            lesson.id ===
                            selectedLesson.id
                        ) <= 0
                      }
                      style={{
                        flex:
                          '1 1 150px',
                        padding:
                          '12px',
                        border:
                          `1px solid ${dm.cardBorder}`,
                        borderRadius:
                          '8px',
                        background:
                          'transparent',
                        color:
                          dm.text,
                        cursor:
                          'pointer',
                        opacity:
                          lessons.findIndex(
                            (lesson) =>
                              lesson.id ===
                              selectedLesson.id
                          ) <= 0
                            ? 0.5
                            : 1,
                      }}
                    >
                      <i className="fas fa-arrow-left" />{' '}
                      Previous
                    </button>

                    <button
                      onClick={
                        handleCompleteLesson
                      }
                      disabled={
                        lessonSaving ||
                        isLessonCompleted(
                          selectedLesson.id
                        )
                      }
                      style={{
                        flex:
                          '2 1 200px',
                        padding:
                          '12px',
                        border:
                          'none',
                        borderRadius:
                          '8px',
                        background:
                          isLessonCompleted(
                            selectedLesson.id
                          )
                            ? '#10b981'
                            : dm.btnBack,
                        color:
                          'white',
                        fontWeight:
                          '700',
                        cursor:
                          'pointer',
                      }}
                    >
                      <i
                        className={
                          lessonSaving
                            ? 'fas fa-spinner fa-spin'
                            : isLessonCompleted(
                                selectedLesson.id
                              )
                            ? 'fas fa-check'
                            : 'fas fa-check-circle'
                        }
                      />{' '}
                      {lessonSaving
                        ? 'Saving...'
                        : isLessonCompleted(
                            selectedLesson.id
                          )
                        ? 'Lesson Completed'
                        : 'Mark as Completed'}
                    </button>

                    <button
                      onClick={
                        handleNextLesson
                      }
                      disabled={
                        lessons.findIndex(
                          (lesson) =>
lesson.id ===
                            selectedLesson.id
                        ) >=
                        lessons.length - 1
                      }
                      style={{
                        flex:
                          '1 1 150px',
                        padding:
                          '12px',
                        border:
                          'none',
                        borderRadius:
                          '8px',
                        background:
                          dm.btnBack,
                        color:
                          'white',
                        cursor:
                          'pointer',
                        opacity:
                          lessons.findIndex(
                            (lesson) =>
                              lesson.id ===
                              selectedLesson.id
                          ) >=
                          lessons.length - 1
                            ? 0.5
                            : 1,
                      }}
                    >
                      Next{' '}
                      <i className="fas fa-arrow-right" />
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* ================================================== */}
        {/* REVIEWS */}
        {/* ================================================== */}

        <div
          style={{
            background:
              dm.reviewBg,
            borderRadius:
              '12px',
            padding:
              '30px',
            boxShadow:
              dm.shadow,
            marginBottom:
              '30px',
          }}
        >
          <h2
            style={{
              color:
                dm.heading,
              marginBottom:
                '20px',
            }}
          >
            <i className="fas fa-star" />{' '}
            Reviews
          </h2>

          {reviewLoading ? (
            <p
              style={{
                color:
                  dm.subtext,
                textAlign:
                  'center',
              }}
            >
              <i className="fas fa-spinner fa-spin" />{' '}
              Loading...
            </p>
          ) : reviews.length ===
            0 ? (
            <p
              style={{
                color:
                  dm.subtext,
                textAlign:
                  'center',
              }}
            >
              No reviews yet. Be the first!
            </p>
          ) : (
            reviews.map(
              (review) => (
                <div
                  key={
                    review.id
                  }
                  style={{
                    padding:
                      '15px 0',
                    borderBottom:
                      `1px solid ${dm.cardBorder}`,
                  }}
                >
                  <StarRating
                    rating={
                      review.rating
                    }
                  />

                  {review.comment && (
                    <p
                      style={{
                        color:
                          dm.text,
                        marginTop:
                          '8px',
                      }}
                    >
                      {
                        review.comment
                      }
                    </p>
                  )}
                </div>
              )
            )
          )}
        </div>

        {/* ================================================== */}
        {/* ADD REVIEW */}
        {/* ================================================== */}

        {!submitted ? (
          <div
            style={{
              background:
                dm.reviewBg,
              borderRadius:
                '12px',
              padding:
                '30px',
              boxShadow:
                dm.shadow,
            }}
          >
<h2
              style={{
                color:
                  dm.heading,
                marginBottom:
                  '20px',
              }}
            >
              <i className="fas fa-pen" />{' '}
              Add Your Review
            </h2>

            {!user ? (
              <p
                style={{
                  color:
                    dm.subtext,
                  textAlign:
                    'center',
                }}
              >
                Please login to leave a review.
              </p>
            ) : (
              <>
                <p
                  style={{
                    color:
                      dm.heading,
                    fontWeight:
                      '600',
                  }}
                >
                  Your Rating:
                </p>

                <StarRating
                  rating={
                    myRating
                  }
                  onRate={
                    setMyRating
                  }
                />

                <textarea
                  value={
                    comment
                  }
                  onChange={(
                    e
                  ) =>
                    setComment(
                      e.target
                        .value
                    )
                  }
                  placeholder="Write your review..."
                  rows={4}
                  style={{
                    width:
                      '100%',
                    padding:
                      '12px',
                    borderRadius:
                      '8px',
                    border:
                      `1px solid ${dm.inputBorder}`,
                    fontSize:
                      '1rem',
                    marginTop:
                      '15px',
                    marginBottom:
                      '15px',
                    background:
                      dm.input,
                    color:
                      dm.inputColor,
                    resize:
                      'vertical',
                    boxSizing:
                      'border-box',
                  }}
                />

                <button
                  onClick={
                    handleSubmitReview
                  }
                  disabled={
                    !myRating ||
                    reviewLoading
                  }
                  style={{
                    width:
                      '100%',
                    padding:
                      '14px',
                    background:
                      myRating
                        ? dm.btnBack
                        : '#999',
                    color:
                      'white',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    fontWeight:
                      '700',
                    cursor:
                      myRating
                        ? 'pointer'
                        : 'not-allowed',
                  }}
                >
                  <i className="fas fa-paper-plane" />{' '}
                  {reviewLoading
                    ? 'Submitting...'
                    : 'Submit Review'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            style={{
              background:
                dm.successBg,
              borderRadius:
                '12px',
              padding:
                '30px',
              textAlign:
                'center',
            }}
          >
            <i
              className="fas fa-check-circle"
              style={{
                fontSize:
                  '3rem',
                color:
                  '#10b981',
                marginBottom:
                  '15px',
              }}
            />

            <h3
              style={{
                color:
                  dm.heading,
              }}
            >
Review Submitted! Thank you 🎉
            </h3>
          </div>
        )}

        {/* ================================================== */}
        {/* RESPONSIVE + ANIMATIONS */}
        {/* ================================================== */}

        <style>
          {`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @media (max-width: 800px) {
              .learning-layout {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </section>
    );
  }

  // ============================================================
  // COURSES LIST
  // ============================================================

  return (
    <section
      id="courses"
      style={{
        background:
          dm.bg,
        minHeight:
          '100vh',
        padding:
          '40px 20px',

        opacity:
          pageVisible
            ? 1
            : 0,

        transform:
          pageVisible
            ? 'translateY(0)'
            : 'translateY(20px)',

        transition:
          'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <h1
        style={{
          color:
            dm.heading,
          textAlign:
            'center',
        }}
      >
        <i className="fas fa-book-open" />{' '}
        Our Courses
      </h1>

      {/* SEARCH */}

      <div
        style={{
          maxWidth:
            '700px',
          margin:
            '30px auto 40px',
        }}
      >
        <div
          style={{
            position:
              'relative',
            marginBottom:
              '20px',
          }}
        >
          <i
            className="fas fa-search"
            style={{
              position:
                'absolute',
              left:
                '15px',
              top:
                '50%',
              transform:
                'translateY(-50%)',
              color:
                dm.subtext,
            }}
          />

          <input
            type="text"
            placeholder="Search courses..."
            value={
              search
            }
            onChange={(
              e
            ) =>
              setSearch(
                e.target
                  .value
              )
            }
            style={{
              width:
                '100%',
              padding:
                '14px 14px 14px 45px',
              borderRadius:
                '10px',
              border:
                `2px solid ${dm.inputBorder}`,
              fontSize:
                '1rem',
              outline:
                'none',
              background:
                dm.input,
              color:
                dm.inputColor,
              boxSizing:
                'border-box',
            }}
          />
        </div>

        {/* CATEGORIES */}

        <div
          style={{
            display:
              'flex',
            gap:
              '10px',
            justifyContent:
              'center',
            flexWrap:
              'wrap',
          }}
        >
          {categories.map(
            (cat) => (
              <button
                key={
                  cat
                }
                onClick={() =>
                  setCategory(
                    cat
                  )
                }
                style={{
                  padding:
                    '8px 20px',
                  borderRadius:
                    '20px',
                  border:
                    `2px solid ${dm.catBorder}`,
                  background:
                    category ===
                    cat
? dm.catActiveBg
                      : 'transparent',
                  color:
                    category ===
                    cat
                      ? dm.catActive
                      : dm.catInactive,
                  fontWeight:
                    '600',
                  cursor:
                    'pointer',
                }}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* COURSES */}

      {filtered.length ===
      0 ? (
        <div
          style={{
            textAlign:
              'center',
            padding:
              '60px',
            color:
              dm.subtext,
          }}
        >
          <i
            className="fas fa-search"
            style={{
              fontSize:
                '3rem',
              marginBottom:
                '15px',
            }}
          />

          <p>
            No courses found
          </p>
        </div>
      ) : (
        <div className="courses-container">
          {filtered.map(
            (
              course,
              index
            ) => (
              <div
                key={
                  course.id
                }
                className="course-card"
                onClick={() =>
                  setSelected(
                    course
                  )
                }
                style={{
                  background:
                    dm.card,
                  boxShadow:
                    dm.shadow,
                  animation:
                    'courseCardEntrance 0.7s ease both',
                  animationDelay:
                    `${index * 0.1}s`,
                  cursor:
                    'pointer',
                }}
              >
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    style={{
                      width: 'calc(100% + 50px)',
                      height: '140px',
                      objectFit: 'cover',
                      margin: '-25px -25px 15px -25px',
                      borderRadius: '12px 12px 0 0',
                      display: 'block',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="card-icon"
                    style={{
                      color:
                        '#f0a500',
                    }}
                  >
                    <i className="fas fa-book-open" />
                  </div>
                )}

                {course.category && (
                  <span
                    style={{
                      background:
                        dm.tagBg,
                      padding:
                        '4px 12px',
                      borderRadius:
                        '20px',
                      fontSize:
                        '0.8rem',
                      color:
                        dm.tagColor,
                      marginBottom:
                        '10px',
                      display:
                        'inline-block',
                    }}
                  >
                    {
                      course.category
                    }
                  </span>
                )}

                <h3
                  style={{
                    color:
                      dm.heading,
                  }}
                >
                  {
                    course.title
                  }
                </h3>

                <p
                  style={{
                    color:
                      dm.text,
                  }}
                >
                  {course.description ||
                    'Explore this course and start learning today.'}
                </p>

                {course.instructor && (
                  <p
                    style={{
                      color: dm.subtext,
                      fontSize: '0.8rem',
                      marginTop: '-8px',
                    }}
                  >
                    <i className="fas fa-chalkboard-teacher" />{' '}
                    {course.instructor}
                  </p>
                )}

                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    margin:
                      '15px 0',
                    color:
                      dm.subtext,
                    fontSize:
                      '0.85rem',
                  }}
                >
                  <span>
                    <i className="fas fa-users" />{' '}
                    {course.students ||
                      0}
                  </span>

                  <span>
                    <i
                      className="fas fa-star"
                      style={{
                        color:
                          '#f0a500',
                      }}
/>{' '}
                    {course.rating ||
                      '0'}
                  </span>

                  <span
                    style={{
                      fontWeight: '700',
                      color: dm.heading,
                    }}
                  >
                    {Number(course.price) > 0
                      ? `$${Number(course.price).toFixed(2)}`
                      : 'Free'}
                  </span>
                </div>

                <button
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation();

                    setSelected(
                      course
                    );
                  }}
                  style={{
                    background:
                      dm.btnBack,
                    color:
                      'white',
                    border:
                      'none',
                    padding:
                      '10px 20px',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                    fontWeight:
                      '600',
                  }}
                >
                  <i className="fas fa-arrow-right" />{' '}
                  View Details
                </button>
              </div>
            )
          )}
        </div>
      )}

      <style>
        {`
          @keyframes courseCardEntrance {
            from {
              opacity: 0;
              transform: translateY(35px) scale(0.96);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </section>
  );
};

export default Courses;
