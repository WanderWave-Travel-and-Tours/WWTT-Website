import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react'; 
import './App.css'; 
import FlightSearch from './components/flightSearch/flightSearch.jsx';
import PackageDeals from './components/packageDeals/packageDeals.jsx';
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

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authPage, setAuthPage] = useState(null);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

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
    { code: 'zh-CN', name: 'Chinese (Simp)', flag: '🇨🇳', shortCode: 'CN' },
    { code: 'zh-TW', name: 'Chinese (Trad)', flag: '🇹🇼', shortCode: 'TW' },
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
    { code: 'id', name: 'Indonesian', flag: '🇮🇩', shortCode: 'ID' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾', shortCode: 'MS' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱', shortCode: 'NL' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱', shortCode: 'PL' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', shortCode: 'TR' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩', shortCode: 'BN' },
  ];

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('wanderwave_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('wanderwave_user');
      }
    }
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    if (window.google?.translate) {
      setIsTranslateReady(true);
      return;
    }

    window.googleTranslateElementInit = function() {
      try {
        new window.google.translate.TranslateElement(
          { 
            pageLanguage: 'en',
            includedLanguages: 'en,tl,zh-CN,zh-TW,ja,ko,es,fr,de,it,pt,ru,ar,hi,th,vi,id,ms,nl,pl,tr,bn',
            autoDisplay: false
          },
          'google_translate_element'
        );
        setIsTranslateReady(true);
      } catch (error) {
        console.error('Translation initialization error:', error);
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('Failed to load Google Translate');
    };

    document.body.appendChild(script);

    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      body {
        top: 0 !important;
        position: static !important;
      }
      #google_translate_element {
        display: none !important;
      }
      .goog-te-gadget-icon {
        display: none !important;
      }
      .goog-te-gadget-simple {
        background-color: transparent !important;
        border: none !important;
      }
      .goog-logo-link {
        display: none !important;
      }
      .goog-te-gadget {
        color: transparent !important;
        font-size: 0 !important;
      }
      .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const page = Object.entries(pages).find(([_, page]) => page.path === currentPath);
    return page ? page[0] : 'packages';
  };

  const handleLoginSuccess = (user) => {
    localStorage.setItem('wanderwave_user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthPage(null);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('wanderwave_user');
    setCurrentUser(null);
    navigate('/packages');
  };

  const handleAuthPageChange = (page) => {
    if (page === 'main') {
      setAuthPage(null);
    } else {
      setAuthPage(page);
    }
  };

  const handleLanguageSelect = (lang) => {
    setCurrentLang(lang.code);
    setIsTranslateOpen(false);
    const triggerTranslation = () => {
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement) {
        selectElement.value = lang.code;
        const events = ['change', 'click', 'input'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          selectElement.dispatchEvent(event);
        });

        if (selectElement.onchange) {
          selectElement.onchange();
        }
      } else if (isTranslateReady) {
        setTimeout(triggerTranslation, 100);
      }
    };

    if (isTranslateReady) {
      triggerTranslation();
    } else {
      const checkInterval = setInterval(() => {
        if (isTranslateReady) {
          clearInterval(checkInterval);
          triggerTranslation();
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  };

  // Show loading while checking for saved user
  if (isLoadingUser) {
    return null; // or a loading spinner
  }

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
  const isDashboardPage = location.pathname === '/dashboard';

  const getCurrentShortCode = () => {
    const lang = languages.find(l => l.code === currentLang);
    return lang ? lang.shortCode : 'EN';
  };

  return (
    <div className="app-container">
      <div id="google_translate_element"></div>
      {!isDashboardPage && (
        <>
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
                      disabled={!isTranslateReady}
                    >
                      <Globe size={16} className="translate-button-icon" />
                      <span className="translate-button-text">{getCurrentShortCode()}</span>
                    </button>
                    
                    {isTranslateOpen && (
                      <div className="translate-dropdown">
                        {languages.map((lang) => (
                          <div
                            key={lang.code}
                            className={`translate-option ${currentLang === lang.code ? 'active' : ''}`}
                            onClick={() => handleLanguageSelect(lang)}
                          >
                            <span className="translate-flag">{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {currentUser ? (
                    <button 
                      className="user-profile-btn" 
                      onClick={() => navigate('/dashboard')}
                    >
                      {currentUser.fullName}
                    </button>
                  ) : (
                    <button 
                      className="book-now-btn"
                      onClick={() => setAuthPage('login')}
                    >
                      Book Now
                    </button>
                  )}
                </div>
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
            
            <div className="mobile-translate-wrapper">
              <button 
                className={`translate-button ${isTranslateOpen ? 'active' : ''}`}
                onClick={() => setIsTranslateOpen(!isTranslateOpen)}
                disabled={!isTranslateReady}
              >
                <Globe size={16} className="translate-button-icon" />
                <span className="translate-button-text">{getCurrentShortCode()}</span>
              </button>
              
              {isTranslateOpen && (
                <div className="translate-dropdown">
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      className={`translate-option ${currentLang === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageSelect(lang)}
                    >
                      <span className="translate-flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
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
                Book Now
              </button>
            )}
          </div>
        </>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/flight" element={<FlightSearch />} />
          <Route path="/packages" element={<PackageDeals />} />
          <Route path="/other-services" element={<OtherServices setAuthPage={setAuthPage} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
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