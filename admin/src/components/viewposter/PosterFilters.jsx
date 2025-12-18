import React from 'react';
import { Search } from 'lucide-react';
import './PosterFilters.css'; 

const PosterFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus, 
    statusOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="pf-filter-card">
            <div className="pf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="pf-brand-label">
                    POSTER <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="pf-filter-buttons">
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            className={`pf-filter-btn ${getFilterClassName(status)}`} 
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'ALL' ? 'All Posters' : status}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="pf-search-box">
                    <Search size={18} className="pf-search-icon" /> 
                    <input
                        type="text"
                        className="pf-search-input"
                        placeholder="Search poster title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default PosterFilters;