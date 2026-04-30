import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ToastProvider from './components/toast/ToastManager';
import axios from 'axios';

// Main Components 
import Login from './components/login/login.jsx'; 
import Dashboard from './components/dashboard/dashboard.jsx'; 
import Booking from './components/booking/booking.jsx';
import Settings from './components/settings/settings.jsx'; 
import Archive from './components/archive/Archive.jsx';
import ActivityLogs from './components/activitylogs/ActivityLogs.jsx';
import FeedbackManagement from './components/FeedbackManagement/FeedbackManagement.jsx';

// ✅ NEW: Reporting Page
import Reporting from './components/reporting/Reporting.jsx';

// ✅ NEW: Campaigns Page
import Campaigns from './components/campaigns/Campaigns.jsx';

// Admin Management
import ViewAdmins from './components/admins/ViewAdmin.jsx';
import AddAdmin from './components/admins/AddAdmin.jsx';

// Packages
import AddPackage from './components/addpackage/addpackage.jsx';
import ViewPackages from './components/viewpackages/viewpackages.jsx';
import EditPackage from './components/viewpackages/EditPackage.jsx';

// Tours
import AddTour from './components/addtours/addtours.jsx';
import ViewTours from './components/viewtours/viewtours.jsx';
import EditTour from './components/viewtours/EditTour.jsx';
import TourBookingDashboard from './components/tourbooking/tourBooking.jsx'; // ✅ Tour Booking Dashboard
import TransferBookingDashboard from './components/transferbooking/TransferBooking.jsx'; // ✅ Transfer Booking Dashboard

// Promos & Posters
import AddPromo from './components/addpromo/addpromo.jsx';
import ViewPromos from './components/viewpromos/viewpromos.jsx';
import EditPromo from './components/viewpromos/EditPromo.jsx';
import AddPoster from './components/addposter/addposter.jsx';       
import ViewPoster from './components/viewposter/viewposter.jsx'; 
import EditPoster from './components/viewposter/EditPoster.jsx';

// Blogs
import AddBlog from './components/addblog/addblog.jsx';
import ViewBlog from './components/viewblog/viewblog.jsx';
import EditBlog from './components/viewblog/EditBlog.jsx'; 

// Gallery & Media
import AddImage from './components/addimage/addimage.jsx';
import ViewImage from './components/viewimage/viewimage.jsx';
import ViewTestimonials from './components/viewtestimonials/viewtestimonials.jsx';
import AddTestimonial from './components/addtestimonial/addtestimonial.jsx';
import EditTestimonial from './components/viewtestimonials/EditTestimonial.jsx'; 

// Deals
import AddDeal from './components/adddeals/adddeals.jsx';
import ViewDeal from './components/viewdeals/viewdeals.jsx';

// Hotels (General Management)
import AddHotel from './components/addhotel/addhotel.jsx';
import ViewHotels from './components/viewhotel/viewhotel.jsx';
import EditHotel from './components/viewhotel/EditHotel.jsx';

// --- SERVICE MANAGEMENT IMPORTS ---
import AddService from './components/addservice/addservice.jsx';
import ViewServices from './components/viewservice/viewservice.jsx';

// --- SPECIFIC SERVICES IMPORTS ---
import VisaProcessing from './components/services/VisaProcessing/VisaProcessing.jsx';
import PSASerbilis from './components/services/PSASerbilis/PSASerbilis.jsx';
import CenomarRequest from './components/services/CenomarRequest/CenomarRequest.jsx';
import PassportAppt from './components/services/PassportAppt/PassportAppt.jsx';
import AirlineBooking from './components/services/AirlineBooking/AirlineBooking.jsx';
import EditAirline from './components/services/AirlineBooking/EditAirline.jsx';
import EditCenomar from './components/services/CenomarRequest/EditCenomar.jsx';
import EditVisa from './components/services/VisaProcessing/EditVisa.jsx';
import EditPassport from './components/services/PassportAppt/EditPassport.jsx';
import EditPSA from './components/services/PSASerbilis/EditPSA.jsx';
import HotelBooking from './components/services/HotelBooking/HotelBooking.jsx';
import TourArrangements from './components/services/TourArrangements/TourArrangements.jsx';
import FerryBooking from './components/services/FerryBooking/FerryBooking.jsx';
import TravelInsurance from './components/services/TravelInsurance/TravelInsurance.jsx';
import BillsPayment from './components/services/BillsPayment/BillsPayment.jsx';
import MarriageCertificate from './components/services/MarriageCertificate/MarriageCertificate.jsx';
import Users from './components/users/users.jsx';
import SellerRate from './components/SellerRate/SellerRate.jsx';
import EditService from './components/viewservice/EditService.jsx';

// ============================================================
// LIST OF ALL VALID PROTECTED ROUTES
// ============================================================
const VALID_PROTECTED_ROUTES = [
  '/dashboard',
  '/reporting',       // ✅ NEW
  '/campaigns',       // ✅ NEW
  '/booking',
  '/archive',
  '/activity-logs',
  '/settings',
  '/users',
  '/admins',
  '/add-admin',
  '/add-package',
  '/view-packages',
  '/add-tour',
  '/view-tours',
  '/add-promo',
  '/view-promos',
  '/add-poster',
  '/view-posters',
  '/add-blog',
  '/view-blogs',
  '/add-image',
  '/view-images',
  '/add-deals',
  '/view-deals',
  '/view-testimonials',
  '/add-testimonial',
  '/add-hotel',
  '/view-hotels',
  '/add-service',
  '/view-services',
  '/services/visa',
  '/services/psa',
  '/services/cenomar',
  '/services/passport',
  '/services/airlinebooking',
  '/services/hotelbooking',
  '/tour-booking',
  '/services/tourarrangements',
  '/services/ferrybooking',
  '/services/marriagecert',
  '/services/travelinsurance',
  '/services/billspayment',
  '/seller-rate',
  '/services/transfers'
];

// ============================================================
// AXIOS INTERCEPTOR - AUTO LOGOUT ON 401
// ✅ FIX: Skip /verify endpoint so ProtectedRoute handles it.
//         If we intercept /verify here, we double-trigger:
//         both the interceptor (window.location.href) AND the
//         ProtectedRoute catch block run simultaneously, causing
//         a race condition that nukes valid tokens on network errors.
//         Also reset isRedirecting on page load so it never
//         permanently blocks future sessions.
// ============================================================
let isRedirecting = false;

// Reset the flag on every fresh page load
window.addEventListener('pageshow', () => { isRedirecting = false; });

axios.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = error.config?.url || '';

    // ✅ FIX: Let ProtectedRoute handle /verify errors exclusively.
    if (requestUrl.includes('/api/admin/verify')) {
      return Promise.reject(error);
    }

    if ((error.response?.status === 401 || error.response?.data?.requiresAuth) && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// LOADING SCREEN COMPONENT
// ============================================================
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundImage: 'url(https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691ec3335c5cab55d0046c72.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      zIndex: 1
    }}></div>
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '5px solid rgba(255, 255, 255, 0.2)',
        borderTop: '5px solid #ff9800',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>Verifying authentication...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// ============================================================
