import './QuickFilters.css';

function QuickFilters({ onFilterClick, activeFilter }) {
  const filters = [
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