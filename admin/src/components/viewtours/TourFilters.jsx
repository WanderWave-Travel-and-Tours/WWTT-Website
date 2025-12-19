import React from 'react';
import { Search } from 'lucide-react';

const TourFilters = ({ searchTerm, setSearchTerm, filterCategory, setFilterCategory, categories }) => {
    return (
        <div className="tf-filter-card">
            <div className="tf-filter-wrapper">
                <div className="tf-brand-label">TOUR <span>FILTERS</span></div>
                <div className="tf-filter-buttons">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            className={`tf-filter-btn ${filterCategory === cat ? 'tf-active-navy' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat === 'ALL' ? 'All Tours' : cat}
                        </button>
                    ))}
                </div>
                <div className="tf-search-box">
                    <Search size={18} className="tf-search-icon" />
                    <input 
                        type="text" className="tf-search-input" placeholder="Search title or destination..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default TourFilters;