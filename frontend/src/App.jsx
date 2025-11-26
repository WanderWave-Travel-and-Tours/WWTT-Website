import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; 
import './App.css';
import FlightSearch from './components/flightSearch/flightSearch.jsx';
import PackageDeals from './components/packagedeals/packageDeals.jsx';
import Footer from './components/footer/footer.jsx';
import OtherServices from './components/otherservices/otherservices.jsx';
import UserAuth from './components/userLogin/userLogin.jsx'; 
import Payment from './components/payment/payment.jsx';
import PaymentSuccess from './components/payment/paymentSuccess.jsx';
import UserDashboard from './components/userDashboard/userDashboard.jsx';

const Profile = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Profile</h1>
      <p className="page-description">Manage your account settings and profile information</p>
    </div>
  </div>
);

const Help = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Help & Support</h1>
      <p className="page-description">Get help with your flights and bookings</p>
    </div>
  </div>
);

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState(null); // 'login', 'signup', or null
  const [currentUser, setCurrentUser] = useState(null); // ⭐ NEW: Track logged in user

  const logoWhiteNav = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69083320f6799f841b19821b.png"; 
  const logoBlueHeader = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png"; 

  const pages = {
    flights: { name: 'Flight Search', path: '/' },
    packages: { name: 'Package Deals', path: '/packages' },
    otherservices: { name: 'Other Services', path: '/other-services' },
    profile: { name: 'Profile', path: '/profile' },
    help: { name: 'Help & Support', path: '/help' },
  };

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const page = Object.entries(pages).find(([_, page]) => page.path === currentPath);
    return page ? page[0] : 'packages';
  };

  // ⭐ NEW: Handle login success
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthPage(null);
    navigate('/dashboard'); // Redirect to dashboard after login
  };

  // ⭐ NEW: Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/packages'); // Redirect to home after logout
  };

  const handleAuthPageChange = (page) => {
    if (page === 'main') {
      setAuthPage(null);
    } else {
      setAuthPage(page); // 'login' or 'signup'
    }
  };

  // Show UserAuth component if user clicks BOOK NOW
  if (authPage === 'login' || authPage === 'signup') {
    return <UserAuth setAuthPage={handleAuthPageChange} onLoginSuccess={handleLoginSuccess} />;
  }

  const currentPage = getCurrentPage();

  const handleNavigation = (pageKey) => {
    const path = pages[pageKey].path;
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isPaymentSuccessPage = location.pathname === '/payment/success';
  const isDashboardPage = location.pathname === '/dashboard'; // ⭐ NEW: Check if on dashboard

  return (
    <div className="app-container">
      {/* ⭐ Only show navbar if NOT on dashboard page */}
      {!isDashboardPage && (
        <>
          <nav className="navbar">
            <div className="navbar-content">
              <div className="brand" onClick={() => handleNavigation('packages')}>
                <img src={logoWhiteNav} alt="Wanderwave" className="brand-logo brand-logo-desktop" />
                <img src={logoWhiteNav} alt="Wanderwave" className="brand-logo brand-logo-mobile-nav" />
              </div>

              <div className="nav-links">
                {Object.entries(pages).map(([key, page]) => (
                  <button
                    key={key}
                    onClick={() => handleNavigation(key)}
                    className={`nav-btn ${currentPage === key ? 'active' : ''}`}
                  >
                    {page.name}
                  </button>
                ))}
              </div>

              <div className="nav-actions">
                {/* ⭐ Show user name or BOOK NOW button */}
                {currentUser ? (
                  <button className="user-profile-btn" onClick={() => navigate('/dashboard')}>
                    {currentUser.fullName}
                  </button>
                ) : (
                  <button className="book-now-btn" onClick={() => setAuthPage('login')}>
                    BOOK NOW
                  </button>
                )}
              </div>

              <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={28} />
              </button>
            </div>
          </nav>

          <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-header">
              <img src={logoBlueHeader} alt="Wanderwave Travel & Tours" className="brand-logo brand-logo-mobile" />
              <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={28} />
              </button>
            </div>
            
            <div className="mobile-nav-links">
              {Object.entries(pages).map(([key, page]) => (
                <button
                  key={key}
                  onClick={() => handleNavigation(key)}
                  className={`nav-btn ${currentPage === key ? 'active' : ''}`}
                >
                  {page.name}
                </button>
              ))}
            </div>
            
            {/* ⭐ Show user name or BOOK NOW in mobile menu */}
            {currentUser ? (
              <button 
                className="user-profile-btn"
                onClick={() => {
                  navigate('/dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                {currentUser.fullName}
              </button>
            ) : (
              <button 
                className="book-now-btn"
                onClick={() => {
                  setAuthPage('login');
                  setIsMobileMenuOpen(false);
                }}
              >
                BOOK NOW
              </button>
            )}
          </div>
        </>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<FlightSearch />} />
          <Route path="/packages" element={<PackageDeals />} />
          <Route path="/other-services" element={<OtherServices setAuthPage={setAuthPage} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          {/* ⭐ NEW: Dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              currentUser ? (
                <UserDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Please log in to access dashboard</h2>
                  <button onClick={() => setAuthPage('login')}>Login</button>
                </div>
              )
            } 
          />
        </Routes>
      </main>

      {/* ⭐ Only show footer if NOT on dashboard or payment success page */}
      {!isPaymentSuccessPage && !isDashboardPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;