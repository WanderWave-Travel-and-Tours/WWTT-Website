import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './TourFilters.css';

const TourFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterCategory, 
    setFilterCategory, 
    categories,
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
        if (filterCategory === 'ALL') return 'All Tours';
        return filterCategory;
    };

    return (
        <div className="tour-filter-card">
            <div className="tour-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="tour-brand-section">
                    <div className="tour-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="tour-brand-label">
                        TOUR <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="tour-controls-group">
                    {/* MIDDLE: Filters */}
                    <div className="tour-filters-row">
                        
                        {/* Category Dropdown */}
                        <div className="tour-filter-item">
                            <label>Category:</label>
                            <div className="tour-select-wrapper">
                                <button 
                                    className="tour-select-btn"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className="tour-select-label">{getSelectedLabel()}</span>
                                    <ChevronDown 
                                        size={14} 
                                        className={`tour-select-icon ${isDropdownOpen ? 'tour-select-icon--open' : ''}`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div 
                                            className="tour-dropdown-overlay" 
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                        <div className="tour-dropdown-menu">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    className={`tour-dropdown-item ${
                                                        filterCategory === category ? 'tour-dropdown-item--active' : ''
                                                    }`}
                                                    onClick={() => handleCategorySelect(category)}
                                                >
                                                    <span className="tour-dropdown-label">
                                                        {category === 'ALL' ? 'All Tours' : category}
                                                    </span>
                                                    {filterCategory === category && (
                                                        <span className="tour-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ✅ NEW: Date Range Filter Inputs */}
                        <div className="tour-filter-item">
                            <label>Date:</label>
                            <div className="tour-date-group">
                                <input 
                                    type="date" 
                                    className="tour-date-input"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    title="Start Date"
                                />
                                <span className="tour-date-separator">-</span>
                                <input 
                                    type="date" 
                                    className="tour-date-input"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    title="End Date"
                                />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="tour-search-box">
                        <Search size={16} className="tour-search-icon" /> 
                        <input
                            type="text"
                            className="tour-search-input"
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

export default TourFilters;