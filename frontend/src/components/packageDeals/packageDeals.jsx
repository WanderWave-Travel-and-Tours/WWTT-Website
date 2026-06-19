// src/components/PackageDeals/packageDeals.jsx - COMPLETE CODE WITH DISCOUNT EXPIRATION SUPPORT
import { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BrowseCategory from './browseCategory';
import AllPackages from './allPackages';
import './packageDeals.css';

// Lazy-load booking flow — 200+ KiB of form components only needed after "Book Now"
const PackageBooking = lazy(() => import('./packageBooking'));
import CurrencyModal from './CurrencyModal';
import { ToastProvider, useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import MascotGif from '../MascotGif/MascotGif';
import { usePageTracker } from '../../hooks/usePageTracker';
import WanderLoader from '../loading/WanderLoader';
import { preFetchPackages } from '../../utils/packagesCache.js';

// ============================================================
// INNER COMPONENT — uses useToast hook (must be inside ToastProvider)
// ============================================================
function PackageDealsContent() {
  const toast = useToast();

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



  // ── Page View Tracker ────────────────────────────────────────────
  // Fires once on mount — permanent dedup per visitor IP.
  usePageTracker({ page: 'packages', path: '/packages', label: 'Package Deals Page' });


  // 2705 Holds raw URL destination param until packages are loaded
  const [pendingDestinationFilter, setPendingDestinationFilter] = useState(null);
  const [shouldScrollToPackages, setShouldScrollToPackages] = useState(false);

  // ✅ Holds ?book=<id> from funnel until packages are loaded
  const [pendingBookId, setPendingBookId] = useState(null);
  // ✅ Holds ?initialPax= captured before URL is cleared, so Step 2 can still read it
  const [pendingInitialPax, setPendingInitialPax] = useState(null);

  const handleLoginRequired = () => {
    setShowLoginNotice(true);
  };

  const handleGoToLogin = () => {
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
      
      if (userJSON) {
        try {
          const user = JSON.parse(userJSON);
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (err) {
          localStorage.removeItem('wanderwave_user');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };
    
    checkLoginStatus(); 

    const handleStorageChange = () => {
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
        setFavorites([]);
        return;
      }

      try {
        const token = localStorage.getItem('wanderwave_token');
        if (!token) { setFavorites([]); return; }

        const response = await fetch('https://wanderwaveph.onrender.com/api/favorites', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }

        const result = await response.json();

        if (result.status === 'ok' && result.data) {
          const favoriteIds = result.data.map(fav => fav.promo_id);
          setFavorites(favoriteIds);
        }
      } catch (err) {
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
      
      // Update local favorites state
      setFavorites(prev => {
        const newFavorites = prev.filter(id => id !== packageId);
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

  // ============================================================
  // HANDLE ?book= QUERY PARAM (from funnel "Book Now" link)
  // ============================================================
  // Step 1 — Capture bookId from URL immediately on mount/param change,
  // store it in pendingBookId, then clear the URL so the param doesn't
  // linger after navigation. This survives the packages-not-yet-loaded
  // race condition because pendingBookId persists in state.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('book');

    if (bookId) {
      // ✅ FIX: Capture initialPax HERE before navigate() clears the URL
      const initialPax = parseInt(params.get('initialPax')) || null;
      setPendingBookId(bookId);
      setPendingInitialPax(initialPax);
      // Clear the param from the URL immediately
      navigate('/packages', { replace: true });
    }
  }, [location.search]);

  // Step 2 — Once packages are loaded AND pendingBookId is set, find and open booking.
  // Runs whenever packages load or pendingBookId changes.
  useEffect(() => {
    if (!pendingBookId || packages.length === 0) return;

    const foundPkg = packages.find(
      (p) => String(p.id) === pendingBookId || String(p._id) === pendingBookId
    );

     if (foundPkg) {
      
      // ✅ FIX: Use pendingInitialPax (captured before URL was cleared) instead of window.location.search
      setSelectedPackageForBooking({
        ...foundPkg,
        initialPaxFromFunnel: pendingInitialPax
      });
      
      setCurrentView('booking');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPendingBookId(null);
      setPendingInitialPax(null);
    } else {
      // Package not in current list — fetch it directly by ID from the API
      const fetchAndOpenPackage = async () => {
        try {
          const res = await fetch(`https://wanderwaveph.onrender.com/api/packages/${pendingBookId}`);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const json = await res.json();
          if (json.status === 'ok' && json.data) {
            const pkg = json.data;
            // Shape it the same way formattedPackages does
            const seed = pkg._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
            const calculatedRating = (seededRandom(seed) * 0.9 + 4.0).toFixed(1);
            const randomReviews = Math.floor(seededRandom(seed + 2) * 460) + 40;
            const shapedPkg = {
              // ✅ Keep both _id and id so BookingFormModal can always resolve packageId
              _id: pkg._id,
              id: pkg._id,
              name: pkg.title,
              title: pkg.title,
              category: pkg.category?.toLowerCase() || 'local',
              scope: pkg.category?.toLowerCase() === 'local' ? 'local' : 'international',
              location: pkg.destination,
              destination: pkg.destination,
              duration: pkg.duration,
              nights: pkg.duration?.includes('Days') ? `${parseInt(pkg.duration.split(' ')[0]) - 1} Nights` : '0 Nights',
              price: pkg.price,
              originalPrice: pkg.price + Math.floor(pkg.price * 0.3),
              discount: 30,
              hasRealDiscount: false,
              isDiscountExpired: false,
              discountEndDate: null,
              // ✅ Raw pricing fields needed by BookingFormModal
              sellerPrice: pkg.sellerPrice || 0,
              markup: pkg.markup || 0,
              markupType: pkg.markupType || 'fixed',
              soloPaxPrice: pkg.soloPaxPrice ?? null,
              multiplePaxPrice: pkg.multiplePaxPrice ?? null,
              rating: calculatedRating,
              reviews: randomReviews,
              image: pkg.image,
              inclusions: pkg.inclusions || [],
              includes: pkg.inclusions || [],
              itinerary: pkg.itinerary || [],
              excludes: [],
              maxGuests: pkg.pax || pkg.minPax || 4,
              pax: pkg.pax,
              minPax: pkg.minPax,
              tourType: pkg.tourType || 'private',
              featured: false,
              description: pkg.title,
              hasTours: false,
              tourCount: 0,
              matchedTours: [],
              initialPaxFromFunnel: pendingInitialPax,
            };
            setSelectedPackageForBooking(shapedPkg);
            setCurrentView('booking');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            // package not found
          }
        } catch {
          // silently ignore
        } finally {
          setPendingBookId(null);    // consumed — clear regardless
          setPendingInitialPax(null); // ✅ FIX: clear alongside pendingBookId
        }
      };
      fetchAndOpenPackage();
    }
  }, [pendingBookId, pendingInitialPax, packages]);

  const allLocations = useMemo(() => [...new Set(packages.map(p => p.location))].sort(), [packages]);
  const allDurations = useMemo(() => [...new Set(packages.map(p => p.duration))].sort(), [packages]);

  useEffect(() => {
    if (!pendingDestinationFilter || allLocations.length === 0) return;

    // ✅ Support both string (old URL param) and object (new card click)
    const filterName = typeof pendingDestinationFilter === 'object' 
      ? pendingDestinationFilter.name 
      : pendingDestinationFilter;
    const isFromCard = typeof pendingDestinationFilter === 'object' 
      && pendingDestinationFilter.source === 'card';

    const matched = allLocations.find(
      (loc) => loc.toLowerCase() === filterName.toLowerCase()
    );

    if (matched) {
      setSelectedDestinations([matched]);
    } else {
      const partial = allLocations.find(
        (loc) => loc.toLowerCase().includes(filterName.toLowerCase())
      );
      if (partial) setSelectedDestinations([partial]);
    }

    setPendingDestinationFilter(null);

    // ✅ Only navigate (clear URL) if it came from URL param, NOT from card click
    if (!isFromCard) {
      navigate('/packages', { replace: true });
    }

    // ✅ Scroll only for URL param source — card click handled by selectedDestinations useEffect
    if (!isFromCard) {
      setTimeout(() => {
        if (packagesRef.current) {
          const y = packagesRef.current.getBoundingClientRect().top + window.pageYOffset - 120;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 400);
    }
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
      image: 'https://assets.cdn.filesafe.space/yTzQYPFRZAWXGWiXtIt2/media/69118686c3a1eafb4f245065.jpg',
      smallTitle: true
    },
    { 
      id: 'singapore', 
      name: 'Singapore', 
      subtitle: 'Singapore',
      scope: 'international',
      image: 'https://assets.cdn.filesafe.space/yTzQYPFRZAWXGWiXtIt2/media/69118551d4d7797a4f8ddd64.jpg'
    },
    { 
      id: 'tokyo', 
      name: 'All Packages', 
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
    } catch {
      return false;
    }
  };

  // ============================================================
  // FETCH PACKAGES WITH DISCOUNT EXPIRATION SUPPORT
  // ============================================================
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        // Reuse the pre-fetch started in main.jsx — avoids a duplicate network request
        const result = await preFetchPackages();

        if (!result) {
          throw new Error('Failed to load packages');
        }
        
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
              // ✅ Keep both _id and id so BookingFormModal can always resolve packageId
              _id: pkg._id,
              id: pkg._id,
              name: pkg.title,
              title: pkg.title,
              category: pkg.category.toLowerCase(),
              scope: pkg.category.toLowerCase() === 'local' ? 'local' : 'international',
              location: pkg.destination,
              destination: pkg.destination,
              duration: pkg.duration,
              nights: pkg.duration && pkg.duration.includes('Days') ? `${parseInt(pkg.duration.split(' ')[0]) - 1} Nights` : '0 Nights',

              // ✅ UPDATED PRICE LOGIC
              price: displayPrice,
              originalPrice: originalPrice,
              discount: discountValue,
              hasRealDiscount: hasDiscount,
              isDiscountExpired: isDiscountExpired,
              discountEndDate: pkg.discountEndDate,

              // ✅ Raw pricing fields needed by BookingFormModal for booking snapshot
              sellerPrice: pkg.sellerPrice || 0,
              markup: pkg.markup || 0,
              markupType: pkg.markupType || 'fixed',
              soloPaxPrice: pkg.soloPaxPrice ?? null,
              multiplePaxPrice: pkg.multiplePaxPrice ?? null,

              rating: calculatedRating,
              reviews: randomReviews,
              image: pkg.image,
              // ✅ inclusions and itinerary — snapshotted into booking at submission time
              inclusions: pkg.inclusions || [],
              includes: pkg.inclusions || [],
              itinerary: pkg.itinerary || [],
              excludes: [],
              maxGuests: pkg.pax || pkg.minPax || 4,
              pax: pkg.pax,
              minPax: pkg.minPax,
              tourType: pkg.tourType || 'private',
              featured: index === 0,
              description: pkg.title,
              // ✅ Tour availability — populated by /with-tours endpoint
              hasTours: pkg.hasTours || false,
              tourCount: pkg.tourCount || 0,
              matchedTours: pkg.matchedTours || [],
            };
          });
          setPackages(formattedPackages);        } else {
          setError(result.error || 'Failed to fetch packages.');
        }

      } catch (e) {
        setError('Error connecting to the API.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    if (!shouldScrollToPackages) return;
    
    const timer = setTimeout(() => {
      if (packagesRef.current) {
        packagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setShouldScrollToPackages(false); // reset
    }, 400);

    return () => clearTimeout(timer);
  }, [shouldScrollToPackages]);

  // Don't block render during loading — AllPackages shows skeleton cards instead

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
    return (
      <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="ww-route-spinner" /></div>}>
        <PackageBooking pkg={selectedPackageForBooking} onGoBack={handleGoBack} currency={currency} exchangeRate={exchangeRate} currentUser={currentUser} />
      </Suspense>
    );
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
  else if (scopeFilter === 'with-tours') {
    filteredPackages = filteredPackages.filter(pkg => pkg.hasTours === true);
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
    if (!isLoggedIn || !currentUser) {
      handleLoginRequired();
      return;
    }
    
    try {
      const token = localStorage.getItem('wanderwave_token');
      const isCurrentlyFavorite = favorites.includes(packageId);

      // Optimistic UI update
      const previousState = [...favorites];
      setFavorites(prev =>
        isCurrentlyFavorite
          ? prev.filter(fav => fav !== packageId)
          : [...prev, packageId]
      );

      const response = await fetch('https://wanderwaveph.onrender.com/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          promo_id: packageId,
          package_title: packageName,
          package_location: packageLocation,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setFavorites(previousState);
        const errorText = await response.text();
        toast.error('Failed to update wishlist. Please try again.', 'Error', 3000);
        return;
      }
      
      const result = await response.json();

      // Update with server response
      if (result.data && result.data.favorites) {
        setFavorites(result.data.favorites);
      }

      const successMessage = result.action === 'removed'
        ? 'Removed from wishlist' 
        : 'Added to wishlist!';

      toast.success(successMessage, 'Wishlist', 2000);

      // ============================================================
      // NOTIFY NAVBAR TO UPDATE WISHLIST COUNT
      // ============================================================
      window.dispatchEvent(new Event('wishlistUpdated'));
      
      // If removed, also dispatch favoriteRemoved event
      if (result.action === 'removed') {
        window.dispatchEvent(new CustomEvent('favoriteRemoved', { 
          detail: { packageId } 
        }));
      }

    } catch (err) {
      toast.error('Network error. Please check your connection.', 'Connection Error', 3000);
    }
  };

  // ============================================================
  // OPEN GHL CHAT WIDGET — triggered by mascot GIF click
  // window.openGHLChat is defined in index.html's inline script,
  // which polls the shadow DOM for the launcher button, hides it,
  // and on call: re-enables pointer-events → clicks → re-hides.
  // ============================================================
  const openGHLChat = () => {
    if (typeof window.openGHLChat === 'function') {
      window.openGHLChat();
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
  else if (scopeFilter === 'with-tours') headerTitle = 'Packages with Tours';
  else if (selectedFilter !== 'all') headerTitle = currentCategoryName;

  return (
    <>
    <div className="package-deals-page">

      {/* ============================================================
          CUSTOM CONFIRM MODAL — replaces LoginNoticeModal
          onConfirm → navigate to /login
          onCancel  → close the modal
      ============================================================ */}
      <CustomConfirmModal
        isOpen={showLoginNotice}
        title="Login Required"
        message="Please log in to add packages to your wishlist and keep track of your favorite destinations."
        onConfirm={handleGoToLogin}
        onCancel={() => setShowLoginNotice(false)}
        type="primary"
      />
      
      <CurrencyModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        currency={currency}
        setCurrency={setCurrency}
      />

      <section className="top-section-bg">
        <div className="content-container">
          <AllPackages
            packages={filteredPackages}
            isLoading={loading}
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
            onPromoBookNow={scrollToPackages}
          />
        </div>
      </section>

      <MascotGif onClick={openGHLChat} />

      <div className="section-divider-orange">
        {/* Airplane — absolutely positioned above the navy bar, no extra height */}
        <div className="divider-airplane-container">
          <img
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/696e04c1439b6b5ce06f5f51.webp"
            alt="Animated Airplane"
            className="divider-airplane"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Dark navy scrolling destinations bar */}
        <div className="divider-locations-bar">
          <div className="divider-locations-wrapper">
            <div className="divider-locations-group">
              <span className="divider-label">TOP DESTINATIONS IN THE PHILIPPINES:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="divider-locations-group" aria-hidden="true">
              <span className="divider-label">INTERNATIONAL:</span>
              <span>Thailand</span> • <span>Vietnam</span> • <span>Singapore</span> •{' '}
              <span>Kuala Lumpur</span> • <span>Hong Kong</span> • <span>Macau</span> •{' '}
              <span>Bali, Indonesia</span> • <span>China</span>
            </div>
            <div className="divider-locations-group" aria-hidden="true">
              <span className="divider-label">TOP DESTINATIONS IN THE PHILIPPINES:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="divider-locations-group" aria-hidden="true">
              <span className="divider-label">INTERNATIONAL:</span>
              <span>Thailand</span> • <span>Vietnam</span> • <span>Singapore</span> •{' '}
              <span>Kuala Lumpur</span> • <span>Hong Kong</span> • <span>Macau</span> •{' '}
              <span>Bali, Indonesia</span> • <span>China</span>
            </div>
          </div>
        </div>
      </div>
      <section className="bottom-section-bg">
        <div className="content-container">
          <BrowseCategory 
            title="Most Visited Destination"
            categories={mostVisitedCategories}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            onCategoryClick={(category) => {
              if (!category) {
                setSelectedDestinations([]);
                setScopeFilter('all');
              } else {
                setPendingDestinationFilter({ name: category.name, source: 'card' });
                setScopeFilter('all');
              }
              setShouldScrollToPackages(true);
            }}
          />
        </div>
      </section>
    </div>

    </>
  );
}

// ============================================================
// OUTER WRAPPER — provides Toast context to the entire page
// ============================================================
function PackageDeals() {
  return (
    <ToastProvider>
      <PackageDealsContent />
    </ToastProvider>
  );
}

export default PackageDeals;