// 404 UNAUTHORIZED ACCESS PAGE
// ============================================================
const UnauthorizedAccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isValidRoute = VALID_PROTECTED_ROUTES.some(route => location.pathname.startsWith(route)) || 
                       location.pathname.match(/\/(edit-|EditAirline|EditCenomar|EditVisa|EditPassport|EditPSA)/);

  useEffect(() => {
    console.log('🚫 Unauthorized Access Detected:', location.pathname);
    console.log('🔍 Is Valid Protected Route:', isValidRoute);
  }, [location.pathname, isValidRoute]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundImage: 'url(https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691ec3335c5cab55d0046c72.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      padding: '20px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1
      }}></div>

      <div style={{
        maxWidth: '600px',
        width: '100%',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 35px',
          borderRadius: '50%',
          border: '5px solid #ff9800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '60px',
          backgroundColor: 'rgba(255, 152, 0, 0.1)'
        }}>
          {isValidRoute ? '🔒' : '!'}
        </div>
        
        {/* Title */}
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          color: '#ff9800',
          fontWeight: '700',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}>
          {isValidRoute ? 'Authentication Required' : '404 - Page Not Found'}
        </h1>
        
        {/* Description */}
        <p style={{
          fontSize: '18px',
          margin: '0 0 12px 0',
          color: '#ffffff',
          lineHeight: '1.6',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
        }}>
          {isValidRoute 
            ? 'This page requires authentication. Please log in to access this resource.'
            : 'Oops! The page you are looking for does not exist. It might have been moved or deleted.'}
        </p>

        <p style={{
          fontSize: '16px',
          margin: '0 0 35px 0',
          color: '#cbd5e1',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
        }}>
          {isValidRoute 
            ? 'You must be logged in as an admin to view this page.'
            : ''}
        </p>

        {/* Attempted URL Box */}
        {!isValidRoute && (
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '18px',
            borderRadius: '12px',
            marginBottom: '35px',
            border: '1px solid rgba(255, 152, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              fontSize: '13px',
              color: '#cbd5e1',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: '600'
            }}>Attempted URL:</p>
            <p style={{
              fontSize: '16px',
              color: '#ff9800',
              margin: '0',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              fontWeight: '600'
            }}>{location.pathname}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: '700',
            boxShadow: '0 6px 25px rgba(255, 152, 0, 0.4)',
            transition: 'all 0.3s ease',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 30px rgba(255, 152, 0, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 6px 25px rgba(255, 152, 0, 0.4)';
          }}
        >
          {isValidRoute ? 'Login to Access' : 'Go Back Home'}
        </button>

        {/* Security Notice - Only for protected routes */}
        {isValidRoute && (
          <div style={{
            marginTop: '35px',
            padding: '15px 18px',
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 152, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              margin: '0',
              color: '#ffa726',
              fontSize: '15px',
              fontWeight: '500',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}>
              🔐 <strong>Security Notice:</strong> This page requires valid admin credentials.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '50px',
          paddingTop: '25px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <img
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
            alt="WanderWave Logo"
            style={{
              height: '35px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '10px',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
            }}
          />
          <p style={{
            margin: '0',
            color: '#94a3b8',
            fontSize: '14px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            © 2025 WanderWave Travel and Tours
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PROTECTED ROUTE WITH TOKEN VERIFICATION
// ✅ FIX: Only clear token on definitive auth errors (401/403).
//         Network errors / timeouts / 5xx (e.g. Render cold start)
//         should NOT wipe a valid token. The user will see the
//         unauthorized screen temporarily, but their token is
//         preserved so the next visit works once the server wakes up.
// ============================================================
const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState('loading');
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        console.log('🔒 No token found - User not logged in');
        if (isMounted) setAuthState('unauthenticated');
        return;
      }

      try {
        const response = await axios.get('https://wanderwaveph.onrender.com/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` },
          // ✅ FIX: Give Render's cold-start server 15s to wake up before timing out.
          timeout: 15000,
        });

        if (response.data.status === 'ok') {
          console.log('✅ Token verified - User authenticated');
          if (isMounted) setAuthState('authenticated');
        } else {
          // Server responded but returned a non-ok body (shouldn't normally happen)
          console.log('❌ Verify returned non-ok status body');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          if (isMounted) setAuthState('unauthenticated');
        }
      } catch (error) {
        const status = error.response?.status;

        // ✅ FIX: Only remove the token on definitive auth rejections.
        // 401 = token invalid or expired       → clear token, block access.
        // 403 = account inactive               → clear token, block access.
        // Network error / timeout / 500 / etc  → server issue, NOT auth failure.
        //   Keep the token so the next refresh works once Render wakes up.
        if (status === 401 || status === 403) {
          console.error(`❌ Auth rejected (HTTP ${status}) - clearing token`);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
        } else {
          console.warn(`⚠️ Verify failed (${error.message}) - token preserved (server may be waking up)`);
        }

        if (isMounted) setAuthState('unauthenticated');
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (authState === 'loading') {
    return <LoadingScreen />;
  }

  if (authState === 'unauthenticated') {
    console.log('⛔ Access denied - Showing unauthorized page');
    return <UnauthorizedAccess />;
  }

  return children;
};

// ============================================================
// MAIN APP COMPONENT
// ============================================================
function App() {
  return (
    <BrowserRouter basename="/admin">
      <ToastProvider>
        <Routes>
          {/* ✅ PUBLIC ROUTE - LOGIN ONLY (basename="/admin" so path="/" = /admin/) */}
          <Route path="/" element={<Login />} />

          {/* ✅ PROTECTED ROUTES - ALL REQUIRE AUTHENTICATION */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
          <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/feedback" element={<FeedbackManagement />} />

          {/* Admin Management Routes */}
          <Route path="/admins" element={<ProtectedRoute><ViewAdmins /></ProtectedRoute>} />
          <Route path="/add-admin" element={<ProtectedRoute><AddAdmin /></ProtectedRoute>} />

          {/* Packages */}
          <Route path="/add-package" element={<ProtectedRoute><AddPackage /></ProtectedRoute>} />
          <Route path="/view-packages" element={<ProtectedRoute><ViewPackages /></ProtectedRoute>} />
          <Route path="/edit-package/:id" element={<ProtectedRoute><EditPackage /></ProtectedRoute>} />
          
          {/* Tours */}
          <Route path="/add-tour" element={<ProtectedRoute><AddTour /></ProtectedRoute>} />
          <Route path="/view-tours" element={<ProtectedRoute><ViewTours /></ProtectedRoute>} />
          <Route path="/edit-tour/:id" element={<ProtectedRoute><EditTour /></ProtectedRoute>} />

          {/* Promos & Posters */}
          <Route path="/add-promo" element={<ProtectedRoute><AddPromo /></ProtectedRoute>} />
          <Route path="/view-promos" element={<ProtectedRoute><ViewPromos /></ProtectedRoute>} />
          <Route path="/edit-promo/:id" element={<ProtectedRoute><EditPromo /></ProtectedRoute>} />
          
          <Route path="/add-poster" element={<ProtectedRoute><AddPoster /></ProtectedRoute>} />       
          <Route path="/view-posters" element={<ProtectedRoute><ViewPoster /></ProtectedRoute>} /> 
          <Route path="/edit-poster/:id" element={<ProtectedRoute><EditPoster /></ProtectedRoute>} />

          {/* Blogs */}
          <Route path="/add-blog" element={<ProtectedRoute><AddBlog /></ProtectedRoute>} />
          <Route path="/view-blogs" element={<ProtectedRoute><ViewBlog /></ProtectedRoute>} />
          <Route path="/edit-blog/:id" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} /> 

          {/* Image Gallery */}
          <Route path="/add-image" element={<ProtectedRoute><AddImage /></ProtectedRoute>} />
          <Route path="/view-images" element={<ProtectedRoute><ViewImage /></ProtectedRoute>} />

          {/* Deals */}
          <Route path="/add-deals" element={<ProtectedRoute><AddDeal /></ProtectedRoute>} />
          <Route path="/view-deals" element={<ProtectedRoute><ViewDeal /></ProtectedRoute>} />
          
          {/* Testimonials */}
          <Route path="/view-testimonials" element={<ProtectedRoute><ViewTestimonials /></ProtectedRoute>} />
          <Route path="/add-testimonial" element={<ProtectedRoute><AddTestimonial /></ProtectedRoute>} />
          <Route path="/edit-testimonial/:id" element={<ProtectedRoute><EditTestimonial /></ProtectedRoute>} />
           
          {/* Hotel Inventory Management */}
          <Route path="/add-hotel" element={<ProtectedRoute><AddHotel /></ProtectedRoute>} />
          <Route path="/view-hotels" element={<ProtectedRoute><ViewHotels /></ProtectedRoute>} />
          <Route path="/edit-hotel/:id" element={<ProtectedRoute><EditHotel /></ProtectedRoute>} />

          {/* SERVICE MANAGEMENT ROUTES */}
          <Route path="/add-service" element={<ProtectedRoute><AddService /></ProtectedRoute>} />
          <Route path="/view-services" element={<ProtectedRoute><ViewServices /></ProtectedRoute>} />
          <Route path="/edit-service/:id" element={<ProtectedRoute><EditService /></ProtectedRoute>} />
          <Route path="/services/visa" element={<ProtectedRoute><VisaProcessing /></ProtectedRoute>} />
          <Route path="/services/psa" element={<ProtectedRoute><PSASerbilis /></ProtectedRoute>} />
          <Route path="/services/cenomar" element={<ProtectedRoute><CenomarRequest /></ProtectedRoute>} />
          <Route path="/services/passport" element={<ProtectedRoute><PassportAppt /></ProtectedRoute>} />
          
          {/* Airline Booking Routes */}
          <Route path="/services/airlinebooking" element={<ProtectedRoute><AirlineBooking /></ProtectedRoute>} />
          <Route path="/EditAirline/:id" element={<ProtectedRoute><EditAirline /></ProtectedRoute>} />
          <Route path="/EditCenomar/:id" element={<ProtectedRoute><EditCenomar /></ProtectedRoute>} />
          <Route path="/EditVisa/:id" element={<ProtectedRoute><EditVisa /></ProtectedRoute>} />
          <Route path="/EditPassport/:id" element={<ProtectedRoute><EditPassport /></ProtectedRoute>} />
          <Route path="/EditPSA/:id" element={<ProtectedRoute><EditPSA /></ProtectedRoute>} />
          <Route path="/services/hotelbooking" element={<ProtectedRoute><HotelBooking /></ProtectedRoute>} />
          <Route path="/tour-booking" element={<ProtectedRoute><TourBookingDashboard /></ProtectedRoute>} />
          <Route path="/services/tourarrangements" element={<ProtectedRoute><TourBookingDashboard /></ProtectedRoute>} />
          <Route path="/services/ferrybooking" element={<ProtectedRoute><FerryBooking /></ProtectedRoute>} />
          <Route path="/services/transfers" element={<ProtectedRoute><TransferBookingDashboard /></ProtectedRoute>} />
          <Route path="/services/marriagecert" element={<ProtectedRoute><MarriageCertificate /></ProtectedRoute>} />
          <Route path="/services/travelinsurance" element={<ProtectedRoute><TravelInsurance /></ProtectedRoute>} />
          <Route path="/services/billspayment" element={<ProtectedRoute><BillsPayment /></ProtectedRoute>} />

          <Route path="/seller-rate" element={<ProtectedRoute><SellerRate /></ProtectedRoute>} />

          {/* ✅ CATCH-ALL ROUTE - SHOWS UNAUTHORIZED PAGE */}
          <Route path="*" element={<UnauthorizedAccess />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;