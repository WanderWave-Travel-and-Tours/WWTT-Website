import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './PosterFilters.css';

const PosterFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus, 
    statusOptions
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleStatusSelect = (status) => {
        setFilterStatus(status);
        setIsDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterStatus === 'ALL') return 'All Posters';
        return filterStatus;
    };

    return (
        <div className="poster-filter-card">
            <div className="poster-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="poster-brand-section">
                    <div className="poster-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="poster-brand-label">
                        POSTER <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="poster-controls-group">
                    {/* MIDDLE: Status Dropdown */}
                    <div className="poster-filter-container">
                        <label>Status:</label>
                        <div className="poster-select-wrapper">
                            <button 
                                className="poster-select-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="poster-select-label">{getSelectedLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`poster-select-icon ${isDropdownOpen ? 'poster-select-icon--open' : ''}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div 
                                        className="poster-dropdown-overlay" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="poster-dropdown-menu">
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                className={`poster-dropdown-item ${
                                                    filterStatus === status ? 'poster-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleStatusSelect(status)}
                                            >
                                                <span className="poster-dropdown-label">
                                                    {status === 'ALL' ? 'All Posters' : status}
                                                </span>
                                                {filterStatus === status && (
                                                    <span className="poster-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="poster-search-box">
                        <Search size={16} className="poster-search-icon" /> 
                        <input
                            type="text"
                            className="poster-search-input"
                            placeholder="Search poster title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PosterFilters;