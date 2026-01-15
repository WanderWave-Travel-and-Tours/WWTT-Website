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
  '/services/tourarrangements',
  '/services/ferrybooking',
  '/services/marriagecert',
  '/services/travelinsurance',
  '/services/billspayment',
  '/seller-rate'
];

// ============================================================
// AXIOS INTERCEPTOR - AUTO LOGOUT ON 401
// ============================================================
let isRedirecting = false;

axios.interceptors.response.use(
  response => response,
  error => {
    if ((error.response?.status === 401 || error.response?.data?.requiresAuth) && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin';
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
    backgroundColor: '#f0f2f5'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{ color: '#666', fontSize: '16px' }}>Verifying authentication...</p>
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
    console.log('📍 Is Valid Protected Route:', isValidRoute);
  }, [location.pathname, isValidRoute]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        padding: '60px 40px',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          fontSize: '150px',
          margin: '0',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          {isValidRoute ? '🔒' : '404'}
        </div>
        
        <h2 style={{
          fontSize: '36px',
          margin: '30px 0 20px 0',
          color: '#f1f5f9',
          fontWeight: '600'
        }}>
          {isValidRoute ? 'Authentication Required' : 'Page Not Found'}
        </h2>
        
        <div style={{
          backgroundColor: '#334155',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: '2px solid #475569'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '500'
          }}>Attempted URL:</p>
          <p style={{
            fontSize: '18px',
            color: '#ef4444',
            margin: '0',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            fontWeight: 'bold'
          }}>{location.pathname}</p>
        </div>

        <p style={{
          fontSize: '18px',
          maxWidth: '600px',
          margin: '0 auto 40px auto',
          color: '#cbd5e1',
          lineHeight: '1.8'
        }}>
          {isValidRoute ? (
            <>
              This page requires authentication. Please log in to access this resource.
              <br/>
              <span style={{ color: '#94a3b8', fontSize: '16px' }}>
                You must be logged in as an admin to view this page.
              </span>
            </>
          ) : (
            <>
              This page doesn't exist in our system.
              <br/>
              <span style={{ color: '#94a3b8', fontSize: '16px' }}>
                Please check the URL or navigate using the buttons below.
              </span>
            </>
          )}
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          flexWrap: 'wrap', 
          justifyContent: 'center' 
        }}>
          <button
            onClick={() => navigate('/admin', { replace: true })}
            style={{
              padding: '16px 36px',
              fontSize: '18px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
            }}
          >
            {isValidRoute ? 'Login to Access' : 'Go to Login Page'}
          </button>
          
          {!isValidRoute && (
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '16px 36px',
                fontSize: '18px',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#475569';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#64748b';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Go Back
            </button>
          )}
        </div>

        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          border: '1px solid #334155'
        }}>
          <p style={{
            margin: '0',
            color: '#64748b',
            fontSize: '14px'
          }}>
            🔒 <strong>Security Notice:</strong> {isValidRoute ? 'This page requires valid admin credentials.' : 'Unauthorized access attempts are logged.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PROTECTED ROUTE WITH TOKEN VERIFICATION
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
        const response = await axios.get('http://localhost:5000/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.status === 'ok') {
          console.log('✅ Token verified - User authenticated');
          if (isMounted) setAuthState('authenticated');
        } else {
          console.log('❌ Invalid token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          if (isMounted) setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
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
    <BrowserRouter basename="/">
      <ToastProvider>
        <Routes>
          {/* ✅ PUBLIC ROUTE - LOGIN ONLY */}
          <Route path="/admin" element={<Login />} />

          {/* ✅ ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* ✅ PROTECTED ROUTES - ALL REQUIRE AUTHENTICATION */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
          <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />

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
          <Route path="/services/tourarrangements" element={<ProtectedRoute><TourArrangements /></ProtectedRoute>} />
          <Route path="/services/ferrybooking" element={<ProtectedRoute><FerryBooking /></ProtectedRoute>} />
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