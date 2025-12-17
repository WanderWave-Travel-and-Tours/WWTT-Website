import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrowseCategory from './browseCategory';
import AllPackages from './allPackages';
import './packageDeals.css';
import PromoSection from './promoSection';
import CurrencyModal from './CurrencyModal';

function PackageDeals() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); 
  const packagesRef = useRef(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (hasShownModal) return;
      if (window.scrollY > 150) {
        console.log("User scrolled down! Opening Modal...");
        setShowModal(true);
        setHasShownModal(true);
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
    console.log('Book Now clicked for package:', pkg);
    console.log('Package ID:', pkg.id);
    
    // Store package data in sessionStorage for security
    sessionStorage.setItem('currentPackage', JSON.stringify(pkg));
    
    // Navigate to a generic booking route without any identifiers
    navigate('/packages/book', {
      state: { packageData: pkg }
    });
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
        const response = await fetch('https://wanderwaveph-backend.onrender.com/api/packages/all'); 
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'ok') {
          const data = result.data;
          const formattedPackages = data.map((pkg, index) => ({
            id: pkg._id,
            _id: pkg._id, // Keep both for compatibility
            name: pkg.title,
            category: pkg.category.toLowerCase(),
            scope: pkg.category.toLowerCase() === 'local' ? 'local' : 'international',
            location: pkg.destination,
            destination: pkg.destination, // Keep both
            duration: pkg.duration,
            nights: pkg.duration && pkg.duration.includes('Days') ? `${parseInt(pkg.duration.split(' ')[0]) - 1} Nights` : '0 Nights', 
            price: pkg.price,
            originalPrice: pkg.price + Math.floor(pkg.price * 0.3),
            discount: 30,
            rating: 4.5,
            reviews: 100, 
            image: pkg.image ? `https://wanderwaveph-backend.onrender.com/uploads/${pkg.image}` : 'https://default-image-url.jpg', 
            inclusions: pkg.inclusions || [], 
            itinerary: pkg.itinerary || [], 
            excludes: [], 
            maxGuests: 4, 
            featured: index === 0, 
            description: pkg.title,
            includes: pkg.inclusions || [],
          }));
          
          console.log('Loaded packages:', formattedPackages);
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

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
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
      <CurrencyModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
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
          />
        </div>
      </section>

    </div>
  );
}

export default PackageDeals;