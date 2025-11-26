import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; 
import './App.css';
import FlightSearch from './components/flightSearch/flightSearch.jsx';
import PackageDeals from './components/packagedeals/packageDeals.jsx';
import Footer from './components/footer/footer.jsx';
import OtherServices from './components/otherservices/otherservices.jsx';
import UserLogin from './components/userLogin/userLogin.jsx';
import UserSignup from './components/userSignup/userSignup.jsx';
import Payment from './components/payment/payment.jsx';
import PaymentSuccess from './components/payment/paymentSuccess.jsx';

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

// Main App Layout Component (with navigation)
function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState(null); // 'login', 'signup', or null

  const logoWhiteNav = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69083320f6799f841b19821b.png"; 
  const logoBlueHeader = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png"; 

  const pages = {
    flights: { name: 'Flight Search', path: '/' },
    packages: { name: 'Package Deals', path: '/packages' },
    otherservices: { name: 'Other Services', path: '/other-services' },
    profile: { name: 'Profile', path: '/profile' },
    help: { name: 'Help & Support', path: '/help' },
  };

  // Determine current page based on pathname
  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const page = Object.entries(pages).find(([_, page]) => page.path === currentPath);
    return page ? page[0] : 'packages';
  };

  const handleAuthPageChange = (page) => {
    if (page === 'main') {
      setAuthPage(null);
    } else {
      setAuthPage(page);
    }
  };

  // Show login or signup page if authPage is set
  if (authPage === 'login') {
    return <UserLogin setAuthPage={handleAuthPageChange} />;
  }

  if (authPage === 'signup') {
    return <UserSignup setAuthPage={handleAuthPageChange} />;
  }

  const currentPage = getCurrentPage();

  const handleNavigation = (pageKey) => {
    const path = pages[pageKey].path;
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // Check if on payment success page (hide footer only there)
  const isPaymentSuccessPage = location.pathname === '/payment/success';

  return (
    <div className="app-container">
      {/* Navigation bar - always visible */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="brand" onClick={() => handleNavigation('packages')}>
            <img 
              src={logoWhiteNav}
              alt="Wanderwave" 
              className="brand-logo brand-logo-desktop"
            />
            <img 
              src={logoWhiteNav} 
              alt="Wanderwave" 
              className="brand-logo brand-logo-mobile-nav"
            />
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
            <button 
              className="book-now-btn"
              onClick={() => setAuthPage('login')}
            >
              BOOK NOW
            </button>
          </div>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <img 
            src={logoBlueHeader} 
            alt="Wanderwave Travel & Tours"
            className="brand-logo brand-logo-mobile"
          />
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
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
        
        <button 
          className="book-now-btn"
          onClick={() => {
            setAuthPage('login');
            setIsMobileMenuOpen(false);
          }}
        >
          BOOK NOW
        </button>
      </div>

      <main className="main-content">
        <Routes>
          {/* Main navigation pages */}
          <Route path="/" element={<FlightSearch />} />
          <Route path="/packages" element={<PackageDeals />} />
          <Route path="/other-services" element={<OtherServices />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          
          {/* Payment pages */}
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
        </Routes>
      </main>

      {/* Footer - hide only on success page */}
      {!isPaymentSuccessPage && <Footer />}
    </div>
  );
}

// Root App Component with BrowserRouter
function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

export default App;