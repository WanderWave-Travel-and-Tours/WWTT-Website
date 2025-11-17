import PackageCard from './packageCard';
import { Search, Heart, Sparkles, MapPin, Globe } from 'lucide-react'; // Added MapPin & Globe
import './AllPackages.css';

function AllPackages({ 
  packages, 
  selectedFilter, 
  categoryName, 
  favorites, 
  onToggleFavorite,
  packagesRef,
  scopeFilter,
  onScopeChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="all-packages-section" ref={packagesRef}>
      
      <div className="packages-header">
        <h2 className="packages-title">
            {/* Title Logic */}
            {categoryName}
        </h2>
        <span className="packages-count">{packages.length} packages</span>
      </div>

      <div className="filter-bar-container">
        
        {/* --- Scope Filters --- */}
        <div className="scope-filter-container">
          
          {/* 1. ALL */}
          <button 
            className={`scope-filter-btn ${scopeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onScopeChange('all')}
          >
            All
          </button>
          
          {/* 2. BEST DEALS */}
          <button 
            className={`scope-filter-btn ${scopeFilter === 'best-deals' ? 'active' : ''}`}
            onClick={() => onScopeChange('best-deals')}
          >
            <Sparkles size={16} />
            <span>Best Deals</span>
          </button>

          {/* 3. FAVORITES (Inilipat dito sunod sa Best Deals) */}
          <button 
            className={`scope-filter-btn fav-filter-btn ${scopeFilter === 'favorites' ? 'active' : ''}`}
            onClick={() => onScopeChange('favorites')}
          >
            <Heart size={16} fill={scopeFilter === 'favorites' ? 'currentColor' : 'none'} />
            {/* Tinanggal ang hiding logic, laging kita ang text */}
            <span>Favorites</span>
            {favorites.length > 0 && (
              <span className="fav-count">({favorites.length})</span>
            )}
          </button>

          {/* 4. LOCAL (May Icon na) */}
          <button 
            className={`scope-filter-btn ${scopeFilter === 'local' ? 'active' : ''}`}
            onClick={() => onScopeChange('local')}
          >
            <MapPin size={16} />
            <span>Local</span>
          </button>

          {/* 5. INTERNATIONAL (May Icon na) */}
          <button 
            className={`scope-filter-btn ${scopeFilter === 'international' ? 'active' : ''}`}
            onClick={() => onScopeChange('international')}
          >
            <Globe size={16} />
            <span>International</span>
          </button>
          
        </div>

        {/* --- Search Bar --- */}
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

      </div>

      {/* --- Package Grid --- */}
      <div className="packages-grid">
        {packages.length > 0 ? (
          packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              isFavorite={favorites.includes(pkg.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
             {scopeFilter === 'favorites' 
                ? "No favorite packages yet." 
                : scopeFilter === 'best-deals'
                ? "No discounted deals available right now."
                : "No packages found."}
          </div>
        )}
      </div>
    </section>
  );
}

export default AllPackages;