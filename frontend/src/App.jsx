import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Menu, X, Globe, AlertCircle, Heart } from 'lucide-react';
import axios from 'axios';
import './App.css'; 

// --- TOAST IMPORTS ---
import { ToastProvider } from './components/toast/ToastManager'; 

// --- IMPORTS ---
import FlightSearch from './components/flightSearch/flightSearch.jsx';
import PackageDeals from './components/packageDeals/packageDeals.jsx';
import PackageBooking from './components/packageDeals/packageBooking.jsx';
import Footer from './components/footer/footer.jsx';
import OtherServices from './components/otherservices/otherservices.jsx';
import UserAuth from './components/userLogin/userLogin.jsx'; 
import Payment from './components/payment/payment.jsx';
import PaymentSuccess from './components/payment/paymentSuccess.jsx';
import UserDashboard from './components/userDashboard/userDashboard.jsx';
import WishlistDropdown from './components/WishlistDropdown/WishlistDropdown.jsx';

// --- NEW FEEDBACK COMPONENT ---
import FeedbackWidget from './components/FeedbackWidget/FeedbackWidget.jsx';

// --- NEW COMPONENT: 404 Page Not Found (Styled) ---
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#0a192f', // Dark Blue Background
      color: '#fff',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <AlertCircle size={80} color="#fc9c1b" style={{ marginBottom: '1.5rem' }} />
      <h1 style={{ 
        fontSize: '3.5rem', 
        fontWeight: 'bold', 
        marginBottom: '0.5rem', 
        color: '#fc9c1b' // WanderWave Orange
      }}>
        404 - Page Not Found
      </h1>
      <p style={{ 
        color: '#e2e8f0', 
        marginBottom: '2.5rem', 
        maxWidth: '600px',
        fontSize: '1.2rem',
        lineHeight: '1.6'
      }}>
        Oops! The page you are looking for does not exist. It might have been moved or deleted.
      </p>
      <button 
        onClick={() => navigate('/')}
        style={{
          padding: '1rem 2.5rem',
          background: '#fc9c1b',
          color: 'white',
          border: 'none',
          borderRadius: '50px', // Rounded pill shape
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 14px 0 rgba(252, 156, 27, 0.39)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Go Back Home
      </button>
    </div>
  );
};

const PackageBookingWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { code } = useParams();
  const pkg = location.state?.packageData;

  useEffect(() => {
    if (!pkg) {
      console.error('No package data found for code:', code);
      const timer = setTimeout(() => {
        navigate('/packages', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pkg, navigate, code]);

  if (!pkg) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        fontSize: '1.2rem',
        color: '#666',
        gap: '1rem'
      }}>
        <p>Package data not found...</p>
        <p style={{ fontSize: '0.9rem', color: '#999' }}>Redirecting to packages page...</p>
        <button 
          onClick={() => navigate('/packages')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#fc9c1b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Go to Packages Now
        </button>
      </div>
    );
  }

  const transformedPkg = {
    ...pkg,
    id: pkg._id || pkg.id,
    _id: pkg._id || pkg.id,
    name: pkg.title || pkg.name,
    location: pkg.destination || pkg.location,
    destination: pkg.destination || pkg.location,
    image: pkg.image || 'https://default-image-url.jpg'
  };

  console.log('Rendering PackageBooking with code:', code);
  console.log('Package data:', transformedPkg);

  return <PackageBooking pkg={transformedPkg} />;
};

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
  
  // ============================================================
  // ⭐ WISHLIST STATES
  // ============================================================
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isWishlistDropdownOpen, setIsWishlistDropdownOpen] = useState(false);

  const logoNav = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69083320f6799f841b19821b.png"; 
  const logoBlueHeader = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png"; 

  const pages = {
    home: { name: 'Home', path: 'https://wanderwaveph.com', external: true },
    flights: { name: 'Flight Search', path: '/flights' },
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

  // ============================================================
  // ⭐ FETCH WISHLIST COUNT
  // ============================================================
  useEffect(() => {
    const fetchWishlistCount = async () => {
      if (!currentUser) {
        setWishlistCount(0);
        return;
      }

      try {
        const userId = currentUser._id;
        console.log('📊 Fetching wishlist count for user:', userId);

        const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/favorites/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wishlist count');
        }

        const result = await response.json();
        console.log('✅ Wishlist data:', result);
        
        if (result.status === 'ok' && result.data) {
          const count = result.data.length;
          console.log(`❤️ Wishlist count: ${count}`);
          setWishlistCount(count);
        }
      } catch (err) {
        console.error('❌ Error fetching wishlist count:', err);
        setWishlistCount(0);
      }
    };

    fetchWishlistCount();

    const handleWishlistUpdate = () => {
      console.log('🔄 Wishlist updated, refreshing count...');
      fetchWishlistCount();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [currentUser]);

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

  const getCurrentShortCode = () => {
    const lang = languages.find(l => l.code === currentLang);
    return lang ? lang.shortCode : 'EN';
  };

  const handleLanguageSelect = (language) => {
    setCurrentLang(language.code);
    setIsTranslateOpen(false);

    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = language.code;
      selectElement.dispatchEvent(new Event('change'));
    }
  };

  const handleNavigation = (pageKey) => {
    const page = pages[pageKey];
    if (page && page.path) {
      if (page.external) {
        window.location.href = page.path;
      } else {
        navigate(page.path);
        setIsMobileMenuOpen(false);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setWishlistCount(0);
    localStorage.removeItem('wanderwave_user');
    navigate('/login');
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('wanderwave_user', JSON.stringify(userData));
    setAuthPage(null);
    window.location.href = '/dashboard';
  };

  // ============================================================
  // ⭐ HANDLE WISHLIST BUTTON CLICK
  // ============================================================
  const handleWishlistClick = (e) => {
    e.stopPropagation();
    console.log('❤️ Wishlist button clicked!');
    setIsWishlistDropdownOpen(!isWishlistDropdownOpen);
    setIsTranslateOpen(false); // Close translate dropdown if open
  };

  const handleWishlistUpdate = () => {
    console.log('🔄 Wishlist updated from dropdown');
    // Refresh count will be handled by the global event listener
  };

  const handleAuthPageChange = (page) => {
    if (page === 'main') {
      setAuthPage(null);
    } else {
      setAuthPage(page);
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isTranslateOpen && !e.target.closest('.translate-wrapper')) {
        setIsTranslateOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isTranslateOpen]);

  const currentPage = Object.keys(pages).find(
    key => location.pathname === pages[key].path
  ) || 'packages';

  const isLoginPage = location.pathname === '/login';
  
  if (isLoadingUser) {
    return null;
  }

  if (authPage === 'login' || authPage === 'signup' || isLoginPage) {
    return <UserAuth setAuthPage={handleAuthPageChange} onLoginSuccess={handleLoginSuccess} />;
  }

  const isPaymentSuccessPage = location.pathname === '/payment-success';
  const isDashboardPage = location.pathname === '/dashboard';

  const handleBookNowClick = () => {
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div id="google_translate_element"></div>
      
      {/* ============================================================ */}
      {/* ⭐ WISHLIST DROPDOWN */}
      {/* ============================================================ */}
      <WishlistDropdown
        isOpen={isWishlistDropdownOpen}
        onClose={() => setIsWishlistDropdownOpen(false)}
        currentUser={currentUser}
        wishlistCount={wishlistCount}
        onWishlistUpdate={handleWishlistUpdate}
      />
      
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
                  {/* ============================================================ */}
                  {/* ⭐ WISHLIST BUTTON - DESKTOP */}
                  {/* ============================================================ */}
                  {currentUser && (
                    <button 
                      className="wishlist-button"
                      onClick={handleWishlistClick}
                      aria-label="View Wishlist"
                      title="My Wishlist"
                    >
                      <Heart size={20} strokeWidth={2} />
                      {wishlistCount > 0 && (
                        <span className="wishlist-badge">{wishlistCount}</span>
                      )}
                    </button>
                  )}

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
                      onClick={handleBookNowClick}
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
            
            {/* ============================================================ */}
            {/* ⭐ MOBILE WISHLIST BUTTON */}
            {/* ============================================================ */}
            {currentUser && (
              <div className="mobile-wishlist-wrapper">
                <button 
                  className="mobile-wishlist-button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setTimeout(() => {
                      setIsWishlistDropdownOpen(true);
                    }, 300);
                  }}
                >
                  <Heart size={20} strokeWidth={2.5} />
                  <span>My Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="wishlist-count">({wishlistCount})</span>
                  )}
                </button>
              </div>
            )}

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
                  navigate('/login');
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
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/packages" element={<PackageDeals />} />
          <Route path="/packages/:code" element={<PackageBookingWrapper />} />
          <Route path="/other-services" element={<OtherServices setAuthPage={setAuthPage} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route 
            path="/dashboard" 
            element={
              currentUser ? (
                <UserDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Please log in to access dashboard</h2>
                  <button onClick={() => navigate('/login')}>Login</button>
                </div>
              )
            } 
          />
          {/* ✅ CATCH-ALL ROUTE PARA SA 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* ⭐ FLOATING FEEDBACK BUTTON - ADDED HERE */}
      <FeedbackWidget />

      {!isPaymentSuccessPage && !isDashboardPage && <Footer />}
    </div>
  );
}

// ⭐ PINAKAMAHALAGANG UPDATE: Dito binalot ang buong App sa ToastProvider
function App() {
  return (
    <BrowserRouter>
      <ToastProvider> 
        <MainLayout />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;