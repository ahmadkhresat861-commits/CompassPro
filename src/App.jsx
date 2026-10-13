import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './PAGES/Login'
import SignUp from './PAGES/SignUp'
import Home from './PAGES/Home'
import About from './PAGES/About'
import Services from './PAGES/Services'
import Courses from './PAGES/Courses'
import Dashboard from './PAGES/Dashboard'
import Profile from './PAGES/Profile'
import Contact from './PAGES/Contact'
import Admin from './PAGES/Admin'
import Sessions from './PAGES/Sessions'
import Verify from './PAGES/Verify'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AIAssistant from './components/AIAssistant'

import { LanguageProvider } from './LanguageContext'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>

          {/* ROOT — redirect to the public home page */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<SignUp />}
          />

          {/* HOME — public, guests can browse */}
          <Route
            path="/home"
            element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            }
          />

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
                  <h1 style={{ fontSize: '4rem', margin: 0, color: '#003366' }}>404</h1>
                  <p style={{ color: '#666', margin: '10px 0 24px' }}>This page does not exist.</p>
                  <a href="/home" style={{ background: '#003366', color: '#fff', padding: '12px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>Back to Home</a>
                </div>
                <Footer />
              </>
            }
          />

        </Routes>

        <AIAssistant />

      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
