import './QuickFilters.css';

// 1. Tumanggap ng 'activeFilter' prop
function QuickFilters({ onFilterClick, activeFilter }) {
  const filters = [
    // --- 2. IDAGDAG ANG FAVORITES DITO ---
    { id: 'favorites', label: '❤️ Favorites' },
    { id: 'featured', label: '🔥 Featured' },
    { id: 'top-rated', label: '⭐ Top Rated' },
    { id: 'best-deals', label: '💰 Best Deals' },
  ];

  return (
    <section className="quick-filters-section">
      <h3 className="filters-title">Quick Filters</h3>
      <div className="filter-row">
        {filters.map(filter => (
          <button 
            key={filter.id} 
            // 3. Gawing dynamic ang 'className'
            className={`filter-tag ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => {
              if (onFilterClick) {
                onFilterClick(filter.id);
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickFilters;