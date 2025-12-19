import React from 'react';
import { Search } from 'lucide-react';
import './ImageFilters.css'; 

const ImageFilters = ({ 
    searchTerm, 
    setSearchTerm,
    filterFileType,
    setFilterFileType,
    fileTypeOptions,
    getFilterClassName
}) => {
    return (
        <div className="if-filter-card">
            <div className="if-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="if-brand-label">
                    IMAGE <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="if-filter-buttons">
                    {fileTypeOptions.map(type => (
                        <button
                            key={type}
                            className={`if-filter-btn ${getFilterClassName(type)}`} 
                            onClick={() => setFilterFileType(type)}
                        >
                            {type === 'ALL' ? 'All Images' : type}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="if-search-box">
                    <Search size={18} className="if-search-icon" /> 
                    <input
                        type="text"
                        className="if-search-input"
                        placeholder="Search image name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageFilters;