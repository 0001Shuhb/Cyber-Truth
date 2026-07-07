// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'

// Pages
import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import DashboardPage      from './pages/DashboardPage'
import UrlScannerPage     from './pages/UrlScannerPage'
import EmailScannerPage   from './pages/EmailScannerPage'
import WebsiteScannerPage from './pages/WebsiteScannerPage'
import ReportPage         from './pages/ReportPage'
import HistoryPage        from './pages/HistoryPage'
import AdminPage          from './pages/AdminPage'
import SettingsPage       from './pages/SettingsPage'
import ThreatIntelligencePage from './pages/ThreatIntelligencePage'

// Legal & Info Pages
import PrivacyPolicyPage  from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import CookiePolicyPage   from './pages/CookiePolicyPage'
import DisclaimerPage     from './pages/DisclaimerPage'
import AboutPage          from './pages/AboutPage'
import ContactPage        from './pages/ContactPage'

// Layout wrappers
import PublicPageLayout   from './components/common/PublicPageLayout'

export default function App() {
  return (
    /*
      AuthProvider wraps everything because authentication state 
      needs to be accessible from every page.
      ThemeProvider wraps everything for the same reason.
      Order matters: AuthProvider is outermost because ThemeProvider
      might need to check if user is logged in for preferences.
    */
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* Public routes — accessible without login */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public legal & info pages */}
          <Route element={<PublicPageLayout />}>
            <Route path="/privacy"    element={<PrivacyPolicyPage />} />
            <Route path="/terms"      element={<TermsConditionsPage />} />
            <Route path="/cookies"    element={<CookiePolicyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/about"      element={<AboutPage />} />
            <Route path="/contact"    element={<ContactPage />} />
          </Route>
          
          {/* Protected routes — require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/scan/url"  element={<UrlScannerPage />} />
              <Route path="/scan/email"    element={<EmailScannerPage />} />
              <Route path="/scan/website"  element={<WebsiteScannerPage />} />
              <Route path="/threat-intel"  element={<ThreatIntelligencePage />} />
              <Route path="/report/:id"    element={<ReportPage />} />
              <Route path="/history"       element={<HistoryPage />} />
              <Route path="/settings"      element={<SettingsPage />} />
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          
          {/* Catch-all: redirect unknown routes to dashboard if logged in */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}