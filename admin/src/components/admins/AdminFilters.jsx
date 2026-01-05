import React from 'react';
import { Search } from 'lucide-react';
import './AdminFilters.css'; 

const AdminFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterRole, 
    setFilterRole, 
    roleOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="af-filter-card">
            <div className="af-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="af-brand-label">
                    ADMIN <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="af-filter-buttons">
                    {roleOptions.map(role => (
                        <button
                            key={role}
                            className={`af-filter-btn ${getFilterClassName(role)}`} 
                            onClick={() => setFilterRole(role)}
                        >
                            {role === 'ALL' ? 'All Admins' : role}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="af-search-box">
                    <Search size={18} className="af-search-icon" /> 
                    <input
                        type="text"
                        className="af-search-input"
                        placeholder="Search name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminFilters;