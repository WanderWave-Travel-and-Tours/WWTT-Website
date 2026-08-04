// src/components/TourPackages/allTours.jsx
import { useState, useEffect, useRef } from 'react';
import TourCard from './tourCard';
import {
  Search, MapPin, Globe, Filter, XCircle, SlidersHorizontal,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUpNarrowWide, ArrowDownNarrowWide, Users, Map
} from 'lucide-react';
import './allTours.css';

function AllTours({
  tours,
  toursRef,
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
  allDestinations,
  currency,
  exchangeRate,
  setCurrency,
  onBookNow,
  currentUser,
}) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('');
  const [priceError, setPriceError] = useState('');

  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
    setPriceError('');
  }, [tours, scopeFilter, searchQuery, priceRange, selectedDuration, selectedDestinations]);

  // Sort
  const sortedTours = [...tours].sort((a, b) => {
    if (sortOrder === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortOrder === 'price-desc') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTours = sortedTours.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedTours.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (toursRef?.current) {
      const yOffset = -120;
      const y = toursRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDestinationChange = (dest) => {
    if (selectedDestinations.includes(dest)) {
      setSelectedDestinations(prev => prev.filter(d => d !== dest));
    } else {
      setSelectedDestinations(prev => [...prev, dest]);
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
        setPriceError('Invalid input. Only digits (max 6) are allowed.');
      } else {
        setPriceError('');
        setPriceRange(prev => ({ ...prev, [type]: '' }));
      }
    }
  };

  return (
    <section className="all-tours-section" ref={toursRef}>

      {/* ── Title + Count ─────────────────────────────────────────────────── */}
      <div className="tours-title-wrapper">
        <h2 className="tours-main-title">TOUR PACKAGES</h2>
        <span className="tours-count-badge">{tours.length} tours</span>
      </div>

      {/* ── Currency Banner ────────────────────────────────────────────────── */}
      <div className="tours-currency-banner">
        <div className="tours-currency-info">
          <span className="tours-info-text">
            <strong>Pricing shown in {currency === 'PHP' ? 'PHP (₱)' : 'USD ($)'}.</strong>{' '}
            Switch currency to view estimated prices. Final charges may vary.
          </span>
        </div>
        <div className="tours-currency-toggle">
          <span className="tours-toggle-label">View in:</span>
          <div className="tours-currency-switch">
            <button
              className={`tours-currency-btn ${currency === 'PHP' ? 'active' : ''}`}
              onClick={() => setCurrency('PHP')}
            >PHP ₱</button>
            <button
              className={`tours-currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >USD $</button>
          </div>
        </div>
      </div>

      {/* ── 2-column layout ───────────────────────────────────────────────── */}
      <div className="all-tours-layout">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className={`tours-side-filter ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <button
            className={`tours-mobile-toggle ${isMobileFilterOpen ? 'active' : ''}`}
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <SlidersHorizontal size={18} />
            <span>{isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {isMobileFilterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="tours-side-filter-header">
            <div className="tours-side-filter-title">
              <Filter size={18} strokeWidth={2.5} />
              <span>Filters</span>
            </div>
            {isFilterActive && (
              <button className="tours-reset-btn" onClick={clearSidebarFilters}>Reset</button>
            )}
          </div>

          <div className="tours-side-filter-content">
            {/* Search */}
            <div className="tours-filter-group">
              <label className="tours-filter-label">Search</label>
              <div className="tours-search-wrapper">
                <Search className="tours-search-icon" size={18} />
                <input
                  type="text"
                  className="tours-search-input"
                  placeholder="Tour name, destination..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="tours-filter-group">
              <label className="tours-filter-label">Price Range ({currency})</label>
              <div className="tours-price-inputs">
                <input
                  type="text"
                  inputMode="numeric"
                  className={`tours-price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange(e.target.value, 'min')}
                />
                <span className="tours-price-sep">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`tours-price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange(e.target.value, 'max')}
                />
              </div>
              {priceError && <div className="tours-price-error">{priceError}</div>}
            </div>

            {/* Duration */}
            <div className="tours-filter-group">
              <label className="tours-filter-label">Duration</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="tours-filter-select"
              >
                <option value="">All Durations</option>
                {allDurations.map((d, idx) => (
                  <option key={idx} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div className="tours-filter-group">
              <label className="tours-filter-label">Destination</label>
              <div className="tours-checkbox-list">
                {allDestinations.map((dest, idx) => (
                  <label key={idx} className="tours-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedDestinations.includes(dest)}
                      onChange={() => handleDestinationChange(dest)}
                    />
                    <span className="tours-custom-checkbox"></span>
                    <span>{dest}</span>
                  </label>
                ))}
              </div>
            </div>

            {isMobileFilterOpen && isFilterActive && (
              <button
                className="tours-reset-btn tours-reset-btn--mobile-clear"
                onClick={clearSidebarFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
        <div className="tours-filter-bar-container">
          <div className="tours-scope-filter-container">
            <button
              className={`tours-scope-btn ${scopeFilter === 'all' ? 'active' : ''}`}
              onClick={() => onScopeChange('all')}
            >All</button>
            <button
              className={`tours-scope-btn ${scopeFilter === 'local' ? 'active' : ''}`}
              onClick={() => onScopeChange('local')}
            >
              <MapPin size={16} /><span>Local</span>
            </button>
            <button
              className={`tours-scope-btn ${scopeFilter === 'international' ? 'active' : ''}`}
              onClick={() => onScopeChange('international')}
            >
              <Globe size={16} /><span>International</span>
            </button>
            <button
              className={`tours-scope-btn ${scopeFilter === 'private' ? 'active' : ''}`}
              onClick={() => onScopeChange('private')}
            >
              <Map size={16} /><span>Private</span>
            </button>
            <button
              className={`tours-scope-btn ${scopeFilter === 'joiners' ? 'active' : ''}`}
              onClick={() => onScopeChange('joiners')}
            >
              <Users size={16} /><span>Joiners</span>
            </button>

            <div className="tours-scope-divider" />

            <button
              className={`tours-scope-btn sort-btn ${sortOrder === 'price-asc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-asc' ? '' : 'price-asc')}
            >
              <ArrowUpNarrowWide size={16} /><span>Price: Low–High</span>
            </button>
            <button
              className={`tours-scope-btn sort-btn ${sortOrder === 'price-desc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-desc' ? '' : 'price-desc')}
            >
              <ArrowDownNarrowWide size={16} /><span>Price: High–Low</span>
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div className="tours-main-content">
          <div className="tours-grid">
            {currentTours.length > 0 ? (
              currentTours.map(tour => (
                <TourCard
                  key={tour._id}
                  tour={tour}
                  onBookNow={onBookNow}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  currentUser={currentUser}
                />
              ))
            ) : (
              <div className="tours-no-results">
                <XCircle size={64} color="#cbd5e1" strokeWidth={1.5} className="tours-no-results-icon" />
                <h3>No tours found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button className="tours-clear-btn" onClick={clearSidebarFilters}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {tours.length > itemsPerPage && (
            <div className="tours-pagination">
              <button
                className="tours-pagination-btn"
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={32} strokeWidth={2.5} />
              </button>

              <div className="tours-pagination-info">
                <span className="tours-page-label">Page</span>
                <span className="tours-current-page">{currentPage}</span>
                <span className="tours-page-label">of {totalPages}</span>
              </div>

              <button
                className="tours-pagination-btn"
                onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={32} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

export default AllTours;