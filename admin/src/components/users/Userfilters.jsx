import React from 'react';
import { Search } from 'lucide-react';
import './Userfilters.css'; 

const UserFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus, 
    statusOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="uf-filter-card">
            <div className="uf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="uf-brand-label">
                    USER <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="uf-filter-buttons">
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            className={`uf-filter-btn ${getFilterClassName(status)}`} 
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'ALL' ? 'All Users' : status}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="uf-search-box">
                    <Search size={18} className="uf-search-icon" /> 
                    <input
                        type="text"
                        className="uf-search-input"
                        placeholder="Search name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default UserFilters;