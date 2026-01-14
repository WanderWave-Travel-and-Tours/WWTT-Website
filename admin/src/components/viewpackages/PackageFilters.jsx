import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './PackageFilters.css';

const PackageFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterCategory, 
    setFilterCategory, 
    categoryOptions,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCategorySelect = (category) => {
        setFilterCategory(category);
        setIsDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterCategory === 'ALL') return 'All Categories';
        return filterCategory;
    };

    return (
        <div className="pkg-filter-card">
            <div className="pkg-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="pkg-brand-section">
                    <div className="pkg-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="pkg-brand-label">
                        PACKAGE <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="pkg-controls-group">
                    {/* MIDDLE: Filters */}
                    <div className="pkg-filters-row">
                        
                        {/* Category Filter */}
                        <div className="pkg-filter-item">
                            <label>Category:</label>
                            <div className="pkg-select-wrapper">
                                <button 
                                    className="pkg-select-btn"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className="pkg-select-label">{getSelectedLabel()}</span>
                                    <ChevronDown 
                                        size={14} 
                                        className={`pkg-select-icon ${isDropdownOpen ? 'pkg-select-icon--open' : ''}`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div 
                                            className="pkg-dropdown-overlay" 
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                        <div className="pkg-dropdown-menu">
                                            {categoryOptions.map((category) => (
                                                <button
                                                    key={category}
                                                    className={`pkg-dropdown-item ${
                                                        filterCategory === category ? 'pkg-dropdown-item--active' : ''
                                                    }`}
                                                    onClick={() => handleCategorySelect(category)}
                                                >
                                                    <span className="pkg-dropdown-label">
                                                        {category === 'ALL' ? 'All Categories' : category}
                                                    </span>
                                                    {filterCategory === category && (
                                                        <span className="pkg-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ✅ NEW: Date Range Filter */}
                        <div className="pkg-filter-item">
                            <label>Date:</label>
                            <div className="pkg-date-group">
                                <input 
                                    type="date" 
                                    className="pkg-date-input"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    title="Start Date"
                                />
                                <span className="pkg-date-separator">-</span>
                                <input 
                                    type="date" 
                                    className="pkg-date-input"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    title="End Date"
                                />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="pkg-search-box">
                        <Search size={16} className="pkg-search-icon" /> 
                        <input
                            type="text"
                            className="pkg-search-input"
                            placeholder="Search title or destination..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PackageFilters;