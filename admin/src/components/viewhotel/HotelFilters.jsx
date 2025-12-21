import React from 'react';
import { Search, Hotel } from 'lucide-react';
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
    return (
        <div className="hf-filter-card">
            <div className="hf-filter-wrapper">
                
                {/* ORDER 1: Branding Label */}
                <div className="hf-brand-label">
                    <Hotel size={20} style={{marginRight: '8px', color: '#64748b'}}/>
                    HOTEL <span>FILTERS</span>
                </div>
                
                {/* ORDER 2: City Filter Dropdown */}
                <div className="hf-select-group">
                    <label htmlFor="city-select" className="hf-select-label">City:</label>
                    <select
                        id="city-select"
                        className="hf-filter-select"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                    >
                        {cityOptions.map(city => (
                            <option key={city} value={city}>
                                {city === 'ALL' ? 'All Cities' : city}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* ORDER 3: Status Filter Dropdown */}
                <div className="hf-select-group">
                    <label htmlFor="status-select" className="hf-select-label">Status:</label>
                    <select
                        id="status-select"
                        className="hf-filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status === 'ALL' ? 'All Status' : status}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* ORDER 4: Search Box */}
                <div className="hf-search-box">
                    <Search size={18} className="hf-search-icon" /> 
                    <input
                        type="text"
                        className="hf-search-input"
                        placeholder="Search hotel name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default HotelFilters;