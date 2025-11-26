import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react'; 
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

// Solid Icon Components for Top Bar
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <path d="M22 6l-10 7L2 6"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3" fill="#fc9c1b"/>
  </svg>
);

// Main App Layout Component (with navigation)
function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState(null); // 'login', 'signup', or null
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('TL');

  const logoNav = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69083320f6799f841b19821b.png"; 
  const logoBlueHeader = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png"; 

  const pages = {
    flights: { name: 'Flight Search', path: '/' },
    packages: { name: 'Package Deals', path: '/packages' },
    otherservices: { name: 'Other Services', path: '/other-services' },
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', shortCode: 'EN' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭', shortCode: 'TL' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳', shortCode: 'CN' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼', shortCode: 'TW' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', shortCode: 'JA' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', shortCode: 'KO' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', shortCode: 'ES' },
    { code: 'fr', name: 'French', flag: '🇫🇷', shortCode: 'FR' },
    { code: 'de', name: 'German', flag: '🇩🇪', shortCode: 'DE' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', shortCode: 'IT' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', shortCode: 'PT' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', shortCode: 'RU' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', shortCode: 'AR' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', shortCode: 'HI' },
    { code: 'th', name: 'Thai', flag: '🇹🇭', shortCode: 'TH' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', shortCode: 'VI' },
  ];

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

  const handleLanguageSelect = (lang) => {
    setCurrentLang(lang.shortCode);
    setIsTranslateOpen(false);
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
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="top-bar-item">
            <MailIcon />
            <span>info@wanderwavetravelandtours.com</span>
          </div>
          <div className="top-bar-item">
            <PhoneIcon />
            <span>+63 (44) 325 - 2836 | 0966 820 0292</span>
          </div>
          <div className="top-bar-item">
            <MapPinIcon />
            <span>Nueva Ecija, Philippines</span>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="brand" onClick={() => handleNavigation('packages')}>
            <img 
              src={logoNav}
              alt="Wanderwave" 
              className="brand-logo brand-logo-desktop"
            />
            <img 
              src={logoNav} 
              alt="Wanderwave" 
              className="brand-logo brand-logo-mobile-nav"
            />
          </div>

          <div className="nav-right">
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
              <div className="translate-wrapper">
                <button 
                  className={`translate-button ${isTranslateOpen ? 'active' : ''}`}
                  onClick={() => setIsTranslateOpen(!isTranslateOpen)}
                >
                  <Globe size={16} className="translate-button-icon" />
                  <span className="translate-button-text">{currentLang}</span>
                </button>
                
                {isTranslateOpen && (
                  <div className="translate-dropdown">
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        className={`translate-option ${currentLang === lang.shortCode ? 'active' : ''}`}
                        onClick={() => handleLanguageSelect(lang)}
                      >
                        <span className="translate-flag">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="book-now-btn"
                onClick={() => setAuthPage('login')}
              >
                Book Now
              </button>
            </div>
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

      {/* Mobile Menu */}
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
        
        <div className="mobile-translate-wrapper">
          <button 
            className={`translate-button ${isTranslateOpen ? 'active' : ''}`}
            onClick={() => setIsTranslateOpen(!isTranslateOpen)}
          >
            <Globe size={16} className="translate-button-icon" />
            <span className="translate-button-text">{currentLang}</span>
          </button>
          
          {isTranslateOpen && (
            <div className="translate-dropdown">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`translate-option ${currentLang === lang.shortCode ? 'active' : ''}`}
                  onClick={() => handleLanguageSelect(lang)}
                >
                  <span className="translate-flag">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className="book-now-btn"
          onClick={() => {
            setAuthPage('login');
            setIsMobileMenuOpen(false);
          }}
        >
          Book Now
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