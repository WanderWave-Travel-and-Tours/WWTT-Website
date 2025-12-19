import React from 'react';
import { Search } from 'lucide-react';
import './TestimonialFilters.css'; 

const TestimonialFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterSource, 
    setFilterSource, 
    sourceOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="tf-filter-card">
            <div className="tf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="tf-brand-label">
                    TESTIMONIAL <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="tf-filter-buttons">
                    {sourceOptions.map(source => (
                        <button
                            key={source}
                            className={`tf-filter-btn ${getFilterClassName(source)}`} 
                            onClick={() => setFilterSource(source)}
                        >
                            {source === 'ALL' ? 'All Sources' : source}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="tf-search-box">
                    <Search size={18} className="tf-search-icon" /> 
                    <input
                        type="text"
                        className="tf-search-input"
                        placeholder="Search name or feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default TestimonialFilters;