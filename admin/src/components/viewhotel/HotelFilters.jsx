import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import './HotelFilters.css';

const HotelFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterCity, 
    setFilterCity, 
    filterStatus,
    setFilterStatus,
    cityOptions,
    statusOptions
}) => {
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const handleCitySelect = (city) => {
        setFilterCity(city);
        setIsCityDropdownOpen(false);
    };

    const handleStatusSelect = (status) => {
        setFilterStatus(status);
        setIsStatusDropdownOpen(false);
    };

    const getCityLabel = () => {
        if (filterCity === 'ALL') return 'All Cities';
        return filterCity;
    };

    const getStatusLabel = () => {
        if (filterStatus === 'ALL') return 'All Status';
        return filterStatus;
    };

    return (
        <div className="hotel-filter-card">
            <div className="hotel-filter-wrapper">
                
                {/* LEFT: Branding */}
                <div className="hotel-brand-section">
                    <div className="hotel-brand-icon">
                        <Filter size={18} strokeWidth={2.5} />
                    </div>
                    <div className="hotel-brand-label">
                        HOTEL <span>FILTERS</span>
                    </div>
                </div>
                
                <div className="hotel-controls-group">
                    {/* MIDDLE LEFT: City Dropdown */}
                    <div className="hotel-filter-container">
                        <label>City:</label>
                        <div className="hotel-select-wrapper">
                            <button 
                                className="hotel-select-btn"
                                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                            >
                                <span className="hotel-select-label">{getCityLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`hotel-select-icon ${isCityDropdownOpen ? 'hotel-select-icon--open' : ''}`}
                                />
                            </button>

                            {isCityDropdownOpen && (
                                <>
                                    <div 
                                        className="hotel-dropdown-overlay" 
                                        onClick={() => setIsCityDropdownOpen(false)}
                                    />
                                    <div className="hotel-dropdown-menu">
                                        {cityOptions.map((city) => (
                                            <button
                                                key={city}
                                                className={`hotel-dropdown-item ${
                                                    filterCity === city ? 'hotel-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleCitySelect(city)}
                                            >
                                                <span className="hotel-dropdown-label">
                                                    {city === 'ALL' ? 'All Cities' : city}
                                                </span>
                                                {filterCity === city && (
                                                    <span className="hotel-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* MIDDLE RIGHT: Status Dropdown */}
                    <div className="hotel-filter-container">
                        <label>Status:</label>
                        <div className="hotel-select-wrapper">
                            <button 
                                className="hotel-select-btn"
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            >
                                <span className="hotel-select-label">{getStatusLabel()}</span>
                                <ChevronDown 
                                    size={14} 
                                    className={`hotel-select-icon ${isStatusDropdownOpen ? 'hotel-select-icon--open' : ''}`}
                                />
                            </button>

                            {isStatusDropdownOpen && (
                                <>
                                    <div 
                                        className="hotel-dropdown-overlay" 
                                        onClick={() => setIsStatusDropdownOpen(false)}
                                    />
                                    <div className="hotel-dropdown-menu">
                                        {statusOptions.map((status) => (
                                            <button
                                                key={status}
                                                className={`hotel-dropdown-item ${
                                                    filterStatus === status ? 'hotel-dropdown-item--active' : ''
                                                }`}
                                                onClick={() => handleStatusSelect(status)}
                                            >
                                                <span className="hotel-dropdown-label">
                                                    {status === 'ALL' ? 'All Status' : status}
                                                </span>
                                                {filterStatus === status && (
                                                    <span className="hotel-dropdown-check">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Search Box */}
                    <div className="hotel-search-box">
                        <Search size={16} className="hotel-search-icon" /> 
                        <input
                            type="text"
                            className="hotel-search-input"
                            placeholder="Search hotel name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HotelFilters;