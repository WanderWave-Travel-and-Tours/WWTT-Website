// src/components/Transfers/allTransfers.jsx
import { useState, useEffect } from 'react';
import TransferCard from './transferCard';
import {
  Search, MapPin, Filter, XCircle, SlidersHorizontal,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowUpNarrowWide, ArrowDownNarrowWide, Car
} from 'lucide-react';
import './allTransfers.css';

function AllTransfers({
  transfers,
  transfersRef,
  searchQuery,
  onSearchChange,
  priceRange,
  setPriceRange,
  selectedDestinations,
  setSelectedDestinations,
  allDestinations,
  currency,
  exchangeRate,
  setCurrency,
  onInquire,
  // ── Wishlist props ────────────────────────────────────────
  currentUser,
  userFavorites,
  onFavoriteToggle,
}) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('');
  const [priceError, setPriceError] = useState('');

  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
    setPriceError('');
  }, [transfers, searchQuery, priceRange, selectedDestinations]);

  // Sort — use oneWayPrice as the sort key
  const sortedTransfers = [...transfers].sort((a, b) => {
    if (sortOrder === 'price-asc') return (a.oneWayPrice || 0) - (b.oneWayPrice || 0);
    if (sortOrder === 'price-desc') return (b.oneWayPrice || 0) - (a.oneWayPrice || 0);
    return 0;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransfers = sortedTransfers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedTransfers.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (transfersRef?.current) {
      const yOffset = -120;
      const y = transfersRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
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
    setSelectedDestinations([]);
    onSearchChange('');
    setSortOrder('');
    setPriceError('');
  };

  const isFilterActive =
    searchQuery !== '' ||
    priceRange.min !== '' ||
    priceRange.max !== '' ||
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
    <section className="all-transfers-section" ref={transfersRef}>

      {/* ── Title + Count ─────────────────────────────────────────────────── */}
      <div className="transfers-title-wrapper">
        <h2 className="transfers-main-title">TOURIST TRANSFERS</h2>
        <span className="transfers-count-badge">{transfers.length} transfers</span>
      </div>

      {/* ── Currency Banner ────────────────────────────────────────────────── */}
      <div className="transfers-currency-banner">
        <div className="transfers-currency-info">
          <span className="transfers-info-text">
            <strong>Pricing shown in {currency === 'PHP' ? 'PHP (₱)' : 'USD ($)'}.</strong>{' '}
            Switch currency to view estimated prices. Final charges may vary.
          </span>
        </div>
        <div className="transfers-currency-toggle">
          <span className="transfers-toggle-label">View in:</span>
          <div className="transfers-currency-switch">
            <button
              className={`transfers-currency-btn ${currency === 'PHP' ? 'active' : ''}`}
              onClick={() => setCurrency('PHP')}
            >PHP ₱</button>
            <button
              className={`transfers-currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >USD $</button>
          </div>
        </div>
      </div>

      {/* ── 2-column layout ───────────────────────────────────────────────── */}
      <div className="all-transfers-layout">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className={`transfers-side-filter ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <button
            className={`transfers-mobile-toggle ${isMobileFilterOpen ? 'active' : ''}`}
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <SlidersHorizontal size={18} />
            <span>{isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {isMobileFilterOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="transfers-side-filter-header">
            <div className="transfers-side-filter-title">
              <Filter size={18} strokeWidth={2.5} />
              <span>Filters</span>
            </div>
            {isFilterActive && (
              <button className="transfers-reset-btn" onClick={clearSidebarFilters}>Reset</button>
            )}
          </div>

          <div className="transfers-side-filter-content">
            {/* Search */}
            <div className="transfers-filter-group">
              <label className="transfers-filter-label">Search</label>
              <div className="transfers-search-wrapper">
                <Search className="transfers-search-icon" size={18} />
                <input
                  type="text"
                  className="transfers-search-input"
                  placeholder="Transfer name, destination..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="transfers-filter-group">
              <label className="transfers-filter-label">Price Range ({currency})</label>
              <div className="transfers-price-inputs">
                <input
                  type="text"
                  inputMode="numeric"
                  className={`transfers-price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange(e.target.value, 'min')}
                />
                <span className="transfers-price-sep">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`transfers-price-input ${priceError ? 'input-error' : ''}`}
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange(e.target.value, 'max')}
                />
              </div>
              {priceError && <div className="transfers-price-error">{priceError}</div>}
            </div>

            {/* Destination checkboxes */}
            {allDestinations.length > 0 && (
              <div className="transfers-filter-group">
                <label className="transfers-filter-label">Destination</label>
                <div className="transfers-checkbox-list">
                  {allDestinations.map((dest, idx) => (
                    <label key={idx} className="transfers-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedDestinations.includes(dest)}
                        onChange={() => handleDestinationChange(dest)}
                      />
                      <span className="transfers-custom-checkbox"></span>
                      <span>{dest}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isMobileFilterOpen && isFilterActive && (
              <button
                className="transfers-reset-btn"
                style={{ background: '#0369a1', marginTop: '10px', width: '100%', padding: '12px' }}
                onClick={clearSidebarFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* ── SORT BAR ── */}
        <div className="transfers-filter-bar-container">
          <div className="transfers-scope-filter-container">
            <button
              className={`transfers-scope-btn sort-btn ${sortOrder === 'price-asc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-asc' ? '' : 'price-asc')}
            >
              <ArrowUpNarrowWide size={16} /><span>Price: Low–High</span>
            </button>
            <button
              className={`transfers-scope-btn sort-btn ${sortOrder === 'price-desc' ? 'active' : ''}`}
              onClick={() => setSortOrder(prev => prev === 'price-desc' ? '' : 'price-desc')}
            >
              <ArrowDownNarrowWide size={16} /><span>Price: High–Low</span>
            </button>

            {isFilterActive && (
              <>
                <div className="transfers-scope-divider" />
                <button
                  className="transfers-scope-btn transfers-clear-active-btn"
                  onClick={clearSidebarFilters}
                >
                  <XCircle size={14} /><span>Clear Filters</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div className="transfers-main-content">
          <div className="transfers-grid">
            {currentTransfers.length > 0 ? (
              currentTransfers.map(transfer => (
                <TransferCard
                  key={transfer._id}
                  transfer={transfer}
                  onInquire={onInquire}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  currentUser={currentUser}
                  isFavorited={userFavorites?.includes(transfer._id)}
                  onFavoriteToggle={onFavoriteToggle}
                />
              ))
            ) : (
              <div className="transfers-no-results">
                <XCircle size={64} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: '24px' }} />
                <h3>No transfers found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button className="transfers-clear-btn" onClick={clearSidebarFilters}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {sortedTransfers.length > itemsPerPage && (
            <div className="transfers-pagination">
              <button
                className="transfers-pagination-btn"
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={32} strokeWidth={2.5} />
              </button>

              <div className="transfers-pagination-info">
                <span className="transfers-page-label">Page</span>
                <span className="transfers-current-page">{currentPage}</span>
                <span className="transfers-page-label">of {totalPages}</span>
              </div>

              <button
                className="transfers-pagination-btn"
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

export default AllTransfers;