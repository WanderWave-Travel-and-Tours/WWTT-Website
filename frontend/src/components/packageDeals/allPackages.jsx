import PackageCard from './packageCard';
import { Search } from 'lucide-react'; // Import ang Search icon dito
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
  
  // --- TANGGAPIN ANG BAGONG PROPS ---
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="all-packages-section" ref={packagesRef}>
      
      <div className="packages-header">
        <h2 className="packages-title">
          {selectedFilter === 'all' ? 'All Packages' : categoryName}
        </h2>
        <span className="packages-count">{packages.length} packages</span>
      </div>

      {/* --- BAGONG PARENT CONTAINER --- */}
      <div className="filter-bar-container">
        
        {/* --- Item 1: Scope Filters (Left Side) --- */}
        <div className="scope-filter-container">
          <button 
            className={`scope-filter-btn ${scopeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onScopeChange('all')}
          >
            All
          </button>
          <button 
            className={`scope-filter-btn ${scopeFilter === 'local' ? 'active' : ''}`}
            onClick={() => onScopeChange('local')}
          >
            Local
          </button>
          <button 
            className={`scope-filter-btn ${scopeFilter === 'international' ? 'active' : ''}`}
            onClick={() => onScopeChange('international')}
          >
            International
          </button>
        </div>

        {/* --- Item 2: Search Bar (Right Side) --- */}
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search within these packages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

      </div>
      {/* --- END OF FILTER BAR CONTAINER --- */}


      {/* --- Package Grid --- */}
      <div className="packages-grid">
        {packages.map(pkg => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            isFavorite={favorites.includes(pkg.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

export default AllPackages;