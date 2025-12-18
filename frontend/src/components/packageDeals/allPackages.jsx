import { useState, useEffect, useRef } from 'react';
import PackageCard from './packageCard';
import CurrencyModal from './CurrencyModal';
import { Search, Heart, Sparkles, MapPin, Globe, Filter, XCircle, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import './allPackages.css';

function AllPackages({
  packages,
  categoryName,
  favorites,
  onToggleFavorite,
  onBookNow,
  packagesRef,
  scopeFilter,
  onScopeChange,
  searchQuery,
  onSearchChange,
  priceRange,
  setPriceRange,
  selectedDuration,
  setSelectedDuration,
  allDurations,
  selectedDestinations,
  setSelectedDestinations,
  allLocations,
  isLoggedIn, // NEW PROP added
  onLoginRequired // NEW PROP added
}) {

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currency, setCurrency] = useState('PHP');
  const EXCHANGE_RATE = 58;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Bagong state para sa validation error
  const [priceError, setPriceError] = useState('');

  // ... (existing useEffects and helper functions) ...

  useEffect(() => {
    if (hasTriggeredRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowCurrencyModal(true);
          hasTriggeredRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (packagesRef.current) {
      observer.observe(packagesRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [packagesRef]);

  useEffect(() => {
    setCurrentPage(1);
    setPriceError(''); // I-reset ang error kapag nagbago ang filters
  }, [packages, scopeFilter, searchQuery, priceRange, selectedDuration, selectedDestinations]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPackages = packages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(packages.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (packagesRef.current) {
        const yOffset = -120;
        const element = packagesRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) paginate(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) paginate(currentPage - 1);
  };

  const handleDestinationChange = (location) => {
    if (selectedDestinations.includes(location)) {
      setSelectedDestinations(prev => prev.filter(d => d !== location));
    } else {
      setSelectedDestinations(prev => [...prev, location]);
    }
  };

  const clearSidebarFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedDuration('');
    setSelectedDestinations([]);
    onSearchChange('');
    setPriceError(''); // I-reset ang error
  };

  const isFilterActive =
    searchQuery !== '' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    selectedDuration !== '' ||
    selectedDestinations.length > 0;

  // BAGONG FUNCTION PARA SA PRICE INPUT VALIDATION
  const handlePriceChange = (value, type) => {
    // RegEx: Hayaan ang empty string. Dapat ay 1-6 digits, at bawal magsimula sa 0 kung 2-6 digits.
    // ^[1-9]\d{0,5}$ - 1 hanggang 9 na sinusundan ng 0-5 na digit (max 6 digits, bawal mag-umpisa sa 0)
    // |^[0-9]{1}$    - o isang solong digit (na pwedeng 0-9)
    const validPattern = /^[1-9]\d{0,5}$|^[0-9]{1}$|^$/;

    // Check para sa max length bago ang RegEx para sa mas maayos na user experience
    if (value.length > 6) {
        setPriceError('Maximum 6 digits only.');
        return;
    }

    if (validPattern.test(value)) {
        if (value !== '' && parseInt(value) < 1) {
            setPriceError('Minimum price must be 1 or higher.');
            // Huwag muna i-update ang state, o i-force ang value sa 1
            setPriceRange(prev => ({ ...prev, [type]: '1' })); 
            return;
        }

        // I-clear ang error at i-update ang state
        setPriceError('');
        setPriceRange(prev => ({ ...prev, [type]: value }));
        
    } else {
        // Kapag may invalid characters o nag-umpisa sa 0 na may kasunod
        if (value !== '') {
            setPriceError('Invalid input. Only digits (max 6) are allowed. Cannot start with 0 unless it is a single 0.');
        } else {
            // Hayaan ang empty string na walang error
            setPriceError('');
            setPriceRange(prev => ({ ...prev, [type]: '' }));
        }
    }
  };
  // END OF PRICE INPUT VALIDATION FUNCTION

  return (
    <section className="all-packages-section" ref={packagesRef}>

      {/* --- Pass Currency Props to Modal --- */}
      <CurrencyModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        currency={currency}
        setCurrency={setCurrency}
      />

      <div className="section-title-wrapper">
        <h2 className="packages-main-title">{categoryName}</h2>
        <span className="packages-count-badge">{packages.length} packages</span>
      </div>

      <div className="currency-banner">
        <div className="currency-info">
          <Info className="info-icon" size={20} />
          <div className="info-text">
            <strong>International Booking Notice:</strong> Prices may vary due to currency exchange rates and bank transaction fees.
            Displayed USD prices are estimates based on the current exchange rate (₱{EXCHANGE_RATE} = $1).
          </div>
        </div>

        <div className="currency-toggle-container">
          <span className="toggle-label">View in:</span>
          <div className="currency-switch">
            <button
              className={`currency-btn ${currency === 'PHP' ? 'active' : ''}`}
              onClick={() => setCurrency('PHP')}
            >
              PHP ₱
            </button>
            <button
              className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >
              USD $
            </button>
          </div>
        </div>
      </div>

      <div className="all-packages-layout">
        <aside className={`side-filter ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <button
            className={`mobile-filter-toggle ${isMobileFilterOpen ? 'active' : ''}`}
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <SlidersHorizontal size={18} />
            <span>{isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {isMobileFilterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="side-filter-header">
            <div className="side-filter-title">
              <Filter size={18} strokeWidth={2.5} />
              <span>Filters</span>
            </div>
            {isFilterActive && (
              <button className="reset-btn" onClick={clearSidebarFilters}>
                Reset
              </button>
            )}
          </div>

          <div className="side-filter-content">
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <div className="side-search-wrapper">
                <Search className="side-search-icon" size={18} />
                <input
                  type="text"
                  className="side-search-input"
                  placeholder="Destination, activity..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Price Range ({currency})</label>
              <div className="price-inputs-container">
                <input
                  type="text" // Changed to type="text" to better control invalid characters
                  inputMode="numeric"
                  className={`price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Min (e.g., 1000)"
                  value={priceRange.min}
                  // Ginamit ang bagong handler function
                  onChange={(e) => handlePriceChange(e.target.value, 'min')}
                />
                <span className="price-separator">-</span>
                <input
                  type="text" // Changed to type="text" to better control invalid characters
                  inputMode="numeric"
                  className={`price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Max (e.g., 50000)"
                  value={priceRange.max}
                  // Ginamit ang bagong handler function
                  onChange={(e) => handlePriceChange(e.target.value, 'max')}
                />
              </div>
              {/* Pop-up/Notification para sa error */}
              {priceError && (
                <div className="price-error-message">
                  {priceError}
                </div>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">Duration</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="filter-select"
              >
                <option value="">All Durations</option>
                {allDurations.map((duration, idx) => (
                  <option key={idx} value={duration}>{duration}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Destination</label>
              <div className="checkbox-list">
                {allLocations.map((loc, idx) => (
                  <label key={idx} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedDestinations.includes(loc)}
                      onChange={() => handleDestinationChange(loc)}
                    />
                    <span className="custom-checkbox"></span>
                    <span>{loc}</span>
                  </label>
                ))}
              </div>
            </div>

            {isMobileFilterOpen && isFilterActive && (
              <button
                className="reset-btn"
                style={{ background: '#FF8C00', marginTop: '10px', width: '100%', padding: '12px' }}
                onClick={clearSidebarFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        <div className="main-content">

          <div className="packages-filter-bar-container">
            <div className="packages-scope-filter-container">
              <button
                className={`packages-scope-filter-btn ${scopeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onScopeChange('all')}
              >
                All
              </button>
              <button
                className={`packages-scope-filter-btn ${scopeFilter === 'best-deals' ? 'active' : ''}`}
                onClick={() => onScopeChange('best-deals')}
              >
                <Sparkles size={16} />
                <span>Best Deals</span>
              </button>
              <button
                className={`packages-scope-filter-btn fav-filter-btn ${scopeFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => onScopeChange('favorites')}
              >
                <Heart size={16} fill={scopeFilter === 'favorites' ? 'currentColor' : 'none'} />
                <span>Favorites</span>
                {favorites.length > 0 && <span className="fav-count">({favorites.length})</span>}
              </button>
              <button
                className={`packages-scope-filter-btn ${scopeFilter === 'local' ? 'active' : ''}`}
                onClick={() => onScopeChange('local')}
              >
                <MapPin size={16} />
                <span>Local</span>
              </button>
              <button
                className={`packages-scope-filter-btn ${scopeFilter === 'international' ? 'active' : ''}`}
                onClick={() => onScopeChange('international')}
              >
                <Globe size={16} />
                <span>International</span>
              </button>
            </div>
          </div>

          <div className="packages-grid">
            {currentPackages.length > 0 ? (
              currentPackages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  isFavorite={favorites.includes(pkg.id)}
                  onToggleFavorite={onToggleFavorite}
                  onBookNow={onBookNow}
                  currency={currency}
                  exchangeRate={EXCHANGE_RATE}
                  isLoggedIn={isLoggedIn} // Passed new prop
                  onLoginRequired={onLoginRequired} // Passed new prop
                />
              ))
            ) : (
              <div className="no-results">
                <XCircle size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
                <h3 style={{ color: '#1f2937', margin: '0 0 8px 0' }}>No packages found</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Try adjusting your filters or search for something else.
                </p>
                <button
                  style={{ marginTop: '24px', color: '#FF8C00', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                  onClick={clearSidebarFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {packages.length > itemsPerPage && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default AllPackages;