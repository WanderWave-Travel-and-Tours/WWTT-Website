import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './BlogFilters.css';

const BlogFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterCategory, 
    setFilterCategory, 
    categoryOptions
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCategorySelect = (category) => {
        setFilterCategory(category);
        setIsDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterCategory === 'ALL') return 'All Blogs';
        return filterCategory;
    };

    return (
        <div className="blog-filter-card">
            <div className="blog-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="blog-brand-section">
                    <div className="blog-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="blog-brand-label">
                        BLOG <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="blog-controls-group">
                    {/* MIDDLE: Category Dropdown */}
                    <div className="blog-filter-container">
                        <label>Category:</label>
                        <div className="blog-select-wrapper">
                            <button 
                                className="blog-select-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="blog-select-label">{getSelectedLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`blog-select-icon ${isDropdownOpen ? 'blog-select-icon--open' : ''}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div 
                                        className="blog-dropdown-overlay" 
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="blog-dropdown-menu">
                                        {categoryOptions.map((category) => (
                                            <button
                                                key={category}
                                                className={`blog-dropdown-item ${
                                                    filterCategory === category ? 'blog-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleCategorySelect(category)}
                                            >
                                                <span className="blog-dropdown-label">
                                                    {category === 'ALL' ? 'All Blogs' : category}
                                                </span>
                                                {filterCategory === category && (
                                                    <span className="blog-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="blog-search-box">
                        <Search size={16} className="blog-search-icon" /> 
                        <input
                            type="text"
                            className="blog-search-input"
                            placeholder="Search blog title or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlogFilters;