import './QuickFilters.css';

function QuickFilters({ onFilterClick }) {
  const filters = [
    { id: 'top-rated', label: '⭐ Top Rated' },
    { id: 'featured', label: '🔥 Featured' },
    { id: 'best-deals', label: '💰 Best Deals' },
    { id: 'new', label: '🆕 New Packages' },
  ];

  return (
    <section className="quick-filters-section">
      <h3 className="filters-title">Quick Filters</h3>
      <div className="filter-row">
        {filters.map(filter => (
          <button 
            key={filter.id} 
            className="filter-tag"
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
