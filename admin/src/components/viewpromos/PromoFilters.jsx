import React from 'react';
import { Search } from 'lucide-react';
import './PromoFilters.css'; 

const PromoFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus, 
    statusOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="prf-filter-card">
            <div className="prf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="prf-brand-label">
                    PROMO <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="prf-filter-buttons">
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            className={`prf-filter-btn ${getFilterClassName(status)}`} 
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'ALL' ? 'All Promos' : status}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="prf-search-box">
                    <Search size={18} className="prf-search-icon" /> 
                    <input
                        type="text"
                        className="prf-search-input"
                        placeholder="Search by code or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default PromoFilters;