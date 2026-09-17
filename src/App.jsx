import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './PAGES/Login'
import SignUp from './PAGES/SignUp'
import Home from './PAGES/Home'
import Courses from './PAGES/Courses'
import Dashboard from './PAGES/Dashboard'
import Profile from './PAGES/Profile'
import Contact from './PAGES/Contact'
import Admin from './PAGES/Admin'
import Sessions from './PAGES/Sessions'

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

        </Routes>

        <AIAssistant />

      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
