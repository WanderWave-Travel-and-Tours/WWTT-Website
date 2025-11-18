import { useState } from 'react';
import PackageCard from './packageCard';
import { Search, Heart, Sparkles, MapPin, Globe, Filter, XCircle, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import './AllPackages.css';

function AllPackages({ 
  packages, 
  categoryName, 
  favorites, 
  onToggleFavorite,
  onBookNow, // ✅ ADD THIS PROP
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
  allLocations
}) {

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
  };

  const isFilterActive = 
    searchQuery !== '' || 
    priceRange.min !== '' || 
    priceRange.max !== '' || 
    selectedDuration !== '' || 
    selectedDestinations.length > 0;

  return (
    <section className="all-packages-section" ref={packagesRef}>
      
      <div className="section-title-wrapper">
        <h2 className="packages-main-title">{categoryName}</h2>
        <span className="packages-count-badge">{packages.length} packages</span>
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
              <label className="filter-label">Price Range</label>
              <div className="price-inputs-container">
                <input 
                  type="number" 
                  className="price-input"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                />
                <span className="price-separator">-</span>
                <input 
                  type="number" 
                  className="price-input"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                />
              </div>
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
          
          <div className="filter-bar-container">
            <div className="scope-filter-container">
              <button 
                className={`scope-filter-btn ${scopeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onScopeChange('all')}
              >
                All
              </button>
              <button 
                className={`scope-filter-btn ${scopeFilter === 'best-deals' ? 'active' : ''}`}
                onClick={() => onScopeChange('best-deals')}
              >
                <Sparkles size={16} />
                <span>Best Deals</span>
              </button>
              <button 
                className={`scope-filter-btn fav-filter-btn ${scopeFilter === 'favorites' ? 'active' : ''}`}
                onClick={() => onScopeChange('favorites')}
              >
                <Heart size={16} fill={scopeFilter === 'favorites' ? 'currentColor' : 'none'} />
                <span>Favorites</span>
                {favorites.length > 0 && <span className="fav-count">({favorites.length})</span>}
              </button>
              <button 
                className={`scope-filter-btn ${scopeFilter === 'local' ? 'active' : ''}`}
                onClick={() => onScopeChange('local')}
              >
                <MapPin size={16} />
                <span>Local</span>
              </button>
              <button 
                className={`scope-filter-btn ${scopeFilter === 'international' ? 'active' : ''}`}
                onClick={() => onScopeChange('international')}
              >
                <Globe size={16} />
                <span>International</span>
              </button>
            </div>
          </div>

          <div className="packages-grid">
            {packages.length > 0 ? (
              packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  isFavorite={favorites.includes(pkg.id)}
                  onToggleFavorite={onToggleFavorite}
                  onBookNow={onBookNow} // ✅ ADD THIS PROP
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
        </div>
      </div>
    </section>
  );
}

export default AllPackages;