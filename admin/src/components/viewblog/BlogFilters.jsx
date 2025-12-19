import React from 'react';
import { Search } from 'lucide-react';
import './BlogFilters.css'; 

const BlogFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterCategory, 
    setFilterCategory, 
    categoryOptions, 
    getFilterClassName 
}) => {
    return (
        <div className="bf-filter-card">
            <div className="bf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="bf-brand-label">
                    BLOG <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: Filter Buttons */}
                <div className="bf-filter-buttons">
                    {categoryOptions.map(category => (
                        <button
                            key={category}
                            className={`bf-filter-btn ${getFilterClassName(category)}`} 
                            onClick={() => setFilterCategory(category)}
                        >
                            {category === 'ALL' ? 'All Blogs' : category}
                        </button>
                    ))}
                </div>
                
                {/* ORDER 3: Search Box */}
                <div className="bf-search-box">
                    <Search size={18} className="bf-search-icon" /> 
                    <input
                        type="text"
                        className="bf-search-input"
                        placeholder="Search blog title or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default BlogFilters;