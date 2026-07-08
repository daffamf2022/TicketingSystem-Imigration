import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityProvider';
import Navbar from './components/Navbar';
import Guide from './pages/Guide';
import Reservation from './pages/Reservation';
import TicketDetail from './pages/TicketDetail';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
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

              {/* Protected Routes */}
              <Route 
                path="/reservation" 
                element={
                  <ProtectedRoute>
                    <Reservation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ticket/:id" 
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
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
          <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm border-t border-slate-800" role="contentinfo">
            <p>© 2026 Kantor Imigrasi RI — SIAP-Prioritas (Sistem Antrean Paspor Inklusif).</p>
          </footer>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
