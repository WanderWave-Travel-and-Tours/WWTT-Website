import React from 'react';
import { Search, Archive as ArchiveIcon } from 'lucide-react';
import './ArchiveFilters.css'; 

const ArchiveFilters = ({ 
    searchTerm, 
    setSearchTerm, 
    filterType,       
    setFilterType,    
    filterSubtype,    
    setFilterSubtype, 
    filterListSubtype,    
    setFilterListSubtype,
    filterUserSubtype,
    setFilterUserSubtype,
    typeOptions,      
    serviceSubtypes,  
    listSubtypes,
    userSubtypes
}) => {
  
  const isListFilterActive = filterType === 'Archived List';
  const isServiceFilterActive = filterType === 'Archived Services';
  const isUserFilterActive = filterType === 'Archived Users';

  // Conditional values for the Subtype Dropdown
  let currentSubtypeValue, currentSubtypeSetter, currentSubtypeOptions, currentSubtypeLabel;
  
  if (isListFilterActive) {
    currentSubtypeValue = filterListSubtype;
    currentSubtypeSetter = setFilterListSubtype;
    currentSubtypeOptions = listSubtypes;
    currentSubtypeLabel = 'Item Type:';
  } else if (isServiceFilterActive) {
    currentSubtypeValue = filterSubtype;
    currentSubtypeSetter = setFilterSubtype;
    currentSubtypeOptions = serviceSubtypes;
    currentSubtypeLabel = 'Service:';
  } else if (isUserFilterActive) {
    currentSubtypeValue = filterUserSubtype;
    currentSubtypeSetter = setFilterUserSubtype;
    currentSubtypeOptions = userSubtypes;
    currentSubtypeLabel = 'User Type:';
  }

  const showSubtypeDropdown = isListFilterActive || isServiceFilterActive || isUserFilterActive;
  
  return (
    <div className="arc-filter-card">
      <div className="arc-filter-wrapper">
        
        {/* ORDER 1: Branding Label (LEFT CORNER) */}
        <div className="arc-brand-label"> 
            <ArchiveIcon size={20} style={{marginRight: '8px', color: '#64748b'}}/> ARCHIVE <span>FILTERS</span>
        </div>
        
        {/* ORDER 2: Main Type Filter (Dropdown: List, Services, or Users) */}
        <div className="arc-select-group type-filter">
            <label htmlFor="type-select" className="arc-select-label">Archive Type:</label>
            <select
                id="type-select"
                className="arc-filter-select"
                value={filterType}
                // Reset subtypes when main type changes
                onChange={(e) => { 
                    setFilterType(e.target.value); 
                    setFilterSubtype('ALL Services');
                    setFilterListSubtype('ALL List Items');
                    setFilterUserSubtype('ALL Users');
                }}
            >
                {typeOptions.map(type => (
                    <option key={type} value={type}>
                        {type === 'ALL' ? 'ALL ARCHIVE ITEMS' : type}
                    </option>
                ))}
            </select>
        </div>
        
        {/* ORDER 3: CONDITIONAL DROPDOWN: Sub-Type (List, Services, or Users) */}
        {showSubtypeDropdown && (
            <div className="arc-select-group subtype-filter">
                <label htmlFor="subtype-select" className="arc-select-label">{currentSubtypeLabel}</label>
                <select
                    id="subtype-select"
                    className="arc-filter-select"
                    value={currentSubtypeValue}
                    onChange={(e) => currentSubtypeSetter(e.target.value)}
                >
                    {currentSubtypeOptions.map(subtype => (
                        <option key={subtype} value={subtype}>
                            {subtype}
                        </option>
                    ))}
                </select>
            </div>
        )}
        
        {/* ORDER 4: SEARCH BOX - Pushed to the right */}
        <div className="arc-search-box">
          <Search size={18} className="arc-search-icon" /> 
          <input
            type="text"
            className="arc-search-input"
            placeholder="Search by name, ID, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
      </div>
    </div>
  );
};

export default ArchiveFilters;