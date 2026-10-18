import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityProvider';
import Navbar from './components/Navbar';
import Guide from './pages/Guide';
import Reservation from './pages/Reservation';
import TicketDetail from './pages/TicketDetail';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityWidget from './components/AccessibilityWidget';

function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-brand-bg text-brand-charcoal flex flex-col transition-colors duration-150">
          
          {/* Main Navigation and A11y Panel */}
          <Navbar />
          <AccessibilityWidget />
          
          {/* Main Content Area */}
          <main id="main-content" className="flex-grow w-full focus:outline-none">
            <Routes>
              {/* Public Routes */}
              <Route path="/guide" element={<Guide />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Applicant flow */}
              <Route
                path="/reservation"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <Reservation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ticket/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route 
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['OFFICER']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Redirect Fallbacks */}
              <Route path="/" element={<Navigate to="/guide" replace />} />
              <Route path="*" element={<Navigate to="/guide" replace />} />
            </Routes>
          </main>
          
          {/* Accessible Footer */}
          <footer className="py-6 text-center text-sm border-t" style={{ background: 'linear-gradient(90deg, #0b5fa8 0%, #0d7fc8 100%)', color: '#ffffff', borderColor: '#0a4f90' }} role="contentinfo">
            <p>© 2026 Kantor Imigrasi Kelas I TPI Yogyakarta — SIAP.PRIORITAS, prototipe akademik Sistem Informasi Layanan Prioritas Paspor (bukan sistem produksi).</p>
          </footer>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
