import { useState, useRef, useMemo } from 'react';
import BrowseCategory from './BrowseCategory';
import AllPackages from './allPackages';
import PackageBooking from './packageBooking';
import './packageDeals.css';
import PromoSection from './promoSection';

function PackageDeals() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all'); 
  const packagesRef = useRef(null);
  const [promoFilter, setPromoFilter] = useState('weekly');

  // ✅ ADD THESE NEW STATES FOR BOOKING PAGE
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'booking'
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState(null);

  // --- FILTER STATES ---
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);

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
      nights: '2 Nights',
      price: 8999,
      originalPrice: 12999,
      discount: 30,
      rating: 4.8,
      reviews: 324,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eb2c3a1eaa1cc1c2ab8.jpg',
      includes: ['Hotel', 'Meals', 'Tours'],
      excludes: [
        'Any kind of personal expenses or optional tours/extra meals ordered by the guests',
        'Anything that is not specifically mentioned in the INCLUSIONS is on pax account'
      ],
      maxGuests: 4,
      featured: true,
      description: 'Boracay Optional Tour',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Arrival & Island Tour',
          activities: [
            '8:00 AM - Pick up from hotel',
            '9:00 AM - White Beach exploration',
            '12:00 PM - Lunch at beachfront restaurant',
            '2:00 PM - Island hopping tour',
            '6:00 PM - Sunset viewing at Station 1',
            '7:00 PM - Dinner'
          ]
        },
        {
          day: 2,
          title: 'Day 2: Water Activities',
          activities: [
            '7:00 AM - Breakfast',
            '9:00 AM - Snorkeling at Crystal Cove',
            '12:00 PM - Lunch',
            '2:00 PM - Free time at the beach',
            '6:00 PM - Dinner and free time'
          ]
        },
        {
          day: 3,
          title: 'Day 3: Departure',
          activities: [
            '7:00 AM - Breakfast',
            '9:00 AM - Check out',
            '10:00 AM - Last minute shopping',
            '12:00 PM - Transfer to airport/port'
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Baguio Highland Escape',
      category: 'mountain',
      scope: 'local',
      location: 'Baguio City',
      duration: '2 Days 1 Night',
      nights: '1 Night',
      price: 4999,
      originalPrice: 6999,
      discount: 28,
      rating: 4.6,
      reviews: 198,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69118329c3a1ea6b0423e937.jpg',
      includes: ['Hotel', 'Breakfast', 'City Tour'],
      excludes: ['Personal expenses', 'Optional activities'],
      maxGuests: 6,
      featured: false,
      description: 'Experience the cool breeze of Baguio',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Arrival & City Tour',
          activities: [
            '6:00 AM - Departure from Manila',
            '10:00 AM - Arrival at Baguio',
            '11:00 AM - Check-in at Hotel',
            '1:00 PM - Lunch',
            '2:00 PM - Visit Burnham Park',
            '4:00 PM - Session Road Shopping',
            '6:00 PM - Dinner'
          ]
        },
        {
          day: 2,
          title: 'Day 2: Departure',
          activities: [
            '7:00 AM - Breakfast',
            '8:00 AM - Check out',
            '9:00 AM - Mines View Park',
            '11:00 AM - Strawberry Farm',
            '1:00 PM - Departure to Manila'
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Manila Heritage Tour',
      category: 'city',
      scope: 'local',
      location: 'Manila & Intramuros',
      duration: '1 Day',
      nights: '0 Nights',
      price: 2499,
      originalPrice: 3499,
      discount: 28,
      rating: 4.5,
      reviews: 156,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg',
      includes: ['Lunch', 'Guide', 'Transport'],
      excludes: ['Personal expenses', 'Entrance fees to some sites'],
      maxGuests: 8,
      featured: false,
      description: 'Discover Manila\'s rich history',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Heritage Tour',
          activities: [
            '8:00 AM - Pick up from hotel',
            '9:00 AM - Fort Santiago visit',
            '10:30 AM - San Agustin Church',
            '12:00 PM - Lunch at traditional restaurant',
            '2:00 PM - National Museum',
            '4:00 PM - Rizal Park',
            '5:00 PM - Drop off at hotel'
          ]
        }
      ]
    },
    {
      id: 4,
      name: 'El Nido Island Hopping', 
      category: 'adventure',
      scope: 'local',
      location: 'El Nido, Palawan',
      duration: '4 Days 3 Nights',
      nights: '3 Nights',
      price: 15999,
      originalPrice: 21999,
      discount: 27,
      rating: 4.9,
      reviews: 412,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691150bfd1ba95d73be80e2f.jpg',
      includes: ['Hotel', 'All Meals', 'Island Tours', 'Snorkeling'],
      excludes: ['Airfare', 'Personal expenses'],
      maxGuests: 4,
      featured: true,
      description: 'Explore the beauty of El Nido',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Arrival',
          activities: [
            '10:00 AM - Airport pickup',
            '11:00 AM - Check-in at resort',
            '12:00 PM - Welcome lunch',
            '2:00 PM - Beach relaxation',
            '6:00 PM - Sunset viewing',
            '7:00 PM - Dinner'
          ]
        },
        {
          day: 2,
          title: 'Day 2: Tour A',
          activities: [
            '8:00 AM - Breakfast',
            '9:00 AM - Start island hopping',
            '10:00 AM - Big Lagoon',
            '12:00 PM - Beach lunch',
            '2:00 PM - Small Lagoon',
            '5:00 PM - Return to resort',
            '7:00 PM - Dinner'
          ]
        }
      ]
    },
    {
      id: 5,
      name: 'Cebu Adventure Pack',
      category: 'adventure',
      scope: 'local',
      location: 'Cebu & Oslob',
      duration: '3 Days 2 Nights',
      nights: '2 Nights',
      price: 11999,
      originalPrice: 15999,
      discount: 25,
      rating: 4.7,
      reviews: 267,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114f9b75ec1e9528439ebe.jpg',
      includes: ['Hotel', 'Meals', 'Whale Shark Tour', 'Canyoneering'],
      excludes: ['Airfare', 'Travel insurance'],
      maxGuests: 6,
      featured: true,
      description: 'Adventure awaits in Cebu',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: City Tour',
          activities: [
            '9:00 AM - Pick up',
            '10:00 AM - Magellan\'s Cross',
            '11:00 AM - Basilica del Santo Niño',
            '1:00 PM - Lunch',
            '3:00 PM - Tops Lookout',
            '6:00 PM - Dinner'
          ]
        }
      ]
    },
    {
      id: 6,
      name: 'Tagaytay Luxury Staycation',
      category: 'luxury',
      scope: 'local',
      location: 'Tagaytay City',
      duration: '2 Days 1 Night',
      nights: '1 Night',
      price: 9999,
      originalPrice: 13999,
      discount: 28,
      rating: 4.8,
      reviews: 189,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911b2d6d1ba95589cf4b863.jpg',
      includes: ['5-Star Hotel', 'Spa', 'Fine Dining', 'Wine Tasting'],
      excludes: ['Transportation', 'Personal expenses'],
      maxGuests: 2,
      featured: false,
      description: 'Luxury experience in Tagaytay',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Relaxation',
          activities: [
            '2:00 PM - Check-in',
            '3:00 PM - Spa treatment',
            '6:00 PM - Fine dining dinner',
            '8:00 PM - Wine tasting'
          ]
        }
      ]
    },
    {
      id: 7,
      name: 'Tokyo Cherry Blossom Tour',
      category: 'international',
      scope: 'international',
      location: 'Tokyo, Japan',
      duration: '5 Days 4 Nights',
      nights: '4 Nights',
      price: 45999,
      originalPrice: 55999,
      discount: 18,
      rating: 4.9,
      reviews: 512,
      image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6916db176c431e3bb8b83e16.jpg', 
      includes: ['Hotel', 'Breakfast', 'Tour Guide', 'Airport Transfer'],
      excludes: ['Airfare', 'Lunch & Dinner', 'Personal expenses'],
      maxGuests: 4,
      featured: true,
      description: 'Experience Japan\'s cherry blossoms',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Arrival',
          activities: [
            '3:00 PM - Airport pickup',
            '4:00 PM - Check-in at hotel',
            '6:00 PM - Welcome dinner',
            '8:00 PM - Free time'
          ]
        }
      ]
    },
    {
      id: 8,
      name: 'Seoul City Pop Tour',
      category: 'international',
      scope: 'international', 
      location: 'Seoul, South Korea',
      duration: '4 Days 3 Nights',
      nights: '3 Nights',
      price: 39999,
      originalPrice: 49999,
      discount: 20,
      rating: 4.8,
      reviews: 310,
      image: 'https://images.unsplash.com/photo-1538681105581-856b0a96bf8d?q=80&w=1974&auto=format&fit=crop',
      includes: ['Hotel', 'K-Pop Tour', 'City Guide'],
      excludes: ['Airfare', 'Meals', 'Shopping expenses'],
      maxGuests: 4,
      featured: false,
      description: 'K-Pop and culture tour',
      itinerary: [
        {
          day: 1,
          title: 'Day 1: Arrival & City Tour',
          activities: [
            '2:00 PM - Airport pickup',
            '3:00 PM - Check-in',
            '5:00 PM - N Seoul Tower',
            '7:00 PM - Myeongdong shopping'
          ]
        }
      ]
    },
  ];

  // --- EXTRACT UNIQUE DATA ---
  const allLocations = useMemo(() => [...new Set(packages.map(p => p.location))].sort(), []);
  const allDurations = useMemo(() => [...new Set(packages.map(p => p.duration))].sort(), []);

  // --- ✅ ADD THESE HANDLER FUNCTIONS ---
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

  // --- FILTER LOGIC ---
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
  const promoPackage = packages.find(pkg => pkg.featured);
  
  let headerTitle = 'All Packages';
  if (scopeFilter === 'favorites') headerTitle = 'My Favorites';
  else if (scopeFilter === 'best-deals') headerTitle = 'Best Deals';
  else if (selectedFilter !== 'all') headerTitle = currentCategoryName;

  // ✅ ADD THIS - Check if we should show booking page
  if (currentView === 'booking' && selectedPackageForBooking) {
    return <PackageBooking pkg={selectedPackageForBooking} onGoBack={handleGoBack} />;
  }

  // ✅ EXISTING RETURN - Package list view
  return (
    <div className="package-deals-page">
      <div className="content-container">
        
        {promoPackage && (
          <PromoSection
            promoFilter={promoFilter}
            onPromoFilterChange={setPromoFilter}
            promoPackage={promoPackage}
            onBookNow={scrollToPackages}
          />
        )}

        <BrowseCategory 
          title="Most Visited Destination"
          categories={mostVisitedCategories}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onCategoryClick={scrollToPackages}
        />

        <AllPackages 
          packages={filteredPackages}
          categoryName={headerTitle} 
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onBookNow={handleBookNow} // ✅ ADD THIS PROP
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
    </div>
  );
}

export default PackageDeals;