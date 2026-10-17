import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import Button from '../components/Button';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminHome from '../components/AdminHome';

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
  const emptySessionForm = {
    title: '',
    course: '',
    data: '',
    time: '',
    instructor: '',
    zoom_link: '',
  };
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
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
  const [courseInstructorId, setCourseInstructorId] = useState('');

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
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonPdfFile, setLessonPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonStatus, setLessonStatus] = useState('');

  // =========================
  // Enrollments States
  // =========================
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

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
        type: newUserType === 'instructor' ? 'user' : newUserType,
      });

      // The server function creates admin/user; promote to instructor here (admin-only policy + trigger allow it)
      if (newUserType === 'instructor' && data?.user?.id) {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ type: 'instructor' })
          .eq('id', data.user.id);
        if (roleError) throw new Error('User created, but setting role failed: ' + roleError.message + ' (run supabase/sql/instructor_role.sql)');
      }

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
          'id, title, category, students, rating, description, image_url, price, instructor, instructor_id'
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
        instructor_id: courseInstructorId || null,
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
    setCourseInstructorId(course.instructor_id || '');
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
    setCourseInstructorId('');
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
          'id, course_id, title, description, content, lesson_order, video_url, pdf_url'
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
      let pdfUrl = lessonPdfUrl;

      if (lessonPdfFile) {
        setPdfUploading(true);

        const fileExt = lessonPdfFile.name.split('.').pop();
        const filePath = `${selectedCourseId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('lesson-files')
          .upload(filePath, lessonPdfFile);

        if (uploadError) {
          setPdfUploading(false);
          setLessonStatus('Failed to upload PDF: ' + uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('lesson-files')
          .getPublicUrl(filePath);

        pdfUrl = publicUrlData?.publicUrl || '';
        setPdfUploading(false);
      }

      const lessonData = {
        course_id: selectedCourseId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        content: lessonContent.trim(),
        video_url: lessonVideoUri.trim(),
        lesson_order: Number(lessonOrder) || 1,
        pdf_url: pdfUrl,
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
    setLessonVideoUri(lesson.video_url || '');
    setLessonOrder(lesson.lesson_order || 1);
    setLessonPdfUrl(lesson.pdf_url || '');
    setLessonPdfFile(null);
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
    setLessonPdfUrl('');
    setLessonPdfFile(null);
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

  // =========================
  // Add / Delete Session
  // =========================
  const handleAddSession = async () => {
    const f = sessionForm;
    if (!f.title.trim() || !f.data.trim() || !f.time.trim()) {
      alert('Title, date and time are required.');
      return;
    }

    let link = f.zoom_link.trim();
    if (link && !/^https?:\/\//i.test(link)) {
      alert('Meeting link must start with http:// or https://');
      return;
    }

    setSessionSaving(true);
    try {
      const payload = {
        title: f.title.trim(),
        course: f.course.trim() || null,
        data: f.data.trim(),
        time: f.time.trim(),
        instructor: f.instructor.trim() || null,
        zoom_link: link || null,
      };

      const { error } = editingSessionId
        ? await supabase.from('sessions').update(payload).eq('id', editingSessionId)
        : await supabase.from('sessions').insert([payload]);

      if (error) throw error;

      setSessionForm(emptySessionForm);
      setEditingSessionId(null);
      await fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      alert('Failed to add session: ' + error.message);
    } finally {
      setSessionSaving(false);
    }
  };

  const startEditSession = (session) => {
    setEditingSessionId(session.id);
    setSessionForm({
      title: session.title || '',
      course: session.course || '',
      data: session.data || '',
      time: session.time || '',
      instructor: session.instructor || '',
      zoom_link: session.zoom_link || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditSession = () => {
    setEditingSessionId(null);
    setSessionForm(emptySessionForm);
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Delete this session?')) return;

    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session: ' + error.message);
    }
  };

  // =========================
  // Fetch Contact Messages (read-only)
  // =========================
  const fetchMessages = async () => {
    setMessagesLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Failed to load messages: ' + error.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const toggleMessageReplied = async (m) => {
    const next = !m.replied;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ replied: next })
        .eq('id', m.id);
      if (error) throw error;
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, replied: next } : x))
      );
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Failed to update message (run messages_replied.sql first): ' + error.message);
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
  const changeProfileRole = async (id, type) => {
    const { error } = await supabase.from('profiles').update({ type }).eq('id', id);
    if (error) {
      alert('Could not change role: ' + error.message + ' (run supabase/sql/instructor_role.sql)');
      return;
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, type } : p)));
  };

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
          'id, title, course, data, time, instructor, zoom_link'
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
    if (activeTab === 'overview') {
      fetchCourses();
      fetchUsers();
      fetchReviews();
      fetchSessions();
      fetchEnrollments();
    }

    if (activeTab === 'courses') {
      fetchCourses();
      fetchProfiles();
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

    if (activeTab === 'messages') {
      fetchMessages();
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
        <DualOrbitLoader size={48} />
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
      icon: 'fas fa-user-graduate',
      label: 'Total Enrollments',
      value: enrollments.length,
      color: '#8b5cf6',
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
      icon: 'fas fa-house',
      label: 'Home',
      tab: 'home',
    },
    {
      icon: 'fas fa-chart-line',
      label: 'Analytics',
      tab: 'analytics',
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
      icon: 'fas fa-envelope',
      label: 'Messages',
      tab: 'messages',
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
        background: '#F3F7FC',
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
          top: '16px',
          left: '16px',
          borderRadius: '24px',
          height: 'calc(100vh - 32px)',
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
            CompassPro Admin
          </h2>
        </div>

        {menuItems.map((item) => (
          <div
            key={item.tab}
            onClick={() =>
              setActiveTab(item.tab)
            }
            style={{
              padding: '11px 18px',
              margin: '4px 14px',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background:
                activeTab === item.tab
                  ? '#F0A500'
                  : 'transparent',
            }}
          >
            <i
              className={item.icon}
              style={{
                color:
                  activeTab === item.tab
                    ? '#003366'
                    : '#a8c8f0',
              }}
            ></i>

            <span
              style={{
                color:
                  activeTab === item.tab
                    ? '#003366'
                    : '#a8c8f0',
                fontWeight:
                  activeTab === item.tab ? 700 : 400,
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
          marginLeft: '282px',
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
              fontSize: '2rem',
              fontWeight: 800,
            }}
          >
            {activeTab === 'overview' && (
              <>
                <i className="fas fa-chart-pie"></i>{' '}
                Overview
              </>
            )}

            {activeTab === 'home' && (
              <>
                <i className="fas fa-house"></i>{' '}
                Home Page
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                <i className="fas fa-chart-line"></i>{' '}
                Analytics
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

            {activeTab === 'messages' && (
              <>
                <i className="fas fa-envelope"></i>{' '}
                Contact Messages
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

        {activeTab === 'home' && <AdminHome />}
        {activeTab === 'analytics' && <AdminAnalytics />}

        {/* =========================
            Overview
        ========================= */}
        {activeTab === 'overview' && (
          <>
            {(coursesLoading ||
              usersLoading ||
              reviewsLoading ||
              sessionsLoading ||
              enrollmentsLoading) && (
              <p style={{ color: '#4A5D78', marginBottom: '20px' }}>
                <i className="fas fa-spinner fa-spin"></i> Loading live
                stats...
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                marginBottom: '30px',
              }}
            >
              {stats.map((stat, si) => (
                <div
                  key={stat.label}
                  style={{
                    flex: '1',
                    minWidth: '200px',
                    background: ['#E6F0FB', '#FFF3D6', '#E3F5EC'][si % 3],
                    borderRadius: '24px',
                    padding: '25px',
                    textAlign: 'center',
                    boxShadow:
                      '0 4px 20px rgba(0,51,102,0.08)',
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
                      color: '#4A5D78',
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
                borderRadius: '24px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,51,102,0.08)',
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
                  color: '#4A5D78',
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
                borderRadius: '24px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,51,102,0.08)',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
                    }}
                  />

                  <select
                    value={courseInstructorId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setCourseInstructorId(id);
                      const ins = profiles.find((x) => x.id === id);
                      if (ins) setCourseInstructor(ins.username || '');
                    }}
                    style={{
                      padding: '14px',
                      border: '1px solid #CBD7E8',
                      borderRadius: '14px',
                      background: 'white',
                    }}
                  >
                    <option value="">No instructor account (name only)</option>
                    {profiles
                      .filter((x) => x.type === 'instructor')
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.username || x.id}
                        </option>
                      ))}
                  </select>

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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                    border: '1px solid #CBD7E8',
                    borderRadius: '14px',
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
                        color: '#4A5D78',
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
                        borderRadius: '14px',
                        border: '1px solid #CBD7E8',
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
                      borderRadius: '999px',
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
                        borderRadius: '999px',
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
                borderRadius: '24px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,51,102,0.08)',
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
                    borderRadius: '999px',
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
                    color: '#4A5D78',
                  }}
                >
                  <i className="fas fa-spinner fa-spin"></i>{' '}
                  Loading courses...
                </p>
              ) : courses.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: '#4A5D78',
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
                borderRadius: '24px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
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
                  border: '1px solid #CBD7E8',
                  borderRadius: '14px',
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
                    borderRadius: '24px',
                    padding: '30px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
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
                          border: '1px solid #CBD7E8',
                          borderRadius: '14px',
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
                          border: '1px solid #CBD7E8',
                          borderRadius: '14px',
                        }}
                      />

                      <input
                        type="url"
                        placeholder="Video URL"
                        value={lessonVideoUri}
                        onChange={(e) => setLessonVideoUri(e.target.value)}
                        style={{
                          padding: '14px',
                          border: '1px solid #CBD7E8',
                          borderRadius: '14px',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: '#003366',
                          fontSize: '0.9rem',
                        }}
                      >
                        <i className="fas fa-file-pdf"></i>{' '}
                        Lesson PDF (optional)
                      </label>

                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setLessonPdfFile(e.target.files?.[0] || null)
                        }
                        style={{
                          padding: '10px',
                          border: '1px solid #CBD7E8',
                          borderRadius: '14px',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />

                      {lessonPdfUrl && !lessonPdfFile && (
                        <p
                          style={{
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            color: '#10b981',
                          }}
                        >
                          <i className="fas fa-check-circle"></i> Current
                          file:{' '}
                          <a
                            href={lessonPdfUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View PDF
                          </a>{' '}
                          (choose a new file above to replace it)
                        </p>
                      )}
                    </div>

                    <textarea
                      placeholder="Short Description"
                      value={lessonDescription}
                      onChange={(e) => setLessonDescription(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '1px solid #CBD7E8',
                        borderRadius: '14px',
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
                        border: '1px solid #CBD7E8',
                        borderRadius: '14px',
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
                        disabled={pdfUploading}
                        style={{
                          background: pdfUploading ? '#999' : '#003366',
                          color: 'white',
                          border: 'none',
                          padding: '12px 25px',
                          borderRadius: '14px',
                          cursor: pdfUploading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        <i
                          className={
                            pdfUploading
                              ? 'fas fa-spinner fa-spin'
                              : editingLessonId
                              ? 'fas fa-save'
                              : 'fas fa-plus'
                          }
                        ></i>{' '}
                        {pdfUploading
                          ? 'Uploading PDF...'
                          : editingLessonId
                          ? 'Update Lesson'
                          : 'Add Lesson'}
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
                            borderRadius: '999px',
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
                    borderRadius: '24px',
                    padding: '30px',
                    boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
                    overflowX: 'auto',
                  }}
                >
                  <h2 style={{ color: '#003366', marginTop: 0 }}>
                    Lessons in this Course
                  </h2>

                  {lessonsLoading ? (
                    <p style={{ textAlign: 'center', color: '#4A5D78' }}>
                      <i className="fas fa-spinner fa-spin"></i> Loading
                      lessons...
                    </p>
                  ) : lessons.length === 0 ? (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#4A5D78',
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
                              {lesson.video_url ? (
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
                              {lesson.pdf_url && (
                                <i
                                  className="fas fa-file-pdf"
                                  style={{
                                    color: '#ef4444',
                                    marginLeft: '8px',
                                  }}
                                  title="Has PDF"
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
                                  borderRadius: '10px',
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
                                  borderRadius: '10px',
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
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
              overflowX: 'auto',
            }}
          >
            <h2 style={{ color: '#003366', marginTop: 0 }}>
              <i className="fas fa-user-graduate"></i> All Enrollments
            </h2>

            {enrollmentsLoading ? (
              <p style={{ textAlign: 'center', color: '#4A5D78', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin"></i> Loading
                enrollments...
              </p>
            ) : enrollments.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#4A5D78', padding: '40px' }}>
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
            Contact Messages
        ========================= */}
        {activeTab === 'messages' && (
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,51,102,0.08)',
            }}
          >
            <h2 style={{ color: '#003366', marginTop: 0 }}>
              <i className="fas fa-envelope"></i> Messages ({messages.length})
            </h2>

            {messagesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <DualOrbitLoader size={40} />
              </div>
            ) : messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#4A5D78', padding: '40px' }}>
                No messages yet.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    border: '1px solid #e8edf3',
                    borderRadius: '10px',
                    padding: '16px 18px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <strong style={{ color: '#003366' }}>
                      {m.name}
                      {m.replied && (
                        <span style={{
                          marginInlineStart: 10, fontSize: '0.72rem', fontWeight: 700,
                          background: '#e6f4ea', color: '#2e7d32',
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          Replied
                        </span>
                      )}
                    </strong>
                    <span style={{ color: '#4A5D78', fontSize: '0.85rem' }}>
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>

                  <a
                    href={`mailto:${m.email}`}
                    style={{ color: '#0077b6', fontSize: '0.9rem' }}
                  >
                    <i className="fas fa-reply"></i> {m.email}
                  </a>

                  <p
                    style={{
                      margin: '10px 0 0',
                      color: '#0F2340',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.message}
                  </p>

                  <div style={{ marginTop: 12 }}>
                    <Button
                      variant={m.replied ? 'outline' : 'success'}
                      size="sm"
                      icon={m.replied ? 'fas fa-rotate-left' : 'fas fa-check'}
                      onClick={() => toggleMessageReplied(m)}
                    >
                      {m.replied ? 'Mark as unreplied' : 'Mark as replied'}
                    </Button>
                  </div>
                </div>
              ))
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
                borderRadius: '24px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,51,102,0.08)',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
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
                        '1px solid #CBD7E8',
                      borderRadius: '14px',
                    }}
                  >
                    <option value="user">
                      User
                    </option>

                    <option value="instructor">
                      Instructor
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
                    borderRadius: '14px',
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
                borderRadius: '24px',
                padding: '30px',
                boxShadow:
                  '0 4px 15px rgba(0,51,102,0.08)',
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
                    borderRadius: '14px',
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
                    color: '#4A5D78',
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
                    color: '#4A5D78',
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
              borderRadius: '24px',
              padding: '30px',
              maxWidth: '700px',
              boxShadow:
                '0 4px 15px rgba(0,51,102,0.08)',
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
                    '1px solid #CBD7E8',
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
                    '1px solid #CBD7E8',
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
              borderRadius: '24px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,51,102,0.08)',
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
                  color: '#4A5D78',
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
                          {profile.type === 'admin' ? (
                            'admin'
                          ) : (
                            <select
                              value={profile.type === 'instructor' ? 'instructor' : 'user'}
                              onChange={(e) => changeProfileRole(profile.id, e.target.value)}
                              style={{ padding: '8px 12px', border: '1px solid #CBD7E8', borderRadius: 10, background: 'white' }}
                            >
                              <option value="user">user</option>
                              <option value="instructor">instructor</option>
                            </select>
                          )}
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
              borderRadius: '24px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,51,102,0.08)',
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
                  color: '#4A5D78',
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
              borderRadius: '24px',
              padding: '30px',
              boxShadow:
                '0 4px 15px rgba(0,51,102,0.08)',
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {[
                ['title', 'Title *'],
                ['course', 'Course'],
                ['data', 'Date * (e.g. 2026-11-20)'],
                ['time', 'Time * (e.g. 7:00 PM)'],
                ['instructor', 'Instructor'],
                ['zoom_link', 'Meeting link (https://...)'],
              ].map(([key, label]) => (
                <input
                  key={key}
                  type="text"
                  placeholder={label}
                  value={sessionForm[key]}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, [key]: e.target.value })
                  }
                  style={{
                    padding: '12px',
                    border: '1px solid #d8dee6',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                  }}
                />
              ))}
              <Button
                variant="primary"
                icon={editingSessionId ? 'fas fa-check' : 'fas fa-plus'}
                loading={sessionSaving}
                onClick={handleAddSession}
              >
                {editingSessionId ? 'Save Changes' : 'Add Session'}
              </Button>
              {editingSessionId && (
                <Button variant="outline" onClick={cancelEditSession}>
                  Cancel
                </Button>
              )}
            </div>

            {sessionsLoading ? (
              <p>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#4A5D78',
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

                    <th style={{ padding: '15px' }}>
                      Actions
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

                        <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon="fas fa-pen"
                            onClick={() => startEditSession(session)}
                            style={{ marginInlineEnd: 8 }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon="fas fa-trash"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            Delete
                          </Button>
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
