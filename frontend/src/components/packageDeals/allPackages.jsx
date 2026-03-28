// src/components/PackageDeals/allPackages.jsx - COMPLETE CODE

import { useState, useEffect, useRef } from 'react';
import PackageCard from './packageCard';
import CurrencyModal from './CurrencyModal';
import PromoSection from './promoSection';
import { Search, Heart, Sparkles, MapPin, Globe, Filter, XCircle, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, LogIn, ArrowUpNarrowWide, ArrowDownNarrowWide, Map } from 'lucide-react';
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
  isLoggedIn, 
  onLoginRequired,
  currency = 'PHP',
  exchangeRate = 58,
  setCurrency,
  onPromoBookNow
}) {

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(''); // '' | 'price-asc' | 'price-desc'
  
  const itemsPerPage = 6; 

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const hasTriggeredRef = useRef(false);

  const [priceError, setPriceError] = useState('');

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
    setPriceError('');
  }, [packages, scopeFilter, searchQuery, priceRange, selectedDuration, selectedDestinations]);

  // ✅ Hidden packages — excluded from public listing
  const HIDDEN_PACKAGE_IDS = ['69c4c9cceda858d7049a460c'];

  // Sort packages based on sortOrder
  const sortedPackages = [...packages].filter(pkg => !HIDDEN_PACKAGE_IDS.includes(pkg._id || pkg.id)).sort((a, b) => {
    if (sortOrder === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortOrder === 'price-desc') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPackages = sortedPackages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPackages.length / itemsPerPage);

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
    setPriceError('');
  };

  const isFilterActive =
    searchQuery !== '' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
    selectedDuration !== '' ||
    selectedDestinations.length > 0;

  const handlePriceChange = (value, type) => {
    const validPattern = /^[1-9]\d{0,5}$|^[0-9]{1}$|^$/;

    if (value.length > 6) {
        setPriceError('Maximum 6 digits only.');
        return;
    }

    if (validPattern.test(value)) {
        if (value !== '' && parseInt(value) < 1) {
            setPriceError('Minimum price must be 1 or higher.');
            setPriceRange(prev => ({ ...prev, [type]: '1' })); 
            return;
        }

        setPriceError('');
        setPriceRange(prev => ({ ...prev, [type]: value }));
        
    } else {
        if (value !== '') {
            setPriceError('Invalid input. Only digits (max 6) are allowed. Cannot start with 0 unless it is a single 0.');
        } else {
            setPriceError('');
            setPriceRange(prev => ({ ...prev, [type]: '' }));
        }
    }
  };

  // ============================================================
  // CHECK IF USER NEEDS TO LOGIN FOR FAVORITES
  // ============================================================
  const showLoginPrompt = scopeFilter === 'favorites' && !isLoggedIn;

  return (
    <section className="all-packages-section" ref={packagesRef}>
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
            <strong>Pricing is shown based on your selected location:</strong> Switch between <strong>PHP (Local)</strong> and <strong>USD (International)</strong> to view estimated prices. 
            Final charges may vary due to exchange rates and bank fees.
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

      {onPromoBookNow && (
        <div style={{ 
          marginTop: '8px',
          marginBottom: '8px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
        }}>
          <PromoSection onBookNow={onPromoBookNow} />
        </div>
      )}

      {/* ============================================================
          LAYOUT — 2-column grid with explicit row placement:
          Col 1: sidebar  → spans row 1 AND row 2
          Col 2, Row 1:   → filter bar  (level with sidebar header)
          Col 2, Row 2:   → main content (cards + pagination)
      ============================================================ */}
      <div className="all-packages-layout" style={{ position: 'relative' }}>

        {/* ── SIDEBAR — col 1, spans both rows ── */}
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
                  type="text"
                  inputMode="numeric"
                  className={`price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Min (e.g., 1000)"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange(e.target.value, 'min')}
                />
                <span className="price-separator">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Max (e.g., 50000)"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange(e.target.value, 'max')}
                />
              </div>
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

        {/* ── FILTER BAR — col 2, row 1 — naturally level with sidebar header ── */}
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
            <button
              className={`packages-scope-filter-btn ${scopeFilter === 'with-tours' ? 'active' : ''}`}
              onClick={() => onScopeChange('with-tours')}
            >
              <Map size={16} />
              <span>With Tours</span>
            </button>

            {/* Divider separating scope filters from sort filters */}
            <div className="scope-filter-divider" />

            {/* Sort: Price Low to High */}
            <button
              className={`packages-scope-filter-btn sort-btn ${sortOrder === 'price-asc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-asc' ? '' : 'price-asc')}
            >
              <ArrowUpNarrowWide size={16} />
              <span>Price: Low–High</span>
            </button>

            {/* Sort: Price High to Low */}
            <button
              className={`packages-scope-filter-btn sort-btn ${sortOrder === 'price-desc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-desc' ? '' : 'price-desc')}
            >
              <ArrowDownNarrowWide size={16} />
              <span>Price: High–Low</span>
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT — col 2, row 2 ── */}
        <div className="main-content">
          <div className="packages-grid">
            {/* ============================================================ */}
            {/* SHOW LOGIN PROMPT IF NOT LOGGED IN AND FAVORITES TAB SELECTED */}
            {/* ============================================================ */}
            {showLoginPrompt ? (
              <div className="login-required-message" style={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '80px', 
                  marginBottom: '24px',
                  filter: 'drop-shadow(0 4px 8px rgba(255, 140, 0, 0.3))'
                }}>
                  ❤️
                </div>
                <h3 style={{ 
                  color: '#1f2937', 
                  margin: '0 0 12px 0',
                  fontSize: '28px',
                  fontWeight: '700'
                }}>
                  Login Required
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0 0 32px 0',
                  fontSize: '16px',
                  maxWidth: '500px',
                  lineHeight: '1.6'
                }}>
                  Please log in to view and manage your favorite packages. Create your personalized wishlist and never lose track of your dream destinations!
                </p>
                <button
                  onClick={onLoginRequired}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 32px',
                    backgroundColor: '#FF8C00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
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
                  <LogIn size={20} />
                  <span>Login to View Favorites</span>
                </button>
              </div>
            ) : currentPackages.length > 0 ? (
              currentPackages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  isFavorite={favorites.includes(pkg.id)}
                  onToggleFavorite={onToggleFavorite}
                  onBookNow={onBookNow}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={onLoginRequired}
                />
              ))
            ) : (
              <div className="no-results" style={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px'
              }}>
                <XCircle size={64} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: '24px' }} />
                <h3 style={{ color: '#1f2937', margin: '0 0 12px 0', fontSize: '24px' }}>No packages found</h3>
                <p style={{ color: '#6b7280', margin: '0 0 24px 0', fontSize: '15px' }}>
                  Try adjusting your filters or search for something else.
                </p>
                <button
                  style={{ 
                    padding: '12px 24px',
                    color: '#FF8C00', 
                    background: 'none', 
                    border: '2px solid #FF8C00', 
                    borderRadius: '8px',
                    fontWeight: '600', 
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={clearSidebarFilters}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#FF8C00';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#FF8C00';
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {packages.length > itemsPerPage && !showLoginPrompt && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="pagination-info-wrapper">
                <span className="page-label">Page</span>
                <span className="current-page-box">{currentPage}</span>
                <span className="total-pages-label">of {totalPages}</span>
              </div>

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