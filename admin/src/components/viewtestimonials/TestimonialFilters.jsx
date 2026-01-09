import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './TestimonialFilters.css';

const TestimonialFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterSource, 
    setFilterSource, 
    sourceOptions
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSourceSelect = (source) => {
        setFilterSource(source);
        setIsDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterSource === 'ALL') return 'All Sources';
        return filterSource;
    };

    return (
        <div className="testimonial-filter-card">
            <div className="testimonial-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="testimonial-brand-section">
                    <div className="testimonial-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="testimonial-brand-label">
                        TESTIMONIAL <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="testimonial-controls-group">
                    {/* MIDDLE: Source Dropdown */}
                    <div className="testimonial-filter-container">
                        <label>Source:</label>
                        <div className="testimonial-select-wrapper">
                            <button 
                                className="testimonial-select-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="testimonial-select-label">{getSelectedLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`testimonial-select-icon ${isDropdownOpen ? 'testimonial-select-icon--open' : ''}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div 
                                        className="testimonial-dropdown-overlay" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="testimonial-dropdown-menu">
                                        {sourceOptions.map((source) => (
                                            <button
                                                key={source}
                                                className={`testimonial-dropdown-item ${
                                                    filterSource === source ? 'testimonial-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleSourceSelect(source)}
                                            >
                                                <span className="testimonial-dropdown-label">
                                                    {source === 'ALL' ? 'All Sources' : source}
                                                </span>
                                                {filterSource === source && (
                                                    <span className="testimonial-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="testimonial-search-box">
                        <Search size={16} className="testimonial-search-icon" /> 
                        <input
                            type="text"
                            className="testimonial-search-input"
                            placeholder="Search name or feedback..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TestimonialFilters;