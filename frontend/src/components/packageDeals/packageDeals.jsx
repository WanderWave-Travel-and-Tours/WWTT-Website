import { useState, useRef, useMemo, useEffect } from 'react';
import BrowseCategory from './browseCategory';
import AllPackages from './allPackages';
import PackageBooking from './packageBooking';
import './packageDeals.css';
import PromoSection from './promoSection';
import CurrencyModal from './CurrencyModal';
import toast, { Toaster } from 'react-hot-toast';

const LoginNoticeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000 
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        maxWidth: '400px', 
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Login Required</h3>
        <p style={{ marginBottom: '25px' }}>
          Please log in to add items to your wishlist.
        </p>
        <button 
          onClick={onClose} 
          style={{
            padding: '10px 20px', 
            backgroundColor: '#FF6F61', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};


function PackageDeals() {
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
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [currency, setCurrency] = useState('PHP');        
  const exchangeRate = 58; 
  
  const handleLoginRequired = () => {
    setShowLoginNotice(true);
  };
  
  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem('wanderwave_user');
      setIsLoggedIn(!!user); 
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

  const allLocations = useMemo(() => [...new Set(packages.map(p => p.location))].sort(), [packages]);
  const allDurations = useMemo(() => [...new Set(packages.map(p => p.duration))].sort(), [packages]);

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
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69118686c3a1eafb4f245065.jpg' 
    },
    { 
      id: 'bangkok', 
      name: 'Bangkok', 
      subtitle: 'Thailand',
      scope: 'international',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69171615ac7fad32f8341f78.jpg' 
    },
    { 
      id: 'hanoi', 
      name: 'Hanoi', 
      subtitle: 'Vietnam',
      scope: 'international',
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911855175ec1e9b374b5977.jpg' 
    },
    { 
      id: 'japan', 
      name: 'Japan', 
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

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/packages/all'); 
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'ok') {
          const data = result.data;
          const formattedPackages = data.map((pkg, index) => ({
            id: pkg._id,
            name: pkg.title,
            category: pkg.category.toLowerCase(),
            scope: pkg.category.toLowerCase() === 'local' ? 'local' : 'international',
            location: pkg.destination,
            duration: pkg.duration,
            nights: pkg.duration && pkg.duration.includes('Days') ? `${parseInt(pkg.duration.split(' ')[0]) - 1} Nights` : '0 Nights', 
            price: pkg.price,
            originalPrice: pkg.price + Math.floor(pkg.price * 0.3),
            discount: 30,
            rating: 4.5,
            reviews: 100, 
            image: pkg.image ? `https://wanderwaveph-backend.onrender.com0/uploads/${pkg.image}` : 'https://default-image-url.jpg', 
            inclusions: pkg.inclusions || [], 
            itinerary: pkg.itinerary || [], 
            excludes: [], 
            maxGuests: 4, 
            featured: index === 0, 
            description: pkg.title,
            includes: pkg.inclusions || [],
          }));
          setPackages(formattedPackages);
        } else {
          setError(result.error || 'Failed to fetch packages.');
        }

      } catch (e) {
        console.error("Fetch Error: ", e);
        setError('Error connecting to the API.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading packages...</div>;
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
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

  const toggleFavorite = async (packageId) => {
    if (!isLoggedIn) {
      handleLoginRequired();
      return;
    }

    const userJSON = localStorage.getItem('wanderwave_user');
    if (!userJSON) {
      handleLoginRequired();
      return;
    }
    
    try {
      const user = JSON.parse(userJSON);
      const userId = user._id;
      const isCurrentlyFavorite = favorites.includes(packageId);
      const method = 'POST'; 
      const url = `https://wanderwaveph-backend.onrender.com0/api/favorites`;

      const previousState = favorites;
      setFavorites(prev => 
        isCurrentlyFavorite
          ? prev.filter(fav => fav !== packageId)
          : [...prev, packageId]
      );
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          promo_id: packageId,
        }),
      });

      if (!response.ok) {
        setFavorites(previousState);
        toast.error('Failed to update wishlist. Please try again.', {
          style: { border: '1px solid #ef4444', color: '#ef4444' },
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          position: 'top-center',
        });
        
        throw new Error('Failed to update favorites on server.');
      }
      
      const successMessage = isCurrentlyFavorite 
          ? 'Package removed from wishlist.' 
          : 'Package added to wishlist!';

      toast.success(successMessage, {
          style: { border: '1px solid #10b981', color: '#10b981' },
          iconTheme: { primary: '#10b981', secondary: '#fff' },
          position: 'top-center',
      });


    } catch (err) {
      console.error('Error toggling favorite:', err);
      if (!err.message.includes('Failed to update favorites on server.')) {
        toast.error('Network error. Could not connect to the server.', {
          style: { border: '1px solid #ef4444', color: '#ef4444' },
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
          position: 'top-center',
        });
      }
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
      />

      <section className="top-section-bg">
        <div className="content-container">
          <PromoSection onBookNow={scrollToPackages} />
          <BrowseCategory 
            title="Most Visited Destination"
            categories={mostVisitedCategories}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            onCategoryClick={scrollToPackages}
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