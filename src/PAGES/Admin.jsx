import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import '../App.css';

const Admin = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // =========================
  // Data States
  // =========================
  const [profiles, setProfiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);

  // =========================
  // Loading States
  // =========================
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);

  // =========================
  // User Form States
  // =========================
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserType, setNewUserType] = useState('user');
  const [userStatus, setUserStatus] = useState('');

  // =========================
  // Notification States
  // =========================
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');

  // =========================
  // Course Form States
  // =========================
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseStudents, setCourseStudents] = useState(0);
  const [courseRating, setCourseRating] = useState(0);
  const [courseDescription, setCourseDescription] = useState('');
  const [courseImageUrl, setCourseImageUrl] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseInstructor, setCourseInstructor] = useState('');

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseStatus, setCourseStatus] = useState('');

  // =========================
  // Lessons States
  // =========================
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUri, setLessonVideoUri] = useState('');
  const [lessonOrder, setLessonOrder] = useState(1);

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonStatus, setLessonStatus] = useState('');

  // =========================
  // Enrollments States
  // =========================
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // =========================
  // Check Admin
  // =========================
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('type')
          .eq('id', user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile ||
          profile.type !== 'admin'
        ) {
          navigate('/home');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/home');
      }
    };

    checkAdmin();
  }, [navigate]);

  // =========================
  // Edge Function Helper
  // =========================
  const callAdminFunction = async (body = {}) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error('You are not authenticated.');
      }

      const { data, error } = await supabase.functions.invoke(
        'quick-action',
        {
          body,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(
          error.message || 'Edge Function request failed.'
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('callAdminFunction error:', error);
      throw error;
    }
  };

  // =========================
  // Fetch Users
  // =========================
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUserStatus('');

    try {
      const data = await callAdminFunction({
        action: 'list',
      });

      setUsers(data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);

      setUsers([]);

      setUserStatus(
        'Failed to load users: ' +
          (error?.message || 'Unknown error')
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // =========================
  // Create User
  // =========================
  const createUser = async (e) => {
    e.preventDefault();

    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setUserStatus('Email and password are required.');
      return;
    }

    if (newUserPassword.length < 6) {
      setUserStatus(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setUserActionLoading(true);
    setUserStatus('');

    try {
      const data = await callAdminFunction({
        action: 'create',
        email: newUserEmail.trim(),
        password: newUserPassword,
        username:
          newUserUsername.trim() ||
          newUserEmail.trim().split('@')[0],
        type: newUserType,
      });

      setUserStatus(
        data?.message ||
          'User created successfully!'
      );

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserUsername('');
      setNewUserType('user');

      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);

      setUserStatus(
        'Failed to create user: ' +
          (error?.message || 'Unknown error')
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  // =========================
  // Delete User
  // =========================
  const deleteUser = async (userId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user?'
    );

    if (!confirmed) return;

    setUserActionLoading(true);
    setUserStatus('');

    try {
      const data = await callAdminFunction({
        action: 'delete',
        userId,
      });

      setUserStatus(
        data?.message ||
          'User deleted successfully!'
      );

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== userId
        )
      );
    } catch (error) {
      console.error('Error deleting user:', error);

      setUserStatus(
        'Failed to delete user: ' +
          (error?.message || 'Unknown error')
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  // =========================
  // Fetch Courses
  // =========================
  const fetchCourses = async () => {
    setCoursesLoading(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(
          'id, title, category, students, rating, description, image_url, price, instructor'
        )
        .order('id', { ascending: false });

      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error(
        'Error fetching courses:',
        error
      );

      alert(
        'Failed to load courses: ' +
          error.message
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  // =========================
  // Add / Update Course
  // =========================
  const saveCourse = async (e) => {
    e.preventDefault();

    if (
      !courseTitle.trim() ||
      !courseCategory.trim()
    ) {
      setCourseStatus(
        'Please enter course title and category.'
      );
      return;
    }

    try {
      const courseData = {
        title: courseTitle.trim(),
        category: courseCategory.trim(),
        students: Number(courseStudents) || 0,
        rating: Number(courseRating) || 0,
        description: courseDescription.trim(),
        image_url: courseImageUrl.trim(),
        price: Number(coursePrice) || 0,
        instructor: courseInstructor.trim(),
      };

      let error;

      if (editingCourseId) {
        const result = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourseId);

        error = result.error;
      } else {
        const result = await supabase
          .from('courses')
          .insert([courseData]);

        error = result.error;
      }

      if (error) throw error;

      setCourseStatus(
        editingCourseId
          ? 'Course updated successfully!'
          : 'Course added successfully!'
      );

      resetCourseForm();
      await fetchCourses();
    } catch (error) {
      console.error(
        'Error saving course:',
        error
      );

      setCourseStatus(
        'Failed to save course: ' +
          error.message
      );
    }
  };

  // =========================
  // Delete Course
  // =========================
  const deleteCourse = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCourses((currentCourses) =>
        currentCourses.filter(
          (course) => course.id !== id
        )
      );
    } catch (error) {
      console.error(
        'Error deleting course:',
        error
      );

      alert(
        'Failed to delete course: ' +
          error.message
      );
    }
  };

  // =========================
  // Edit Course
  // =========================
  const editCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title || '');
    setCourseCategory(course.category || '');
    setCourseStudents(course.students || 0);
    setCourseRating(course.rating || 0);
    setCourseDescription(course.description || '');
    setCourseImageUrl(course.image_url || '');
    setCoursePrice(course.price || 0);
    setCourseInstructor(course.instructor || '');
    setCourseStatus('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =========================
  // Reset Course Form
  // =========================
  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseCategory('');
    setCourseStudents(0);
    setCourseRating(0);
    setCourseDescription('');
    setCourseImageUrl('');
    setCoursePrice(0);
    setCourseInstructor('');
    setCourseStatus('');
  };

  // =========================
  // Fetch Course Options (for Lessons dropdown)
  // =========================
  const fetchCourseOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;

      setCourseOptions(data || []);
    } catch (error) {
      console.error('Error fetching course options:', error);
      setCourseOptions([]);
    }
  };

  // =========================
  // Fetch Lessons for Selected Course
  // =========================
  const fetchLessons = async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }

    setLessonsLoading(true);

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(
          'id, course_id, title, description, content, lesson_order, video_uri'
        )
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true });

      if (error) throw error;

      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      alert('Failed to load lessons: ' + error.message);
    } finally {
      setLessonsLoading(false);
    }
  };

  // =========================
  // Add / Update Lesson
  // =========================
  const saveLesson = async (e) => {
    e.preventDefault();

    if (!selectedCourseId) {
      setLessonStatus('Please select a course first.');
      return;
    }

    if (!lessonTitle.trim()) {
      setLessonStatus('Please enter a lesson title.');
      return;
    }

    try {
      const lessonData = {
        course_id: selectedCourseId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        content: lessonContent.trim(),
        video_uri: lessonVideoUri.trim(),
        lesson_order: Number(lessonOrder) || 1,
      };

      let error;

      if (editingLessonId) {
        const result = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLessonId);

        error = result.error;
      } else {
        const result = await supabase
          .from('lessons')
          .insert([lessonData]);

        error = result.error;
      }

      if (error) throw error;

      setLessonStatus(
        editingLessonId
          ? 'Lesson updated successfully!'
          : 'Lesson added successfully!'
      );

      resetLessonForm();
      await fetchLessons(selectedCourseId);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setLessonStatus('Failed to save lesson: ' + error.message);
    }
  };

  // =========================
  // Delete Lesson
  // =========================
  const deleteLesson = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lesson?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLessons((current) =>
        current.filter((lesson) => lesson.id !== id)
      );
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson: ' + error.message);
    }
  };

  // =========================
  // Edit Lesson
  // =========================
  const editLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title || '');
    setLessonDescription(lesson.description || '');
    setLessonContent(lesson.content || '');
    setLessonVideoUri(lesson.video_uri || '');
    setLessonOrder(lesson.lesson_order || 1);
    setLessonStatus('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================
  // Reset Lesson Form
  // =========================
  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonContent('');
    setLessonVideoUri('');
    setLessonOrder(1);
    setLessonStatus('');
  };

  // =========================
  // Fetch Enrollments (read-only overview)
  // =========================
  const fetchEnrollments = async () => {
    setEnrollmentsLoading(true);

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, user_id, course_id, progress, completed')
        .order('id', { ascending: false });

      if (error) throw error;

      setEnrollments(data || []);

      // Make sure we have course titles and user emails to map against
      await fetchCourseOptions();
      if (users.length === 0) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      alert('Failed to load enrollments: ' + error.message);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const getCourseTitleById = (id) =>
    courseOptions.find((c) => String(c.id) === String(id))?.title ||
    `#${id}`;

  const getUserEmailById = (id) =>
    users.find((u) => String(u.id) === String(id))?.email || id;

  // =========================
  // Fetch Profiles
  // =========================
  const fetchProfiles = async () => {
    setProfilesLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, type, bio'
        )
        .order('username', {
          ascending: true,
        });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error(
        'Error fetching profiles:',
        error
      );

      alert(
        'Failed to load profiles: ' +
          error.message
      );
    } finally {
      setProfilesLoading(false);
    }
  };

  // =========================
  // Fetch Reviews
  // =========================
  const fetchReviews = async () => {
    setReviewsLoading(true);

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          'id, course_id, user_id, rating, comment'
        )
        .order('id', {
          ascending: false,
        });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error(
        'Error fetching reviews:',
        error
      );

      alert(
        'Failed to load reviews: ' +
          error.message
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  // =========================
  // Fetch Sessions
  // =========================
  const fetchSessions = async () => {
    setSessionsLoading(true);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(
          'id, title, course, data, time'
        )
        .order('id', {
          ascending: false,
        });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error(
        'Error fetching sessions:',
        error
      );

      alert(
        'Failed to load sessions: ' +
          error.message
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  // =========================
  // Load Data
  // =========================
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    }

    if (activeTab === 'users') {
      fetchUsers();
    }

    if (activeTab === 'profiles') {
      fetchProfiles();
    }

    if (activeTab === 'reviews') {
      fetchReviews();
    }

    if (activeTab === 'sessions') {
      fetchSessions();
    }

    if (activeTab === 'lessons') {
      fetchCourseOptions();
    }

    if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
  }, [activeTab]);

  // =========================
  // Load Lessons on Course Selection
  // =========================
  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons(selectedCourseId);
      resetLessonForm();
    } else {
      setLessons([]);
    }
  }, [selectedCourseId]);

  // =========================
  // Send Notification
  // =========================
  const sendNotification = async (e) => {
    e.preventDefault();

    if (
      !notificationTitle.trim() ||
      !notificationMessage.trim()
    ) {
      setNotificationStatus(
        'Please enter notification title and message.'
      );

      return;
    }

    setSendingNotification(true);
    setNotificationStatus('');

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            title:
              notificationTitle.trim(),
            message:
              notificationMessage.trim(),
          },
        ]);

      if (error) throw error;

      setNotificationStatus(
        'Notification sent successfully!'
      );

      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error(
        'Error sending notification:',
        error
      );

      setNotificationStatus(
        'Failed to send notification: ' +
          error.message
      );
    } finally {
      setSendingNotification(false);
    }
  };

  // =========================
  // Loading Screen
  // =========================
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i
          className="fas fa-spinner fa-spin"
          style={{
            fontSize: '3rem',
            color: '#003366',
          }}
        ></i>
      </div>
    );
  }

  // =========================
  // Stats
  // =========================
  const stats = [
    {
      icon: 'fas fa-users',
      label: 'Total Users',
      value: users.length,
      color: '#003366',
    },
    {
      icon: 'fas fa-book',
      label: 'Total Courses',
      value: courses.length,
      color: '#10b981',
    },
    {
      icon: 'fas fa-star',
      label: 'Total Reviews',
      value: reviews.length,
      color: '#f0a500',
    },
    {
      icon: 'fas fa-video',
      label: 'Total Sessions',
      value: sessions.length,
      color: '#6366f1',
    },
  ];

  const menuItems = [
    {
      icon: 'fas fa-chart-pie',
      label: 'Overview',
      tab: 'overview',
    },
    {
      icon: 'fas fa-book',
      label: 'Courses',
      tab: 'courses',
    },
    {
      icon: 'fas fa-list-ol',
      label: 'Lessons',
      tab: 'lessons',
    },
    {
      icon: 'fas fa-user-graduate',
      label: 'Enrollments',
      tab: 'enrollments',
    },
    {
      icon: 'fas fa-users',
      label: 'Users',
      tab: 'users',
    },
    {
      icon: 'fas fa-bell',
      label: 'Notifications',
      tab: 'notifications',
    },
    {
      icon: 'fas fa-user-circle',
      label: 'Profiles',
      tab: 'profiles',
    },
    {
      icon: 'fas fa-star',
      label: 'Reviews',
      tab: 'reviews',
    },
    {
      icon: 'fas fa-video',
      label: 'Sessions',
      tab: 'sessions',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
      }}
    >
      {/* =========================
          Sidebar
      ========================= */}
      <div
        style={{
          width: '250px',
          background: '#003366',
          color: 'white',
          padding: '30px 0',
          position: 'fixed',
          height: '100vh',
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0 25px 30px',
            borderBottom:
              '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h2
            style={{
              color: 'white',
              fontSize: '1.2rem',
            }}
          >
            <i
              className="fas fa-graduation-cap"
              style={{
                color: '#f0a500',
                marginRight: '8px',
              }}
            ></i>
            Zephyr Admin
          </h2>
        </div>

        {menuItems.map((item) => (
          <div
            key={item.tab}
            onClick={() =>
              setActiveTab(item.tab)
            }
            style={{
              padding: '15px 25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background:
                activeTab === item.tab
                  ? 'rgba(240,165,0,0.2)'
                  : 'transparent',
              borderLeft:
                activeTab === item.tab
                  ? '3px solid #f0a500'
                  : '3px solid transparent',
            }}
          >
            <i
              className={item.icon}
              style={{
                color:
                  activeTab === item.tab
                    ? '#f0a500'
                    : '#a8c8f0',
              }}
            ></i>

            <span
              style={{
                color:
                  activeTab === item.tab
                    ? 'white'
                    : '#a8c8f0',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}

        <div
          onClick={() => navigate('/home')}
          style={{
            padding: '15px 25px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          <i
            className="fas fa-arrow-left"
            style={{
              color: '#a8c8f0',
            }}
          ></i>

          <span
            style={{
              color: '#a8c8f0',
            }}
          >
            Back to Site
          </span>
        </div>
      </div>

      {/* =========================
          Main Content
      ========================= */}
      <div
        style={{
          marginLeft: '250px',
          flex: 1,
          padding: '40px',
        }}
      >
        {/* =========================
            Page Title
        ========================= */}
        <div
          style={{
            marginBottom: '30px',
          }}
        >
          <h1
            style={{
              color: '#003366',
            }}
          >
            {activeTab === 'overview' && (
              <>
                <i className="fas fa-chart-pie"></i>{' '}
                Overview
              </>
            )}

            {activeTab === 'courses' && (
              <>
                <i className="fas fa-book"></i>{' '}
                Courses Management
              </>
            )}

            {activeTab === 'lessons' && (
              <>
                <i className="fas fa-list-ol"></i>{' '}
                Lessons Management
              </>
            )}

            {activeTab === 'enrollments' && (
              <>
                <i className="fas fa-user-graduate"></i>{' '}
                Enrollments
              </>
            )}

            {activeTab === 'users' && (
              <>
                <i className="fas fa-users"></i>{' '}
                Users Management
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <i className="fas fa-bell"></i>{' '}
                Notifications
              </>
            )}

            {activeTab === 'profiles' && (
              <>
                <i className="fas fa-user-circle"></i>{' '}
                Profiles Management
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                <i className="fas fa-star"></i>{' '}
                Reviews Management
              </>
            )}

            {activeTab === 'sessions' && (
              <>
                <i className="fas fa-video"></i>{' '}
                Sessions Management
              </>
            )}
          </h1>
        </div>

        {/* =========================
            Overview
        ========================= */}
        {activeTab === 'overview' && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                marginBottom: '30px',
              }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    flex: '1',
                    minWidth: '200px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '25px',
                    textAlign: 'center',
                    boxShadow:
                      '0 4px 15px rgba(0,0,0,0.08)',
                    borderTop:
                      `4px solid ${stat.color}`,
                  }}
                >
                  <i
                    className={stat.icon}
                    style={{
                      fontSize: '2rem',
                      color: stat.color,
                      marginBottom: '10px',
                      display: 'block',
                    }}
                  ></i>

                  <h2
                    style={{
                      color: stat.color,
                      fontSize: '2rem',
                      margin: '0',
                    }}
                  >
                    {stat.value}
                  </h2>

                  <p
                    style={{
                      color: '#888',
                      fontSize: '0.9rem',
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
              }}
            >
              <h2
                style={{
                  color: '#003366',
                }}
              >
                <i className="fas fa-cogs"></i>{' '}
                Admin Control Panel
              </h2>

              <p
                style={{
                  color: '#888',
                }}
              >
                Use the sidebar to manage courses,
                users, profiles, reviews, sessions and
                notifications.
              </p>
            </div>
          </>
        )}

        {/* =========================
            Courses
        ========================= */}
        {activeTab === 'courses' && (
          <>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
              }}
            >
              <h2
                style={{
                  color: '#003366',
                  marginTop: 0,
                }}
              >
                <i className="fas fa-book"></i>{' '}
                {editingCourseId
                  ? 'Edit Course'
                  : 'Add New Course'}
              </h2>

              <form onSubmit={saveCourse}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Course Title"
                    value={courseTitle}
                    onChange={(e) =>
                      setCourseTitle(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Category"
                    value={courseCategory}
                    onChange={(e) =>
                      setCourseCategory(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="number"
                    placeholder="Students"
                    value={courseStudents}
                    onChange={(e) =>
                      setCourseStudents(
                        e.target.value
                      )
                    }
                    min="0"
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="number"
                    placeholder="Rating"
                    value={courseRating}
                    onChange={(e) =>
                      setCourseRating(
                        e.target.value
                      )
                    }
                    min="0"
                    max="5"
                    step="0.1"
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Instructor Name"
                    value={courseInstructor}
                    onChange={(e) =>
                      setCourseInstructor(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="number"
                    placeholder="Price (0 = Free)"
                    value={coursePrice}
                    onChange={(e) =>
                      setCoursePrice(
                        e.target.value
                      )
                    }
                    min="0"
                    step="0.01"
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="url"
                    placeholder="Image URL"
                    value={courseImageUrl}
                    onChange={(e) =>
                      setCourseImageUrl(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <textarea
                  placeholder="Course Description"
                  value={courseDescription}
                  onChange={(e) =>
                    setCourseDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginTop: '15px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />

                {courseImageUrl && (
                  <div style={{ marginTop: '15px' }}>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#888',
                        marginBottom: '8px',
                      }}
                    >
                      Image Preview:
                    </p>
                    <img
                      src={courseImageUrl}
                      alt="Course preview"
                      style={{
                        maxWidth: '220px',
                        maxHeight: '130px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {courseStatus && (
                  <p
                    style={{
                      color:
                        courseStatus.includes(
                          'successfully'
                        )
                          ? '#10b981'
                          : '#ef4444',
                      marginTop: '15px',
                    }}
                  >
                    {courseStatus}
                  </p>
                )}

                <div
                  style={{
                    marginTop: '20px',
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      background: '#003366',
                      color: 'white',
                      border: 'none',
                      padding:
                        '12px 25px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    <i
                      className={
                        editingCourseId
                          ? 'fas fa-save'
                          : 'fas fa-plus'
                      }
                    ></i>{' '}
                    {editingCourseId
                      ? 'Update Course'
                      : 'Add Course'}
                  </button>

                  {editingCourseId && (
                    <button
                      type="button"
                      onClick={
                        resetCourseForm
                      }
                      style={{
                        background: '#999',
                        color: 'white',
                        border: 'none',
                        padding:
                          '12px 25px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    color: '#003366',
                    margin: 0,
                  }}
                >
                  All Courses
                </h2>

                <button
                  onClick={fetchCourses}
                  style={{
                    background: '#003366',
                    color: 'white',
                    border: 'none',
                    padding:
                      '10px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-sync"></i>{' '}
                  Refresh
                </button>
              </div>

              {coursesLoading ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#888',
                  }}
                >
                  <i className="fas fa-spinner fa-spin"></i>{' '}
                  Loading courses...
                </p>
              ) : courses.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#888',
                    padding: '40px',
                  }}
                >
                  No courses found.
                </p>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          '#003366',
                        color: 'white',
                      }}
                    >
                      <th style={{ padding: '15px' }}>
                        ID
                      </th>
                      <th style={{ padding: '15px' }}>
                        Course
                      </th>
                      <th style={{ padding: '15px' }}>
                        Category
                      </th>
                      <th style={{ padding: '15px' }}>
                        Students
                      </th>
                      <th style={{ padding: '15px' }}>
                        Rating
                      </th>
                      <th style={{ padding: '15px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {courses.map(
                      (course) => (
                        <tr
                          key={
                            course.id
                          }
                          style={{
                            borderBottom:
                              '1px solid #f0f0f0',
                          }}
                        >
                          <td style={{ padding: '15px' }}>
                            {course.id}
                          </td>

                          <td
                            style={{
                              padding: '15px',
                              fontWeight:
                                '600',
                              color:
                                '#003366',
                            }}
                          >
                            {course.title}
                          </td>

                          <td style={{ padding: '15px' }}>
                            {course.category}
                          </td>

                          <td style={{ padding: '15px' }}>
                            {course.students}
                          </td>

                          <td
                            style={{
                              padding: '15px',
                              color:
                                '#f0a500',
                              fontWeight:
                                '600',
                            }}
                          >
                            ⭐ {course.rating}
                          </td>

                          <td style={{ padding: '15px' }}>
                            <button
                              onClick={() =>
                                editCourse(
                                  course
                                )
                              }
                              style={{
                                background:
                                  '#003366',
                                color:
                                  'white',
                                border:
                                  'none',
                                padding:
                                  '8px 12px',
                                borderRadius:
                                  '6px',
                                cursor:
                                  'pointer',
                                marginRight:
                                  '8px',
                              }}
                            >
                              <i className="fas fa-edit"></i>{' '}
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                deleteCourse(
                                  course.id
                                )
                              }
                              style={{
                                background:
                                  '#ef4444',
                                color:
                                  'white',
                                border:
                                  'none',
                                padding:
                                  '8px 12px',
                                borderRadius:
                                  '6px',
                                cursor:
                                  'pointer',
                              }}
                            >
                              <i className="fas fa-trash"></i>{' '}
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* =========================
            Lessons
        ========================= */}
        {activeTab === 'lessons' && (
          <>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              }}
            >
              <h2 style={{ color: '#003366', marginTop: 0 }}>
                <i className="fas fa-list-ol"></i> Select a Course
              </h2>

              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              >
                <option value="">-- Choose a course --</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourseId && (
              <>
                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  }}
                >
                  <h2 style={{ color: '#003366', marginTop: 0 }}>
                    <i className="fas fa-plus-circle"></i>{' '}
                    {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
                  </h2>

                  <form onSubmit={saveLesson}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Lesson Title"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        style={{
                          padding: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                        }}
                      />

                      <input
                        type="number"
                        placeholder="Lesson Order"
                        value={lessonOrder}
                        onChange={(e) => setLessonOrder(e.target.value)}
                        min="1"
                        style={{
                          padding: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                        }}
                      />

                      <input
                        type="url"
                        placeholder="Video URL"
                        value={lessonVideoUri}
                        onChange={(e) => setLessonVideoUri(e.target.value)}
                        style={{
                          padding: '14px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                        }}
                      />
                    </div>

                    <textarea
                      placeholder="Short Description"
                      value={lessonDescription}
                      onChange={(e) => setLessonDescription(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        marginTop: '15px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />

                    <textarea
                      placeholder="Lesson Content (text)"
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        marginTop: '15px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />

                    {lessonStatus && (
                      <p
                        style={{
                          color: lessonStatus.includes('successfully')
                            ? '#10b981'
                            : '#ef4444',
                          marginTop: '15px',
                        }}
                      >
                        {lessonStatus}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: '20px',
                        display: 'flex',
                        gap: '10px',
                      }}
                    >
                      <button
                        type="submit"
                        style={{
                          background: '#003366',
                          color: 'white',
                          border: 'none',
                          padding: '12px 25px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        <i
                          className={
                            editingLessonId ? 'fas fa-save' : 'fas fa-plus'
                          }
                        ></i>{' '}
                        {editingLessonId ? 'Update Lesson' : 'Add Lesson'}
                      </button>

                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={resetLessonForm}
                          style={{
                            background: '#999',
                            color: 'white',
                            border: 'none',
                            padding: '12px 25px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '30px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    overflowX: 'auto',
                  }}
                >
                  <h2 style={{ color: '#003366', marginTop: 0 }}>
                    Lessons in this Course
                  </h2>

                  {lessonsLoading ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                      <i className="fas fa-spinner fa-spin"></i> Loading
                      lessons...
                    </p>
                  ) : lessons.length === 0 ? (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#888',
                        padding: '40px',
                      }}
                    >
                      No lessons yet for this course.
                    </p>
                  ) : (
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                      <thead>
                        <tr style={{ background: '#003366', color: 'white' }}>
                          <th style={{ padding: '15px' }}>Order</th>
                          <th style={{ padding: '15px' }}>Title</th>
                          <th style={{ padding: '15px' }}>Video</th>
                          <th style={{ padding: '15px' }}>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {lessons.map((lesson) => (
                          <tr
                            key={lesson.id}
                            style={{ borderBottom: '1px solid #f0f0f0' }}
                          >
                            <td style={{ padding: '15px' }}>
                              {lesson.lesson_order}
                            </td>

                            <td
                              style={{
                                padding: '15px',
                                fontWeight: '600',
                                color: '#003366',
                              }}
                            >
                              {lesson.title}
                            </td>

                            <td style={{ padding: '15px' }}>
                              {lesson.video_uri ? (
                                <i
                                  className="fas fa-check-circle"
                                  style={{ color: '#10b981' }}
                                ></i>
                              ) : (
                                <i
                                  className="fas fa-minus-circle"
                                  style={{ color: '#ccc' }}
                                ></i>
                              )}
                            </td>

                            <td style={{ padding: '15px' }}>
                              <button
                                onClick={() => editLesson(lesson)}
                                style={{
                                  background: '#003366',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginRight: '8px',
                                }}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>

                              <button
                                onClick={() => deleteLesson(lesson.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* =========================
            Enrollments
        ========================= */}
        {activeTab === 'enrollments' && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              overflowX: 'auto',
            }}
          >
            <h2 style={{ color: '#003366', marginTop: 0 }}>
              <i className="fas fa-user-graduate"></i> All Enrollments
            </h2>

            {enrollmentsLoading ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin"></i> Loading
                enrollments...
              </p>
            ) : enrollments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                No enrollments found.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#003366', color: 'white' }}>
                    <th style={{ padding: '15px' }}>Course</th>
                    <th style={{ padding: '15px' }}>User</th>
                    <th style={{ padding: '15px' }}>Progress</th>
                    <th style={{ padding: '15px' }}>Completed</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      <td
                        style={{
                          padding: '15px',
                          fontWeight: '600',
                          color: '#003366',
                        }}
                      >
                        {getCourseTitleById(enrollment.course_id)}
                      </td>

                      <td style={{ padding: '15px', fontSize: '0.9rem' }}>
                        {getUserEmailById(enrollment.user_id)}
                      </td>

                      <td style={{ padding: '15px' }}>
                        {enrollment.progress || 0}%
                      </td>

                      <td style={{ padding: '15px' }}>
                        {enrollment.completed ? (
                          <span
                            style={{ color: '#10b981', fontWeight: '600' }}
                          >
                            <i className="fas fa-check-circle"></i> Yes
                          </span>
                        ) : (
                          <span style={{ color: '#f0a500' }}>In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* =========================
            Users
        ========================= */}
        {activeTab === 'users' && (
          <>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
              }}
            >
              <h2
                style={{
                  color: '#003366',
                  marginTop: 0,
                }}
              >
                <i className="fas fa-user-plus"></i>{' '}
                Create New User
              </h2>

              <form onSubmit={createUser}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                  }}
                >
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserEmail}
                    onChange={(e) =>
                      setNewUserEmail(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={newUserPassword}
                    onChange={(e) =>
                      setNewUserPassword(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Username"
                    value={newUserUsername}
                    onChange={(e) =>
                      setNewUserUsername(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />

                  <select
                    value={newUserType}
                    onChange={(e) =>
                      setNewUserType(
                        e.target.value
                      )
                    }
                    style={{
                      padding: '14px',
                      border:
                        '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="user">
                      User
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>
                </div>

                {userStatus && (
                  <p
                    style={{
                      color:
                        userStatus.includes(
                          'successfully'
                        )
                          ? '#10b981'
                          : '#ef4444',
                      marginTop: '15px',
                    }}
                  >
                    {userStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    userActionLoading
                  }
                  style={{
                    marginTop: '20px',
                    background:
                      userActionLoading
                        ? '#999'
                        : '#003366',
                    color: 'white',
                    border: 'none',
                    padding:
                      '12px 25px',
                    borderRadius: '8px',
                    cursor: userActionLoading
                      ? 'not-allowed'
                      : 'pointer',
                    fontWeight: '600',
                  }}
                >
                  <i
                    className={
                      userActionLoading
                        ? 'fas fa-spinner fa-spin'
                        : 'fas fa-user-plus'
                    }
                  ></i>{' '}
                  {userActionLoading
                    ? 'Processing...'
                    : 'Create User'}
                </button>
              </form>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    color: '#003366',
                    margin: 0,
                  }}
                >
                  <i className="fas fa-users"></i>{' '}
                  All Users
                </h2>

                <button
                  onClick={fetchUsers}
                  disabled={
                    usersLoading
                  }
                  style={{
                    background:
                      usersLoading
                        ? '#999'
                        : '#003366',
                    color: 'white',
                    border: 'none',
                    padding:
                      '10px 18px',
                    borderRadius: '8px',
                    cursor:
                      usersLoading
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  <i
                    className={
                      usersLoading
                        ? 'fas fa-spinner fa-spin'
                        : 'fas fa-sync'
                    }
                  ></i>{' '}
                  Refresh
                </button>
              </div>

              {userStatus && (
                <p
                  style={{
                    color:
                      userStatus.includes(
                        'successfully'
                      )
                        ? '#10b981'
                        : '#ef4444',
                  }}
                >
                  {userStatus}
                </p>
              )}

              {usersLoading ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#888',
                    padding: '40px',
                  }}
                >
                  <i className="fas fa-spinner fa-spin"></i>{' '}
                  Loading users...
                </p>
              ) : users.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#888',
                    padding: '40px',
                  }}
                >
                  No users found.
                </p>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          '#003366',
                        color: 'white',
                      }}
                    >
                      <th style={{ padding: '15px' }}>
                        ID
                      </th>

                      <th style={{ padding: '15px' }}>
                        Email
                      </th>

                      <th style={{ padding: '15px' }}>
                        Created At
                      </th>

                      <th style={{ padding: '15px' }}>
                        Status
                      </th>

                      <th style={{ padding: '15px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom:
                            '1px solid #f0f0f0',
                        }}
                      >
                        <td
                          style={{
                            padding: '15px',
                            fontSize: '12px',
                          }}
                        >
                          {user.id}
                        </td>

                        <td
                          style={{
                            padding: '15px',
                            fontWeight: '600',
                          }}
                        >
                          {user.email || '-'}
                        </td>

                        <td
                          style={{
                            padding: '15px',
                          }}
                        >
                          {user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleString()
                            : '-'}
                        </td>

                        <td
                          style={{
                            padding: '15px',
                          }}
                        >
                          {user.email_confirmed_at ? (
                            <span
                              style={{
                                color:
                                  '#10b981',
                                fontWeight:
                                  '600',
                              }}
                            >
                              Confirmed
                            </span>
                          ) : (
                            <span
                              style={{
                                color:
                                  '#f0a500',
                                fontWeight:
                                  '600',
                              }}
                            >
                              Not Confirmed
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: '15px',
                          }}
                        >
                          <button
                            onClick={() =>
                              deleteUser(
                                user.id
                              )
                            }
                            disabled={
                              userActionLoading
                            }
                            style={{
                              background:
                                userActionLoading
                                  ? '#999'
                                  : '#ef4444',
                              color:
                                'white',
                              border:
                                'none',
                              padding:
                                '8px 12px',
                              borderRadius:
                                '6px',
                              cursor:
                                userActionLoading
                                  ? 'not-allowed'
                                  : 'pointer',
                            }}
                          >
                            <i className="fas fa-trash"></i>{' '}
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* =========================
            Notifications
        ========================= */}
        {activeTab === 'notifications' && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '700px',
              boxShadow:
                '0 4px 15px rgba(0,0,0,0.08)',
            }}
          >
            <h2
              style={{
                color: '#003366',
              }}
            >
              <i className="fas fa-bell"></i>{' '}
              Send Notification
            </h2>

            <form
              onSubmit={
                sendNotification
              }
            >
              <input
                type="text"
                value={
                  notificationTitle
                }
                onChange={(e) =>
                  setNotificationTitle(
                    e.target.value
                  )
                }
                placeholder="Notification Title"
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom:
                    '15px',
                  border:
                    '1px solid #ddd',
                  borderRadius:
                    '8px',
                  boxSizing:
                    'border-box',
                }}
              />

              <textarea
                value={
                  notificationMessage
                }
                onChange={(e) =>
                  setNotificationMessage(
                    e.target.value
                  )
                }
                placeholder="Notification Message"
                rows="5"
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom:
                    '15px',
                  border:
                    '1px solid #ddd',
                  borderRadius:
                    '8px',
                  boxSizing:
                    'border-box',
                }}
              />

              {notificationStatus && (
                <p
                  style={{
                    color:
                      notificationStatus.includes(
                        'successfully'
                      )
                        ? '#10b981'
                        : '#ef4444',
                  }}
                >
                  {notificationStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  sendingNotification
                }
                style={{
                  background:
                    sendingNotification
                      ? '#999'
                      : '#003366',
                  color: 'white',
                  border: 'none',
                  padding:
                    '14px 25px',
                  borderRadius:
                    '8px',
                  cursor:
                    sendingNotification
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <i
                  className={
                    sendingNotification
                      ? 'fas fa-spinner fa-spin'
                      : 'fas fa-paper-plane'
                  }
                ></i>{' '}
                {sendingNotification
                  ? 'Sending...'
                  : 'Send Notification'}
              </button>
            </form>
          </div>
        )}

        {/* =========================
            Profiles
        ========================= */}
        {activeTab === 'profiles' && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,0,0,0.08)',
              overflowX: 'auto',
            }}
          >
            <h2
              style={{
                color: '#003366',
              }}
            >
              <i className="fas fa-user-circle"></i>{' '}
              Profiles
            </h2>

            {profilesLoading ? (
              <p>Loading profiles...</p>
            ) : profiles.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#888',
                  padding: '40px',
                }}
              >
                No profiles found.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        '#003366',
                      color: 'white',
                    }}
                  >
                    <th style={{ padding: '15px' }}>
                      ID
                    </th>

                    <th style={{ padding: '15px' }}>
                      Username
                    </th>

                    <th style={{ padding: '15px' }}>
                      Type
                    </th>

                    <th style={{ padding: '15px' }}>
                      Bio
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map(
                    (profile) => (
                      <tr
                        key={
                          profile.id
                        }
                      >
                        <td style={{ padding: '15px' }}>
                          {profile.id}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {profile.username ||
                            '-'}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {profile.type ||
                            '-'}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {profile.bio ||
                            '-'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* =========================
            Reviews
        ========================= */}
        {activeTab === 'reviews' && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,0,0,0.08)',
              overflowX: 'auto',
            }}
          >
            <h2
              style={{
                color: '#003366',
              }}
            >
              <i className="fas fa-star"></i>{' '}
              Reviews
            </h2>

            {reviewsLoading ? (
              <p>Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#888',
                  padding: '40px',
                }}
              >
                No reviews found.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        '#003366',
                      color: 'white',
                    }}
                  >
                    <th style={{ padding: '15px' }}>
                      ID
                    </th>

                    <th style={{ padding: '15px' }}>
                      Course ID
                    </th>

                    <th style={{ padding: '15px' }}>
                      User ID
                    </th>

                    <th style={{ padding: '15px' }}>
                      Rating
                    </th>

                    <th style={{ padding: '15px' }}>
                      Comment
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reviews.map(
                    (review) => (
                      <tr
                        key={
                          review.id
                        }
                      >
                        <td style={{ padding: '15px' }}>
                          {review.id}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {review.course_id}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {review.user_id}
                        </td>

                        <td style={{ padding: '15px' }}>
                          ⭐ {review.rating}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {review.comment ||
                            '-'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* =========================
            Sessions
        ========================= */}
        {activeTab === 'sessions' && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,0,0,0.08)',
              overflowX: 'auto',
            }}
          >
            <h2
              style={{
                color: '#003366',
              }}
            >
              <i className="fas fa-video"></i>{' '}
              Sessions
            </h2>

            {sessionsLoading ? (
              <p>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#888',
                  padding: '40px',
                }}
              >
                No sessions found.
              </p>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse:
                    'collapse',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        '#003366',
                      color: 'white',
                    }}
                  >
                    <th style={{ padding: '15px' }}>
                      ID
                    </th>

                    <th style={{ padding: '15px' }}>
                      Title
                    </th>

                    <th style={{ padding: '15px' }}>
                      Course
                    </th>

                    <th style={{ padding: '15px' }}>
                      Date
                    </th>

                    <th style={{ padding: '15px' }}>
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map(
                    (session) => (
                      <tr
                        key={
                          session.id
                        }
                      >
                        <td style={{ padding: '15px' }}>
                          {session.id}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {session.title ||
                            '-'}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {session.course ||
                            '-'}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {session.data ||
                            '-'}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {session.time ||
                            '-'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
