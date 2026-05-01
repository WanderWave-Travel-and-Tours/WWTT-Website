import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './TransferFilters.css';

const TransferFilters = ({
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    categories,
    filterType,
    setFilterType,
}) => {
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isTypeOpen, setIsTypeOpen] = useState(false);

    const transferTypes = ['ALL', 'oneway', 'roundtrip'];

    const handleCategorySelect = (category) => {
        setFilterCategory(category);
        setIsCategoryOpen(false);
    };

    const handleTypeSelect = (type) => {
        setFilterType(type);
        setIsTypeOpen(false);
    };

    const getCategoryLabel = () => {
        if (filterCategory === 'ALL') return 'All Categories';
        return filterCategory;
    };

    const getTypeLabel = () => {
        if (filterType === 'ALL') return 'All Types';
        if (filterType === 'oneway') return 'One Way';
        if (filterType === 'roundtrip') return 'Roundtrip';
        return filterType;
    };

    const typeDisplayMap = {
        ALL: 'All Types',
        oneway: 'One Way',
        roundtrip: 'Roundtrip',
    };

    return (
        <div className="txf-filter-card">
            <div className="txf-filter-wrapper">

                {/* LEFT: Branding */}
                <div className="txf-brand-section">
                    <div className="txf-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="txf-brand-label">
                        TRANSFER <span>FILTERS</span>
                    </div>
                </div>

                <div className="txf-controls-group">
                    <div className="txf-filters-row">

                        {/* Category Dropdown */}
                        <div className="txf-filter-item">
                            <label>Category:</label>
                            <div className="txf-select-wrapper">
                                <button
                                    className="txf-select-btn"
                                    onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsTypeOpen(false); }}
                                >
                                    <span className="txf-select-label">{getCategoryLabel()}</span>
                                    <ChevronDown
                                        size={14}
                                        className={`txf-select-icon ${isCategoryOpen ? 'txf-select-icon--open' : ''}`}
                                    />
                                </button>
                                {isCategoryOpen && (
                                    <>
                                        <div className="txf-dropdown-overlay" onClick={() => setIsCategoryOpen(false)} />
                                        <div className="txf-dropdown-menu">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    className={`txf-dropdown-item ${filterCategory === category ? 'txf-dropdown-item--active' : ''}`}
                                                    onClick={() => handleCategorySelect(category)}
                                                >
                                                    <span className="txf-dropdown-label">
                                                        {category === 'ALL' ? 'All Categories' : category}
                                                    </span>
                                                    {filterCategory === category && (
                                                        <span className="txf-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Transfer Type Dropdown */}
                        <div className="txf-filter-item">
                            <label>Type:</label>
                            <div className="txf-select-wrapper">
                                <button
                                    className="txf-select-btn"
                                    onClick={() => { setIsTypeOpen(!isTypeOpen); setIsCategoryOpen(false); }}
                                >
                                    <span className="txf-select-label">{getTypeLabel()}</span>
                                    <ChevronDown
                                        size={14}
                                        className={`txf-select-icon ${isTypeOpen ? 'txf-select-icon--open' : ''}`}
                                    />
                                </button>
                                {isTypeOpen && (
                                    <>
                                        <div className="txf-dropdown-overlay" onClick={() => setIsTypeOpen(false)} />
                                        <div className="txf-dropdown-menu">
                                            {transferTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    className={`txf-dropdown-item ${filterType === type ? 'txf-dropdown-item--active' : ''}`}
                                                    onClick={() => handleTypeSelect(type)}
                                                >
                                                    <span className="txf-dropdown-label">{typeDisplayMap[type]}</span>
                                                    {filterType === type && (
                                                        <span className="txf-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="txf-search-box">
                        <Search size={16} className="txf-search-icon" />
                        <input
                            type="text"
                            className="txf-search-input"
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

export default TransferFilters;
