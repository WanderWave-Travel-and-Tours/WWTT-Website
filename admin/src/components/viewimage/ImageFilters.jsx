import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './ImageFilters.css';

const ImageFilters = ({ 
    searchTerm, 
    setSearchTerm,
    filterFileType,
    setFilterFileType,
    fileTypeOptions
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleFileTypeSelect = (type) => {
        setFilterFileType(type);
        setIsDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterFileType === 'ALL') return 'All Images';
        return filterFileType;
    };

    return (
        <div className="image-filter-card">
            <div className="image-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="image-brand-section">
                    <div className="image-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="image-brand-label">
                        IMAGE <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="image-controls-group">
                    {/* MIDDLE: File Type Dropdown */}
                    <div className="image-filter-container">
                        <label>Type:</label>
                        <div className="image-select-wrapper">
                            <button 
                                className="image-select-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="image-select-label">{getSelectedLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`image-select-icon ${isDropdownOpen ? 'image-select-icon--open' : ''}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div 
                                        className="image-dropdown-overlay" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="image-dropdown-menu">
                                        {fileTypeOptions.map((type) => (
                                            <button
                                                key={type}
                                                className={`image-dropdown-item ${
                                                    filterFileType === type ? 'image-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleFileTypeSelect(type)}
                                            >
                                                <span className="image-dropdown-label">
                                                    {type === 'ALL' ? 'All Images' : type}
                                                </span>
                                                {filterFileType === type && (
                                                    <span className="image-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="image-search-box">
                        <Search size={16} className="image-search-icon" /> 
                        <input
                            type="text"
                            className="image-search-input"
                            placeholder="Search image name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageFilters;