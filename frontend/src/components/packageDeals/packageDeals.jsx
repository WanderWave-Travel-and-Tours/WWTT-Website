import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import BrowseCategory from './BrowseCategory';
import QuickFilters from './quickFilters';
import AllPackages from './allPackages';
import './packageDeals.css';
import PromoSection from './promoSection';

function PackageDeals() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); 
  const packagesRef = useRef(null);
  const [promoFilter, setPromoFilter] = useState('weekly');

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

  const packages = [
    {
      id: 1,
      name: 'Boracay Beach Paradise',
      category: 'beach',
      scope: 'local',
      location: 'Boracay, Aklan',
      duration: '3 Days 2 Nights',
      price: 8999,
      originalPrice: 12999,
      discount: 30,
      rating: 4.8,
      reviews: 324,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eb2c3a1eaa1cc1c2ab8.jpg',
      includes: ['Hotel', 'Meals', 'Tours'],
      maxGuests: 4,
      featured: true
    },
    {
      id: 2,
      name: 'Baguio Highland Escape',
      category: 'mountain',
      scope: 'local',
      location: 'Baguio City',
      duration: '2 Days 1 Night',
      price: 4999,
      originalPrice: 6999,
      discount: 28,
      rating: 4.6,
      reviews: 198,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69118329c3a1ea6b0423e937.jpg',
      includes: ['Hotel', 'Breakfast', 'City Tour'],
      maxGuests: 6,
      featured: false
    },
    {
      id: 3,
      name: 'Manila Heritage Tour',
      category: 'city',
      scope: 'local',
      location: 'Manila & Intramuros',
      duration: '1 Day',
      price: 2499,
      originalPrice: 3499,
      discount: 28,
      rating: 4.5,
      reviews: 156,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg',
      includes: ['Lunch', 'Guide', 'Transport'],
      maxGuests: 8,
      featured: false
    },
    {
      id: 4,
      name: 'El Nido Island Hopping', 
      category: 'adventure',
      scope: 'local',
      location: 'El Nido, Palawan',
      duration: '4 Days 3 Nights',
      price: 15999,
      originalPrice: 21999,
      discount: 27,
      rating: 4.9,
      reviews: 412,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691150bfd1ba95d73be80e2f.jpg',
      includes: ['Hotel', 'All Meals', 'Island Tours', 'Snorkeling'],
      maxGuests: 4,
      featured: true
    },
    {
      id: 5,
      name: 'Cebu Adventure Pack',
      category: 'adventure',
      scope: 'local',
      location: 'Cebu & Oslob',
      duration: '3 Days 2 Nights',
      price: 11999,
      originalPrice: 15999,
      discount: 25,
      rating: 4.7,
      reviews: 267,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114f9b75ec1e9528439ebe.jpg',
      includes: ['Hotel', 'Meals', 'Whale Shark Tour', 'Canyoneering'],
      maxGuests: 6,
      featured: true
    },
    {
      id: 6,
      name: 'Tagaytay Luxury Staycation',
      category: 'luxury',
      scope: 'local',
      location: 'Tagaytay City',
      duration: '2 Days 1 Night',
      price: 9999,
      originalPrice: 13999,
      discount: 28,
      rating: 4.8,
      reviews: 189,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg',
      includes: ['5-Star Hotel', 'Spa', 'Fine Dining', 'Wine Tasting'],
      maxGuests: 2,
      featured: false
    },
    {
      id: 7,
      name: 'Tokyo Cherry Blossom Tour',
      category: 'international',
      scope: 'international',
      location: 'Tokyo, Japan',
      duration: '5 Days 4 Nights',
      price: 45999,
      originalPrice: 55999,
      discount: 18,
      rating: 4.9,
      reviews: 512,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6916db176c431e3bb8b83e16.jpg', 
      includes: ['Hotel', 'Breakfast', 'Tour Guide', 'Airport Transfer'],
      maxGuests: 4,
      featured: true
    },
    {
      id: 8,
      name: 'Seoul City Pop Tour',
      category: 'international',
      scope: 'international', 
      location: 'Seoul, South Korea',
      duration: '4 Days 3 Nights',
      price: 39999,
      originalPrice: 49999,
      discount: 20,
      rating: 4.8,
      reviews: 310,
      image: 'https://images.unsplash.com/photo-1538681105581-856b0a96bf8d?q=80&w=1974&auto=format&fit=crop',
      includes: ['Hotel', 'K-Pop Tour', 'City Guide'],
      maxGuests: 4,
      featured: false
    },
  ];


  // --- FILTER LOGIC ---
  
  const selectedCategory = mostVisitedCategories.find(c => c.id === selectedFilter);

  let filteredPackages;
  if (selectedFilter === 'all' || !selectedCategory) {
    filteredPackages = packages; 
  } else {
    const categorySearchName = selectedCategory.name.toLowerCase();
    filteredPackages = packages.filter(pkg => 
      pkg.name.toLowerCase().includes(categorySearchName) ||
      pkg.location.toLowerCase().includes(categorySearchName)
    );
  }

  if (scopeFilter !== 'all') {
    filteredPackages = filteredPackages.filter(pkg => pkg.scope === scopeFilter);
  }

  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredPackages = filteredPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(searchLower) ||
      pkg.location.toLowerCase().includes(searchLower)
    );
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

  const handleQuickFilter = (filterId) => {
    scrollToPackages();
  };

  const currentCategoryName = mostVisitedCategories.find(c => c.id === selectedFilter)?.name;
  const promoPackage = packages.find(pkg => pkg.featured);

  return (
    <div className="package-deals-page">
      <div className="content-container">
        
        {/* --- PROMO SECTION --- */}
        {promoPackage && (
          <PromoSection
            promoFilter={promoFilter}
            onPromoFilterChange={setPromoFilter}
            promoPackage={promoPackage}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onBookNow={scrollToPackages}
          />
        )}

        {/* --- BROWSE CATEGORIES --- */}
        <BrowseCategory 
          title="Most Visited Destination"
          categories={mostVisitedCategories}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onCategoryClick={scrollToPackages}
        />

        {/* --- QUICK FILTERS --- */}
        <QuickFilters onFilterClick={handleQuickFilter} />

        {/* --- ALL PACKAGES --- */}
        <AllPackages 
          packages={filteredPackages}
          selectedFilter={selectedFilter}
          categoryName={currentCategoryName}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          packagesRef={packagesRef}
          scopeFilter={scopeFilter}
          onScopeChange={setScopeFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery} 
        />
      </div>
    </div>
  );
}

export default PackageDeals;