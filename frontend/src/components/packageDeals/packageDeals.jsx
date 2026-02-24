// src/components/PackageDeals/packageDeals.jsx - COMPLETE CODE WITH DISCOUNT EXPIRATION SUPPORT
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrowseCategory from './browseCategory';
import AllPackages from './allPackages';
import PackageBooking from './packageBooking';
import './packageDeals.css';
import PromoSection from './promoSection';
import CurrencyModal from './CurrencyModal';
import toast, { Toaster } from 'react-hot-toast';

// ============================================================
// LOGIN NOTICE MODAL COMPONENT
// ============================================================
const LoginNoticeModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white', 
        padding: '40px 30px', 
        borderRadius: '12px', 
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '20px',
          filter: 'drop-shadow(0 4px 8px rgba(255, 140, 0, 0.3))'
        }}>❤️</div>
        <h3 style={{ 
          marginBottom: '15px', 
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>Login Required</h3>
        <p style={{ 
          marginBottom: '30px', 
          color: '#6b7280',
          fontSize: '15px',
          lineHeight: '1.6'
        }}>
          Please log in to add packages to your wishlist and keep track of your favorite destinations.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={onLogin} 
            style={{
              padding: '12px 28px', 
              backgroundColor: '#FF8C00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e67e00';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(255, 140, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FF8C00';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.3)';
            }}
          >
            Go to Login
          </button>
          <button 
            onClick={onClose} 
            style={{
              padding: '12px 28px', 
              backgroundColor: '#f3f4f6', 
              color: '#374151', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PACKAGE DEALS COMPONENT
// ============================================================
function PackageDeals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); 
  const packagesRef = useRef(null);
  const [currentView, setCurrentView] = useState('list'); 
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [currency, setCurrency] = useState('PHP');        
  const exchangeRate = 58;

  // 2705 Holds raw URL destination param until packages are loaded
  const [pendingDestinationFilter, setPendingDestinationFilter] = useState(null);
  
  const handleLoginRequired = () => {
    console.log('🚨 Login Required triggered!');
    setShowLoginNotice(true);
  };

  const handleGoToLogin = () => {
    console.log('🚪 Redirecting to login...');
    setShowLoginNotice(false);
    navigate('/login');
  };
  
  // ============================================================
  // CHECK LOGIN STATUS
  // ============================================================
  useEffect(() => {
    const checkLoginStatus = () => {
      const userJSON = localStorage.getItem('wanderwave_user');
      const isUserLoggedIn = !!userJSON;
      
      console.log('👤 Checking login status:', isUserLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN');
      
      if (userJSON) {
        try {
          const user = JSON.parse(userJSON);
          console.log('✅ User data:', { id: user._id, name: user.fullName, email: user.email });
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (err) {
          console.error('❌ Error parsing user data:', err);
          localStorage.removeItem('wanderwave_user');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        console.log('❌ No user data in localStorage');
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };
    
    checkLoginStatus(); 

    const handleStorageChange = () => {
      console.log('📦 Storage changed - rechecking login status');
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ============================================================
  // FETCH USER FAVORITES WHEN LOGGED IN
  // ============================================================
  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!isLoggedIn || !currentUser) {
        console.log('❌ User not logged in, clearing favorites');
        setFavorites([]);
        return;
      }

      try {
        const userId = currentUser._id;
        console.log('📥 Fetching favorites for user:', userId);

        const response = await fetch(`https://wanderwaveph.onrender.com/api/favorites/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Favorites API response status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }

        const result = await response.json();
        console.log('✅ Favorites fetched:', result);
        
        if (result.status === 'ok' && result.data) {
          const favoriteIds = result.data.map(fav => fav.promo_id);
          console.log('❤️ Favorite IDs:', favoriteIds);
          setFavorites(favoriteIds);
        }
      } catch (err) {
        console.error('❌ Error fetching favorites:', err);
        setFavorites([]);
      }
    };

    fetchUserFavorites();
  }, [isLoggedIn, currentUser]);

  // ============================================================
  // CURRENCY MODAL AUTO-SHOW
  // ============================================================
  useEffect(() => {
    if (hasShownModal) return;

    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowModal(true);
        setHasShownModal(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasShownModal]); 

  // ============================================================
  // LISTEN FOR FAVORITE REMOVAL FROM DROPDOWN
  // ============================================================
  useEffect(() => {
    const handleFavoriteRemoved = (event) => {
      const { packageId } = event.detail;
      console.log('🔄 Package removed from wishlist in AllPackages:', packageId);
      
      // Update local favorites state
      setFavorites(prev => {
        const newFavorites = prev.filter(id => id !== packageId);
        console.log('📊 Updated favorites:', newFavorites);
        return newFavorites;
      });
    };

    window.addEventListener('favoriteRemoved', handleFavoriteRemoved);

    return () => {
      window.removeEventListener('favoriteRemoved', handleFavoriteRemoved);
    };
  }, []);

  // ============================================================
  // HANDLE URL PARAMETERS AND CUSTOM EVENTS
  // ============================================================
  useEffect(() => {
    // Check URL parameters for filter
    const urlParams = new URLSearchParams(location.search);
    const filterParam = urlParams.get('filter');
    const destinationParam = urlParams.get('destination');

    // ✅ DESTINATION FILTER — from GHL "Book Now" button
    if (destinationParam) {
      const decodedDestination = decodeURIComponent(destinationParam);
      console.log('🗺️ URL parameter detected: filtering by destination:', decodedDestination);
      // ✅ Store raw value — will resolve to exact DB case once packages load
      setPendingDestinationFilter(decodedDestination);

      // Scroll to packages section
      setTimeout(() => {
        if (packagesRef.current) {
          const yOffset = -120;
          const element = packagesRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 600);
    }
    
    if (filterParam === 'favorites') {
      console.log('🎯 URL parameter detected: showing favorites');
      setScopeFilter('favorites');
      
      // Scroll to packages section after a short delay
      setTimeout(() => {
        if (packagesRef.current) {
          const yOffset = -120;
          const element = packagesRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 500);
    }

    // Listen for custom event to show favorites
    const handleShowFavorites = () => {
      console.log('🎯 Custom event detected: showing favorites');
      setScopeFilter('favorites');
      
      // Scroll to packages section
      setTimeout(() => {
        if (packagesRef.current) {
          const yOffset = -120;
          const element = packagesRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300);
    };

    window.addEventListener('showFavorites', handleShowFavorites);

    return () => {
      window.removeEventListener('showFavorites', handleShowFavorites);
    };
  }, [location.search]);

  const allLocations = useMemo(() => [...new Set(packages.map(p => p.location))].sort(), [packages]);
  const allDurations = useMemo(() => [...new Set(packages.map(p => p.duration))].sort(), [packages]);

  // ============================================================
  // ✅ RESOLVE PENDING DESTINATION FILTER ONCE PACKAGES ARE LOADED
  //    Matches case-insensitively against actual DB location values
  //    e.g. URL: ?destination=Siargao → matches DB value: "SIARGAO"
  // ============================================================
  useEffect(() => {
    if (!pendingDestinationFilter || allLocations.length === 0) return;

    const matched = allLocations.find(
      (loc) => loc.toLowerCase() === pendingDestinationFilter.toLowerCase()
    );

    if (matched) {
      console.log('✅ Destination resolved:', matched);
      setSelectedDestinations([matched]);
    } else {
      // Partial match fallback (e.g. "El Nido" → "EL NIDO, PALAWAN")
      const partial = allLocations.find(
        (loc) => loc.toLowerCase().includes(pendingDestinationFilter.toLowerCase())
      );
      if (partial) {
        console.log('✅ Destination partial match:', partial);
        setSelectedDestinations([partial]);
      }
    }

    setPendingDestinationFilter(null); // clear after resolving

    // ✅ CRITICAL: Remove ?destination param from URL so user can freely
    //    change filters without SIARGAO (or any destination) getting re-locked.
    //    replace: true so it doesn't add a new history entry (back button safe)
    navigate('/packages', { replace: true });

    // Scroll to packages section
    setTimeout(() => {
      if (packagesRef.current) {
        const yOffset = -120;
        const element = packagesRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 400);
  }, [pendingDestinationFilter, allLocations]);

  const handleBookNow = (pkg) => {
    setSelectedPackageForBooking(pkg);
    setCurrentView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    setCurrentView('list');
    setSelectedPackageForBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const mostVisitedCategories = [
    { 
      id: 'siargao', 
      name: 'Siargao', 
      subtitle: 'Surigao del Norte',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114ddbc3a1eac0761c08f1.jpg'
    },
    { 
      id: 'cebu', 
      name: 'Cebu', 
      subtitle: 'Philippines',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114f9b75ec1e9528439ebe.jpg'
    },
    { 
      id: 'coron', 
      name: 'Coron', 
      subtitle: 'Palawan, Philippines',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69115096d1ba951da7e80a51.jpg'
    },
    { 
      id: 'elnido', 
      name: 'El Nido', 
      subtitle: 'Palawan, Philippines',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691150bfd1ba95d73be80e2f.jpg'
    },
    { 
      id: 'puertoprincesa', 
      name: 'Puerto Princesa', 
      subtitle: 'Palawan, Philippines',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911846fd1ba953d5fef7768.jpg'
    },
    { 
      id: 'siquijor', 
      name: 'Siquijor', 
      subtitle: 'Philippines',
      scope: 'local',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911839bdaa4e34e3efada04.jpg'
    },
    { 
      id: 'hongkong', 
      name: 'Hong Kong Disneyland', 
      subtitle: 'Hong Kong',
      scope: 'international',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911aacfc3a1eaf00b1f3a06.jpg'
    },
    { 
      id: 'singapore', 
      name: 'Singapore', 
      subtitle: 'Singapore',
      scope: 'international',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911aec1d1ba95f893f41f5c.jpg'
    },
    { 
      id: 'tokyo', 
      name: 'Tokyo Disneyland', 
      subtitle: 'Japan',
      scope: 'international',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6917166d01e5bcc9cd11a103.jpg' 
    },
    { 
      id: 'all', 
      name: 'All Packages', 
      subtitle: 'All Destinations',
      scope: 'all', 
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg'
    },
  ];

  // ============================================================
  // ✅ DISCOUNT EXPIRATION HELPER
  // ============================================================
  const checkDiscountExpiration = (discountEndDate) => {
    if (!discountEndDate) return false;
    
    try {
      const endDate = new Date(discountEndDate);
      const now = new Date();
      return now > endDate; // Returns true if expired
    } catch (error) {
      console.error('Error checking discount expiration:', error);
      return false;
    }
  };

  // ============================================================
  // FETCH PACKAGES WITH DISCOUNT EXPIRATION SUPPORT
  // ============================================================
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        console.log('📦 Fetching packages...');
        const response = await fetch('https://wanderwaveph.onrender.com/api/packages/all'); 
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'ok') {
          const data = result.data;
          
          // ✅ HELPER: Deterministic pseudo-random generator based on package ID
          const seededRandom = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
          };
          
          const formattedPackages = data.map((pkg, index) => {
            // ✅ FIXED: Generate consistent seed from package ID
            const seed = pkg._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            // ⭐ DETERMINISTIC RATING (4.0 - 5.0, same for each package always)
            const ratingRandom = seededRandom(seed);
            let calculatedRating = (ratingRandom * 0.9 + 4.0).toFixed(1);
            
            // 5% Chance to get a perfect 5.0
            if (seededRandom(seed + 1) > 0.95) {
              calculatedRating = "5.0";
            }

            // ⭐ DETERMINISTIC REVIEWS (Between 40 and 500, consistent per package)
            const reviewsRandom = seededRandom(seed + 2);
            const randomReviews = Math.floor(reviewsRandom * 460) + 40;

            // ✅ CHECK DISCOUNT EXPIRATION
            const hasDiscount = pkg.discountPercentage && pkg.discountEndDate;
            const isDiscountExpired = hasDiscount ? checkDiscountExpiration(pkg.discountEndDate) : false;
            
            // ✅ CALCULATE PRICES BASED ON DISCOUNT STATUS
            let displayPrice = pkg.price;
            let originalPrice = pkg.price;
            let discountValue = 0;
            
            if (hasDiscount && !isDiscountExpired) {
              // Discount is active
              discountValue = pkg.discountPercentage;
              originalPrice = pkg.price / (1 - discountValue / 100);
              displayPrice = pkg.price; // Already discounted price from DB
            } else if (hasDiscount && isDiscountExpired) {
              // Discount expired - revert to original price
              originalPrice = pkg.price / (1 - (pkg.discountPercentage || 0) / 100);
              displayPrice = originalPrice;
              discountValue = 0;
            } else {
              // No discount - use fake 30% discount for display
              originalPrice = pkg.price + Math.floor(pkg.price * 0.3);
              displayPrice = pkg.price;
              discountValue = 30;
            }

            return {
              id: pkg._id,
              name: pkg.title,
              category: pkg.category.toLowerCase(),
              scope: pkg.category.toLowerCase() === 'local' ? 'local' : 'international',
              location: pkg.destination,
              duration: pkg.duration,
              nights: pkg.duration && pkg.duration.includes('Days') ? `${parseInt(pkg.duration.split(' ')[0]) - 1} Nights` : '0 Nights', 
              
              // ✅ UPDATED PRICE LOGIC
              price: displayPrice,
              originalPrice: originalPrice,
              discount: discountValue,
              hasRealDiscount: hasDiscount,
              isDiscountExpired: isDiscountExpired,
              discountEndDate: pkg.discountEndDate,
              
              rating: calculatedRating,
              reviews: randomReviews,
              image: pkg.image, 
              inclusions: pkg.inclusions || [], 
              itinerary: pkg.itinerary || [], 
              excludes: [], 
              maxGuests: pkg.pax || pkg.minPax || 4,
              pax: pkg.pax,
              minPax: pkg.minPax,
              tourType: pkg.tourType || 'private',
              featured: index === 0, 
              description: pkg.title,
              includes: pkg.inclusions || [],
            };
          });
          console.log(`✅ Fetched ${formattedPackages.length} packages`);
          setPackages(formattedPackages);
        } else {
          setError(result.error || 'Failed to fetch packages.');
        }

      } catch (e) {
        console.error("❌ Fetch Error:", e);
        setError('Error connecting to the API.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#FF8C00'
      }}>
        Loading packages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#ef4444'
      }}>
        Error: {error}
      </div>
    );
  }
  
  if (currentView === 'booking' && selectedPackageForBooking) {
    return <PackageBooking pkg={selectedPackageForBooking} onGoBack={handleGoBack} currency={currency} exchangeRate={exchangeRate} />;
  }

  const selectedCategory = mostVisitedCategories.find(c => c.id === selectedFilter);

  let filteredPackages = packages;
  
  if (selectedFilter !== 'all' && selectedCategory) {
    const categorySearchName = selectedCategory.name.toLowerCase();
    filteredPackages = filteredPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(categorySearchName) ||
      pkg.location.toLowerCase().includes(categorySearchName)
    );
  }

  if (scopeFilter === 'favorites') {
    filteredPackages = filteredPackages.filter(pkg => favorites.includes(pkg.id));
  } 
  else if (scopeFilter === 'best-deals') {
    filteredPackages = filteredPackages.filter(pkg => pkg.discount && pkg.discount > 0);
    filteredPackages.sort((a, b) => b.discount - a.discount);
  } 
  else if (scopeFilter !== 'all') {
    filteredPackages = filteredPackages.filter(pkg => pkg.scope === scopeFilter);
  }

  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredPackages = filteredPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchLower) ||
      pkg.location.toLowerCase().includes(searchLower)
    );
  }

  if (priceRange.min !== '') {
    filteredPackages = filteredPackages.filter(pkg => pkg.price >= Number(priceRange.min));
  }
  if (priceRange.max !== '') {
    filteredPackages = filteredPackages.filter(pkg => pkg.price <= Number(priceRange.max));
  }

  if (selectedDuration) {
    filteredPackages = filteredPackages.filter(pkg => pkg.duration === selectedDuration);
  }

  if (selectedDestinations.length > 0) {
    filteredPackages = filteredPackages.filter(pkg => selectedDestinations.includes(pkg.location));
  }

  // ============================================================
  // TOGGLE FAVORITE FUNCTION
  // ============================================================
  const toggleFavorite = async (packageId, packageName, packageLocation) => {
    console.log('❤️ Toggle favorite clicked');
    console.log('Package ID:', packageId);
    console.log('Package Name:', packageName);
    console.log('🔐 Is logged in:', isLoggedIn);
    
    if (!isLoggedIn || !currentUser) {
      console.log('⚠️ User not logged in - showing login modal');
      handleLoginRequired();
      return;
    }
    
    try {
      const userId = currentUser._id;
      const isCurrentlyFavorite = favorites.includes(packageId);
      
      console.log('📤 Sending API request...');
      console.log('User ID:', userId);
      console.log('Currently favorite:', isCurrentlyFavorite);

      // Optimistic UI update
      const previousState = [...favorites];
      setFavorites(prev => 
        isCurrentlyFavorite
          ? prev.filter(fav => fav !== packageId)
          : [...prev, packageId]
      );
      
      const response = await fetch(`https://wanderwaveph.onrender.com/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          promo_id: packageId,
          user_id: userId,
          package_title: packageName,
          package_location: packageLocation
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        // Revert optimistic update on error
        setFavorites(previousState);
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        toast.error('Failed to update wishlist. Please try again.', {
          style: { 
            border: '1px solid #ef4444', 
            color: '#ef4444',
            fontSize: '14px'
          },
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          position: 'top-center',
          duration: 3000,
        });
        return;
      }
      
      const result = await response.json();
      console.log('✅ API Success:', result);
      
      // Update with server response
      if (result.data && result.data.favorites) {
        setFavorites(result.data.favorites);
      }
      
      const successMessage = result.action === 'removed'
        ? '❤️ Removed from wishlist' 
        : '❤️ Added to wishlist!';

      toast.success(successMessage, {
        style: { 
          border: '1px solid #10b981', 
          color: '#10b981',
          fontSize: '14px'
        },
        iconTheme: { primary: '#10b981', secondary: '#fff' },
        position: 'top-center',
        duration: 2000,
      });

      // ============================================================
      // NOTIFY NAVBAR TO UPDATE WISHLIST COUNT
      // ============================================================
      window.dispatchEvent(new Event('wishlistUpdated'));
      console.log('🔔 Wishlist update event dispatched!');
      
      // If removed, also dispatch favoriteRemoved event
      if (result.action === 'removed') {
        window.dispatchEvent(new CustomEvent('favoriteRemoved', { 
          detail: { packageId } 
        }));
        console.log('🔔 Favorite removed event dispatched!');
      }

    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
      toast.error('Network error. Please check your connection.', {
        style: { 
          border: '1px solid #ef4444', 
          color: '#ef4444',
          fontSize: '14px'
        },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
        position: 'top-center',
        duration: 3000,
      });
    }
  };

  const scrollToPackages = () => {
    if (packagesRef.current) {
      packagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentCategoryName = mostVisitedCategories.find(c => c.id === selectedFilter)?.name;
  
  let headerTitle = 'All Packages';
  if (scopeFilter === 'favorites') headerTitle = 'My Favorites';
  else if (scopeFilter === 'best-deals') headerTitle = 'Best Deals';
  else if (selectedFilter !== 'all') headerTitle = currentCategoryName;

  return (
    <div className="package-deals-page">
      <Toaster position="top-center" />
      
      <CurrencyModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        currency={currency}
        setCurrency={setCurrency}
      />
      
      <LoginNoticeModal 
        isOpen={showLoginNotice} 
        onClose={() => setShowLoginNotice(false)}
        onLogin={handleGoToLogin}
      />

      <section className="top-section-bg">
        <div className="content-container">
          <PromoSection onBookNow={scrollToPackages} />
          <BrowseCategory 
            title="Most Visited Destination"
            categories={mostVisitedCategories}
          />
        </div>
      </section>

      <div className="section-divider-orange"></div>
      <section className="bottom-section-bg">
        <div className="content-container">
          <AllPackages 
            packages={filteredPackages}
            categoryName={headerTitle} 
            favorites={favorites}
            onToggleFavorite={toggleFavorite} 
            onBookNow={handleBookNow}
            packagesRef={packagesRef}
            scopeFilter={scopeFilter}
            onScopeChange={setScopeFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery} 
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            allDurations={allDurations}
            selectedDestinations={selectedDestinations}
            setSelectedDestinations={setSelectedDestinations}
            allLocations={allLocations}
            isLoggedIn={isLoggedIn}
            onLoginRequired={handleLoginRequired}
            currency={currency}           
            exchangeRate={exchangeRate}     
            setCurrency={setCurrency}  
          />
        </div>
      </section>
    </div>
  );
}

export default PackageDeals;