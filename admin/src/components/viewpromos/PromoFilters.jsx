import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './PromoFilters.css';

const PromoFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterStatus, 
    setFilterStatus, 
    statusOptions,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    filterType,
    setFilterType
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

    const typeOptions = ['ALL', 'promo', 'voucher'];

    const handleStatusSelect = (status) => {
        setFilterStatus(status);
        setIsDropdownOpen(false);
    };

    const handleTypeSelect = (type) => {
        setFilterType(type);
        setIsTypeDropdownOpen(false);
    };

    const getSelectedLabel = () => {
        if (filterStatus === 'ALL') return 'All Promos';
        return filterStatus;
    };

    const getTypeLabel = () => {
        if (!filterType || filterType === 'ALL') return 'All Types';
        if (filterType === 'promo') return '🎟️ Promo';
        if (filterType === 'voucher') return '🎫 Voucher';
        return filterType;
    };

    return (
        <div className="promo-filter-card">
            <div className="promo-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="promo-brand-section">
                    <div className="promo-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="promo-brand-label">
                        PROMO <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="promo-controls-group">
                    {/* MIDDLE: Filters */}
                    <div className="promo-filters-row">
                        
                        {/* Status Dropdown */}
                        <div className="promo-filter-item">
                            <label>Status:</label>
                            <div className="promo-select-wrapper">
                                <button 
                                    className="promo-select-btn"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className="promo-select-label">{getSelectedLabel()}</span>
                                    <ChevronDown 
                                        size={14} 
                                        className={`promo-select-icon ${isDropdownOpen ? 'promo-select-icon--open' : ''}`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div 
                                            className="promo-dropdown-overlay" 
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                        <div className="promo-dropdown-menu">
                                            {statusOptions.map((status) => (
                                                <button
                                                    key={status}
                                                    className={`promo-dropdown-item ${
                                                        filterStatus === status ? 'promo-dropdown-item--active' : ''
                                                    }`}
                                                    onClick={() => handleStatusSelect(status)}
                                                >
                                                    <span className="promo-dropdown-label">
                                                        {status === 'ALL' ? 'All Promos' : status}
                                                    </span>
                                                    {filterStatus === status && (
                                                        <span className="promo-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ✅ NEW: Type Dropdown (Promo vs Voucher) */}
                        <div className="promo-filter-item">
                            <label>Type:</label>
                            <div className="promo-select-wrapper">
                                <button
                                    className="promo-select-btn"
                                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                >
                                    <span className="promo-select-label">{getTypeLabel()}</span>
                                    <ChevronDown
                                        size={14}
                                        className={`promo-select-icon ${isTypeDropdownOpen ? 'promo-select-icon--open' : ''}`}
                                    />
                                </button>

                                {isTypeDropdownOpen && (
                                    <>
                                        <div
                                            className="promo-dropdown-overlay"
                                            onClick={() => setIsTypeDropdownOpen(false)}
                                        />
                                        <div className="promo-dropdown-menu">
                                            {typeOptions.map((type) => (
                                                <button
                                                    key={type}
                                                    className={`promo-dropdown-item ${
                                                        (filterType || 'ALL') === type ? 'promo-dropdown-item--active' : ''
                                                    }`}
                                                    onClick={() => handleTypeSelect(type)}
                                                >
                                                    <span className="promo-dropdown-label">
                                                        {type === 'ALL' ? 'All Types' : type === 'promo' ? '🎟️ Promo' : '🎫 Voucher'}
                                                    </span>
                                                    {(filterType || 'ALL') === type && (
                                                        <span className="promo-dropdown-check">✓</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ✅ NEW: Date Range Filter */}
                        <div className="promo-filter-item">
                            <label>Date:</label>
                            <div className="promo-date-group">
                                <input 
                                    type="date" 
                                    className="promo-date-input"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    title="Start Date"
                                />
                                <span className="promo-date-separator">-</span>
                                <input 
                                    type="date" 
                                    className="promo-date-input"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    title="End Date"
                                />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="promo-search-box">
                        <Search size={16} className="promo-search-icon" /> 
                        <input
                            type="text"
                            className="promo-search-input"
                            placeholder="Search by code or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PromoFilters;