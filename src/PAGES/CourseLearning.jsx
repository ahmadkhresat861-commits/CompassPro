import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

const StarRating = ({ rating, onRate }) => (
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
          star <= rating
            ? 'fas fa-star'
            : 'far fa-star'
        }
        style={{
          color: '#f0a500',
          cursor: onRate ? 'pointer' : 'default',
          fontSize: '1.2rem',
          transition: 'transform 0.2s ease',
        }}
        onClick={() =>
          onRate && onRate(star)
        }
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

const Courses = () => {
  const navigate = useNavigate();
  const { darkMode } = useLang();

  const dm = {
    bg: darkMode ? '#0f1117' : '#f5f7fa',
    card: darkMode ? '#1e2130' : 'white',
    cardBorder: darkMode
      ? '#2e3250'
      : '#f0f0f0',
    heading: darkMode
      ? '#a0b4ff'
      : '#003366',
    text: darkMode
      ? '#c8d0e0'
      : '#555',
    subtext: darkMode
      ? '#7a8499'
      : '#888',
    input: darkMode
      ? '#1e2130'
      : 'white',
    inputBorder: darkMode
      ? '#3a4060'
      : '#ddd',
    inputColor: darkMode
      ? '#e0e6f0'
      : '#333',
    catActive: darkMode
      ? '#a0b4ff'
      : 'white',
    catActiveBg: darkMode
      ? '#2a3580'
      : '#003366',
    catBorder: darkMode
      ? '#a0b4ff'
      : '#003366',
    catInactive: darkMode
      ? '#a0b4ff'
      : '#003366',
    reviewBg: darkMode
      ? '#161a28'
      : 'white',
    successBg: darkMode
      ? '#0d2318'
      : '#f0fff4',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 15px rgba(0,0,0,0.08)',
    tagBg: darkMode
      ? '#2a3050'
      : '#f0f0f0',
    tagColor: darkMode
      ? '#a0b4ff'
      : '#555',
    btnBack: darkMode
      ? '#2a3580'
      : '#003366',
  };

  // =========================
  // STATE
  // =========================

  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [reviews, setReviews] = useState([]);

  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');

  const [user, setUser] = useState(null);

  const [enrollment, setEnrollment] =
    useState(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [enrolling, setEnrolling] =
    useState(false);

  const [pageVisible, setPageVisible] =
    useState(false);

  const [detailsVisible, setDetailsVisible] =
    useState(false);

  const [message, setMessage] =
    useState('');

  // =========================
  // LOAD COURSES + USER
  // =========================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        const {
          data: coursesData,
          error,
        } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

        if (error) {
          console.error(
            'Error loading courses:',
            error
          );
        } else {
          setCourses(
            coursesData || []
          );
        }

        setTimeout(() => {
          setPageVisible(true);
        }, 100);
      } catch (error) {
        console.error(
          'Loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================
  // SELECT COURSE
  // =========================

  useEffect(() => {
    if (!selected) return;

    setDetailsVisible(false);

    setTimeout(() => {
      setDetailsVisible(true);
    }, 100);

    fetchReviews();
    checkEnrollment();
  }, [selected]);

  // =========================
  // FETCH REVIEWS
  // =========================

  const fetchReviews = async () => {
    if (!selected) return;

    setReviewLoading(true);

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

    setReviewLoading(false);
  };

  // =========================
  // CHECK ENROLLMENT
  // =========================

  const checkEnrollment = async () => {
    if (!user || !selected) {
      setEnrollment(null);
      return;
    }

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

    setEnrollment(data);
  };

  // =========================
  // ENROLL
  // =========================

  const handleEnroll = async () => {
    setMessage('');

    if (!user) {
      setMessage(
        'Please login first to enroll in this course.'
      );
      return;
    }

    if (!selected) return;

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

      // Save enrollment locally
      setEnrollment(data);

      // =========================
      // UPDATE STUDENTS COUNT
      // =========================

      const currentStudents =
        Number(selected.students) || 0;
      // students count is maintained by a database trigger

      setSelected({
        ...selected,
        students:
          currentStudents + 1,
      });

      setMessage(
        'You have successfully enrolled in this course! 🎉'
      );
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

  // =========================
  // START LEARNING
  // =========================

  const handleStartLearning = () => {
    if (!selected) return;

    navigate(
      `/courses/${selected.id}`
    );
  };

  // =========================
  // SUBMIT REVIEW
  // =========================

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

    if (!selected) return;

    setReviewLoading(true);

    const {
      error,
    } = await supabase
      .from('reviews')
      .upsert(
        {
          course_id: selected.id,
          user_id: user.id,
          rating: myRating,
          comment: comment,
        },
        {
          onConflict:
            'user_id,course_id',
        }
      );

    if (error) {
      console.error(
        'Review error:',
        error
      );

      setMessage(
        'Could not submit your review.'
      );

      setReviewLoading(false);
      return;
    }

    setSubmitted(true);

    setMessage(
      'Your review has been submitted successfully! ⭐'
    );

    await fetchReviews();

    setReviewLoading(false);
  };

  // =========================
  // BACK
  // =========================

  const handleBack = () => {
    setDetailsVisible(false);

    setTimeout(() => {
      setSelected(null);
      setReviews([]);
      setEnrollment(null);
      setSubmitted(false);
      setMyRating(0);
      setComment('');
      setMessage('');
    }, 250);
  };

  // =========================
  // RATING
  // =========================

  const avgRating = reviews.length
    ? (
        reviews.reduce(
          (total, review) =>
            total +
            Number(review.rating),
          0
        ) / reviews.length
      ).toFixed(1)
    : null;

  // =========================
  // FILTER
  // =========================

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

  const filtered =
    courses.filter((course) => {
      const matchesCategory =
        category === 'All' ||
        course.category ===
          category;

      const matchesSearch =
        course.title
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        course.category
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        matchesCategory &&
        matchesSearch
      );
    });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section
        style={{
          minHeight: '100vh',
          background: dm.bg,
          display: 'flex',
          justifyContent:
            'center',
          alignItems:
            'center',
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
            }}
          ></i>

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
  // COURSE DETAILS
  // ============================================================

  if (selected) {
    return (
      <section
        style={{
          padding:
            '60px 20px',
          maxWidth:
            '800px',
          margin:
            '0 auto',
          background:
            dm.bg,
          minHeight:
            '100vh',
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

        {/* BACK */}

        <button
          onClick={
            handleBack
          }
          style={{
            marginBottom:
              '30px',
            padding:
              '10px 20px',
            background:
              dm.btnBack,
            color:
              'white',
            border:
              'none',
            borderRadius:
              '8px',
            cursor:
              'pointer',
          }}
        >
          <i className="fas fa-arrow-left"></i>{' '}
          Back
        </button>

        {/* COURSE INFO */}

        <div
          style={{
            textAlign:
              'center',
            marginBottom:
              '40px',
            animation:
              'slideUp 0.7s ease both',
          }}
        >
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
              display:
                'flex',
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
            ></i>
          </div>

          <h1
            style={{
              color:
                dm.heading,
            }}
          >
            {selected.title}
          </h1>

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

          {/* STATS */}

          <div
            style={{
              display:
                'flex',
              justifyContent:
                'center',
              gap:
                '30px',
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
              ></i>

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
              ></i>

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
          </div>
        </div>

        {/* =========================
            ENROLLMENT / START LEARNING
        ========================= */}

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
            marginBottom:
              '30px',
            textAlign:
              'center',
            animation:
              'slideUp 0.7s 0.1s ease both',
          }}
        >

          {/* =========================
              ENROLLED
          ========================= */}

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
                <i className="fas fa-check-circle"></i>
              </div>

              <h3
                style={{
                  color:
                    dm.heading,
                  marginBottom:
                    '10px',
                }}
              >
                You are enrolled 🎉
              </h3>

              <p
                style={{
                  color:
                    dm.text,
                  marginBottom:
                    '20px',
                }}
              >
                Your progress:{' '}
                {enrollment.progress ||
                  0}
                %
              </p>

              {/* PROGRESS BAR */}

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
                  marginBottom:
                    '25px',
                }}
              >
                <div
                  style={{
                    width: `${
                      enrollment.progress ||
                      0
                    }%`,
                    height:
                      '100%',
                    background:
                      'linear-gradient(90deg, #003366, #f0a500)',
                    borderRadius:
                      '10px',
                    transition:
                      'width 0.5s ease',
                  }}
                ></div>
              </div>

              {/* =========================
                  START LEARNING BUTTON
              ========================= */}

              <button
                onClick={
                  handleStartLearning
                }
                style={{
                  width:
                    '100%',
                  padding:
                    '16px',
                  background:
                    'linear-gradient(90deg, #003366, #005599)',
                  color:
                    'white',
                  border:
                    'none',
                  borderRadius:
                    '10px',
                  fontWeight:
                    '700',
                  fontSize:
                    '1.05rem',
                  cursor:
                    'pointer',
                  boxShadow:
                    '0 8px 20px rgba(0,51,102,0.25)',
                  transition:
                    'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(-3px)';

                  e.currentTarget.style.boxShadow =
                    '0 12px 25px rgba(0,51,102,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(0)';

                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(0,51,102,0.25)';
                }}
              >
                <i className="fas fa-play"></i>{' '}
                Start Learning
              </button>
            </>
          ) : (

            /* =========================
               NOT ENROLLED
            ========================= */

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
                Enroll now and start your learning journey.
              </p>

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
                ></i>{' '}

                {enrolling
                  ? 'Enrolling...'
                  : 'Enroll Now'}
              </button>
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

        {/* =========================
            REVIEWS
        ========================= */}

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
            animation:
              'slideUp 0.7s 0.2s ease both',
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
            <i className="fas fa-star"></i>{' '}
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
              <i className="fas fa-spinner fa-spin"></i>{' '}
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
              (
                review,
                index
              ) => (
                <div
                  key={
                    review.id
                  }
                  style={{
                    padding:
                      '15px 0',
                    borderBottom:
                      `1px solid ${dm.cardBorder}`,
                    animation:
                      'fadeIn 0.5s ease both',
                    animationDelay:
                      `${index * 0.1}s`,
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

        {/* =========================
            ADD REVIEW
        ========================= */}

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
              <i className="fas fa-pen"></i>{' '}
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
                  <i className="fas fa-paper-plane"></i>{' '}
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
              animation:
                'successPop 0.6s ease both',
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
            ></i>

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

        {/* ANIMATIONS */}

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

            @keyframes successPop {
              0% {
                opacity: 0;
                transform: scale(0.8);
              }

              70% {
                transform: scale(1.05);
              }

              100% {
                opacity: 1;
                transform: scale(1);
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
        <i className="fas fa-book-open"></i>{' '}
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
          ></i>

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
          ></i>

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
                <div
                  className="card-icon"
                  style={{
                    color:
                      '#f0a500',
                  }}
                >
                  <i className="fas fa-book-open"></i>
                </div>

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
                  Explore this course and start learning today.
                </p>

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
                    <i className="fas fa-users"></i>{' '}
                    {
                      course.students ||
                      0
                    }
                  </span>

                  <span>
                    <i
                      className="fas fa-star"
                      style={{
                        color:
                          '#f0a500',
                      }}
                    ></i>{' '}
                    {
                      course.rating ||
                      '0'
                    }
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
                  <i className="fas fa-arrow-right"></i>{' '}
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
