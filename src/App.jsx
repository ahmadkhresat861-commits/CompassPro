import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
const About = lazy(() => import('./pages/About'))
const Services = lazy(() => import('./pages/Services'))
const Courses = lazy(() => import('./pages/Courses'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Contact = lazy(() => import('./pages/Contact'))
const Admin = lazy(() => import('./pages/Admin'))
const Instructor = lazy(() => import('./pages/Instructor'))
const Sessions = lazy(() => import('./pages/Sessions'))
const InstructorProfile = lazy(() => import('./pages/InstructorProfile'))
const Verify = lazy(() => import('./pages/Verify'))
const Legal = lazy(() => import('./pages/Legal'))

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/guards/ProtectedRoute'
import AdminRoute from './components/guards/AdminRoute'
import InstructorRoute from './components/guards/InstructorRoute'
import AIAssistant from './components/home/AIAssistant'

import { LanguageProvider } from './context/LanguageContext'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Routes>

          {/* ROOT — redirect to the home page */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<SignUp />}
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* LEGAL — public */}
          <Route path="/privacy" element={<><Navbar /><Legal kind="privacy" /><Footer /></>} />
          <Route path="/terms" element={<><Navbar /><Legal kind="terms" /><Footer /></>} />

          {/* HOME — public page, same for visitors and members (edited from Admin > Home) */}
          <Route
            path="/home"
            element={
              <>
                <Navbar />
                <Home variant="landing" />
                <Footer />
              </>
            }
          />

          {/* PUBLIC INSTRUCTOR PROFILE (only admin-approved instructors) */}
          <Route path="/instructors/:id" element={<><Navbar /><InstructorProfile /><Footer /></>} />

          {/* ABOUT — public */}
          <Route
            path="/about"
            element={
              <>
                <Navbar />
                <About />
                <Footer />
              </>
            }
          />

          {/* SERVICES — public */}
          <Route
            path="/services"
            element={
              <>
                <Navbar />
                <Services />
                <Footer />
              </>
            }
          />

          {/* COURSES — public, guests can browse and view details */}
          <Route
            path="/courses"
            element={
              <>
                <Navbar />
                <Courses />
                <Footer />
              </>
            }
          />

          {/* COURSE DETAILS — public, unique URL per course for SEO */}
          <Route
            path="/courses/:id"
            element={
              <>
                <Navbar />
                <Courses />
                <Footer />
              </>
            }
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Dashboard />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Profile />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* CONTACT — public, guests can reach support */}
          <Route
            path="/contact"
            element={
              <>
                <Navbar />
                <Contact />
                <Footer />
              </>
            }
          />

          {/* VERIFY CERTIFICATE — public */}
          {['/verify', '/verify/:code'].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <>
                  <Navbar />
                  <Verify />
                  <Footer />
                </>
              }
            />
          ))}

          {/* SESSIONS */}
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Sessions />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* INSTRUCTOR */}
          <Route
            path="/instructor"
            element={
              <InstructorRoute>
                <Instructor />
              </InstructorRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 16px 60px' }}>
                  <h1 style={{ fontSize: '7.5rem', lineHeight: 1, fontWeight: 800, margin: 0, color: '#003366' }}>404</h1>
                  <p style={{ color: '#4A5D78', fontSize: '1.15rem', margin: '14px 0 28px' }}>This page does not exist.</p>
                  <a href="/home" style={{ background: '#F0A500', color: '#002347', padding: '14px 32px', borderRadius: 999, textDecoration: 'none', fontWeight: 800 }}>Back to Home</a>
                </div>
                <Footer />
              </>
            }
          />

        </Routes>
        </Suspense>

        <AIAssistant />

      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
