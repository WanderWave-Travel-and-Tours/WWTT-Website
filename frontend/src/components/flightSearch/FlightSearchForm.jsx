import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./FlightSearchForm.css";

// --- HELPERS ---
const getFlagUrl = (countryCode) => {
  if (!countryCode) return null;
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
};

const formatDate = (date) => {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString);
};

const FlightSearchForm = ({
  searchParams,
  setSearchParams,
  oneWayData,
  setOneWayData,
  roundTripData,
  setRoundTripData,
  multiCityLegs,
  originSearchTerm,
  destinationSearchTerm,
  handleAirportInputChange,
  handleSearch,
  swapCities,
  getTotalPassengers,
  originSuggestions,
  destinationSuggestions,
  airportSearchLoading,
  selectAirport,
  loading,
  multiCitySearchTerms,
  handleMultiCityAirportInputChange,
  handleMultiCityAirportFocus,
  activeMultiCityField,
  multiCitySuggestions,
  selectMultiCityAirport,
  handleMultiCityChange,
  removeMultiCityLeg,
  addMultiCityLeg,
  multiCityContainerRef
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Enhanced selectAirport that tracks full airport data locally for validation
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const formRef = useRef(null);
  const calendarRef = useRef(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentFlightSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = (field) => {
    setActiveDropdown(field);
  };

  const handleRangeChange = (dates) => {
    const [start, end] = dates;
    setRoundTripData({
        ...roundTripData,
        departureDate: start ? formatDate(start) : "",
        returnDate: end ? formatDate(end) : ""
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentFlightSearches');
  };

  // --- UPDATED LOGIC FOR RECENT SEARCH CLICK ---
  const handleRecentSearchClick = (search) => {
    // 1. Handle Origin
    if (search.origin) {
      setSelectedOrigin(search.origin); // Update local object
      selectAirport(search.origin, "origin"); // Update parent object
      // Force update the text input visually
      handleAirportInputChange("origin", `${search.origin.city} (${search.origin.iataCode})`);
    }

    // 2. Handle Destination
    if (search.destination) {
      setSelectedDestination(search.destination); // Update local object
      selectAirport(search.destination, "destination"); // Update parent object
      // Force update the text input visually
      handleAirportInputChange("destination", `${search.destination.city} (${search.destination.iataCode})`);
    }

    // 3. Handle Date (Important: Restore the date from history)
    if (search.date) {
        if (searchParams.journeyType === "round-trip") {
            setRoundTripData(prev => ({ ...prev, departureDate: search.date }));
        } else {
            setOneWayData(prev => ({ ...prev, departureDate: search.date }));
        }
    }

    setActiveDropdown(null);
  };

  const handleSignInClick = () => {
    setActiveDropdown(null);
    setShowSignInModal(true);
  };

  const handleAirportSelect = (airport, type) => {
    if (type === 'origin') {
      setSelectedOrigin(airport);
    } else {
      setSelectedDestination(airport);
    }
    selectAirport(airport, type);
    setActiveDropdown(null);
  };

  // Enhanced swap that also swaps selected airports
  const handleSwapCities = () => {
    const tempOrigin = selectedOrigin;
    const tempDest = selectedDestination;
    
    setSelectedOrigin(tempDest);
    setSelectedDestination(tempOrigin);
    
    swapCities();
  };

  // Save to recent searches when form is submitted
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Ensure we have data either from local state or passed props if manually typed correctly
    if (selectedOrigin && selectedDestination) {
      const newSearch = {
        origin: {
          city: selectedOrigin.city,
          iataCode: selectedOrigin.iataCode,
          country: selectedOrigin.country,
          countryCode: selectedOrigin.countryCode
        },
        destination: {
          city: selectedDestination.city,
          iataCode: selectedDestination.iataCode,
          country: selectedDestination.country,
          countryCode: selectedDestination.countryCode
        },
        date: oneWayData.departureDate || roundTripData.departureDate || new Date().toISOString().split('T')[0]
      };

      const existing = JSON.parse(localStorage.getItem('recentFlightSearches') || '[]');
      
      // Prevent duplicates based on IATA codes
      const isDuplicate = existing.some(search => 
        search.origin?.iataCode === newSearch.origin.iataCode &&
        search.destination?.iataCode === newSearch.destination.iataCode
      );

      if (!isDuplicate) {
        const updated = [newSearch, ...existing].slice(0, 5); // Keep last 5
        localStorage.setItem('recentFlightSearches', JSON.stringify(updated));
        setRecentSearches(updated);
      }
    }

    handleSearch(e);
  };

  return (
    <div className="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        
        <div className="hero-header">
          <img 
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
            alt="WanderWave Travel and Tours" 
            className="hero-logo"
            style={{ maxWidth: '180px', marginBottom: '10px' }}
          />
          <h1 className="retro-3d-title">FIND YOUR PERFECT FLIGHT</h1>
        </div>

        <div className="journey-tabs-container">
          {/* COMMENTED OUT "multi-city" FROM TABS ARRAY */}
          {["one-way", "round-trip" , "multi-city"].map((type) => (
            <button
              key={type}
              type="button"
              className={`tab-link ${searchParams.journeyType === type ? "active" : ""}`}
              onClick={() => {
                setSearchParams({ ...searchParams, journeyType: type });
                setActiveDropdown(null);
              }}
            >
              {type.replace("-", " ")} 
              {searchParams.journeyType === type && <span className="active-dot">•</span>}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flight-search-form" ref={formRef}>
          
          {(searchParams.journeyType === "one-way" || searchParams.journeyType === "round-trip") && (
            <div className="search-bar-wrapper">
              
              {/* LOCATIONS SECTION */}
              <div className="sb-section locations-section">
                
                {/* FROM */}
                <div className="sb-input-group relative">
                  <label className="sb-label">From</label>
                  <input 
                    type="text" 
                    className="sb-input-main"
                    placeholder="City or Airport"
                    value={originSearchTerm}
                    onChange={(e) => handleAirportInputChange("origin", e.target.value)}
                    onFocus={() => openDropdown("origin")}
                  />
                  {activeDropdown === "origin" && (
                    <div className="sb-dropdown">
                      {!originSearchTerm ? (
                        <div className="recent-searches-section">
                          {recentSearches.length > 0 && (
                            <>
                              <div className="recent-header">
                                <span className="recent-title">Recent Searches</span>
                                <button type="button" className="clear-btn" onClick={clearRecentSearches}>clear</button>
                              </div>
                              <div className="recent-list">
                                {recentSearches.map((search, idx) => (
                                  <div key={idx} className="recent-item" onClick={() => handleRecentSearchClick(search)}>
                                    <div className="recent-icon">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="10" r="3"></circle>
                                        <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"></path>
                                      </svg>
                                    </div>
                                    <div className="recent-details">
                                      <div className="recent-route">{search.origin?.city} ({search.origin?.iataCode}) - {search.destination?.city} ({search.destination?.iataCode})</div>
                                      <div className="recent-date">{search.date}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          <div className="sign-in-prompt" onClick={handleSignInClick}>
                            <div className="sign-in-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </div>
                            <div className="sign-in-text">
                              <div className="sign-in-title">Sign In / Sign Up</div>
                              <div className="sign-in-subtitle">Access your searches on any device</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dropdown-list custom-scrollbar">
                          {airportSearchLoading ? <div className="dd-msg">Searching...</div> : 
                          originSuggestions.length > 0 ? originSuggestions.map((airport, idx) => (
                              <div key={idx} className="dd-item" onClick={() => handleAirportSelect(airport, "origin")}>
                                {airport.countryCode && <img src={getFlagUrl(airport.countryCode)} alt="flag" className="dd-flag-rect" />}
                                <div className="dd-info">
                                  <div className="dd-city">{airport.city}, {airport.country}</div>
                                  <div className="dd-name">{airport.name}</div>
                                </div>
                                <div className="dd-code">{airport.iataCode}</div>
                              </div>
                          )) : <div className="dd-msg">No results found</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SWAP BUTTON */}
                <div className="swap-wrapper">
                  <button type="button" onClick={handleSwapCities} className="swap-btn" title="Swap Locations">
                      <svg className="swap-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 16L3 12M3 12L7 8M3 12H15M17 8L21 12M21 12L17 16M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </button>
                </div>

                {/* TO */}
                <div className="sb-input-group relative">
                  <label className="sb-label">To</label>
                  <input 
                    type="text" 
                    className="sb-input-main"
                    placeholder="City or Airport"
                    value={destinationSearchTerm}
                    onChange={(e) => handleAirportInputChange("destination", e.target.value)}
                    onFocus={() => openDropdown("destination")}
                  />
                  {activeDropdown === "destination" && (
                    <div className="sb-dropdown">
                      {!destinationSearchTerm ? (
                        <div className="recent-searches-section">
                          {recentSearches.length > 0 && (
                            <>
                              <div className="recent-header">
                                <span className="recent-title">Recent Searches</span>
                                <button type="button" className="clear-btn" onClick={clearRecentSearches}>clear</button>
                              </div>
                              <div className="recent-list">
                                {recentSearches.map((search, idx) => (
                                  <div key={idx} className="recent-item" onClick={() => handleRecentSearchClick(search)}>
                                    <div className="recent-icon">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="10" r="3"></circle>
                                        <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"></path>
                                      </svg>
                                    </div>
                                    <div className="recent-details">
                                      <div className="recent-route">{search.origin?.city} ({search.origin?.iataCode}) - {search.destination?.city} ({search.destination?.iataCode})</div>
                                      <div className="recent-date">{search.date}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          <div className="sign-in-prompt" onClick={handleSignInClick}>
                            <div className="sign-in-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </div>
                            <div className="sign-in-text">
                              <div className="sign-in-title">Sign In / Sign Up</div>
                              <div className="sign-in-subtitle">Access your searches on any device</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dropdown-list custom-scrollbar">
                          {airportSearchLoading ? <div className="dd-msg">Searching...</div> : 
                          destinationSuggestions.length > 0 ? destinationSuggestions.map((airport, idx) => (
                              <div key={idx} className="dd-item" onClick={() => handleAirportSelect(airport, "destination")}>
                                 {airport.countryCode && <img src={getFlagUrl(airport.countryCode)} alt="flag" className="dd-flag-rect" />}
                                 <div className="dd-info">
                                  <div className="dd-city">{airport.city}, {airport.country}</div>
                                  <div className="dd-name">{airport.name}</div>
                                </div>
                                <div className="dd-code">{airport.iataCode}</div>
                              </div>
                          )) : <div className="dd-msg">No results found</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="divider-vertical"></div>

              {/* DATES */}
              <div className="sb-section dates-section">
                {searchParams.journeyType === "one-way" && (
                  <div className="sb-input-group">
                    <label className="sb-label">Departure</label>
                    <div className="datepicker-container">
                      <DatePicker
                        selected={parseDate(oneWayData.departureDate)}
                        onChange={(date) => setOneWayData({ ...oneWayData, departureDate: formatDate(date) })}
                        minDate={new Date()}
                        monthsShown={2}
                        dateFormat="EEE, MMM d"
                        placeholderText="Select Date"
                        className="modern-date-input"
                        popperPlacement="bottom-start"
                      />
                    </div>
                  </div>
                )}
                {searchParams.journeyType === "round-trip" && (
                    <>
                      <div className="sb-input-group relative">
                        <label className="sb-label">Departure</label>
                        <div className="datepicker-container">
                            <DatePicker
                                ref={calendarRef}
                                selected={parseDate(roundTripData.departureDate)}
                                onChange={handleRangeChange}
                                startDate={parseDate(roundTripData.departureDate)}
                                endDate={parseDate(roundTripData.returnDate)}
                                selectsRange
                                minDate={new Date()}
                                monthsShown={2}
                                dateFormat="EEE, MMM d"
                                placeholderText="Select Date"
                                className="modern-date-input"
                                popperPlacement="bottom-start"
                                shouldCloseOnSelect={false}
                            />
                        </div>
                    </div>
                    <div className="divider-vertical mini"></div>
                    <div className="sb-input-group cursor-pointer" onClick={() => calendarRef.current?.setOpen(true)}>
                        <label className="sb-label">Return</label>
                        <div className="modern-date-input" style={{ paddingTop: '2px' }}>
                            {roundTripData.returnDate 
                                ? new Date(roundTripData.returnDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) 
                                : <span style={{color: '#9ca3af', fontWeight: 500}}>Select Date</span>
                            }
                        </div>
                    </div>
                   </>
                )}
              </div>

              <div className="divider-vertical"></div>

              {/* TRAVELERS */}
              <div className="sb-section travelers-section relative">
                <div className="sb-input-group cursor-pointer" onClick={() => openDropdown("passengers")}>
                  <label className="sb-label">Travelers & Class</label>
                  <div className="traveler-display">
                      <span className="t-count">{getTotalPassengers()}</span>
                      <div className="t-details">
                          <span className="t-text">Passenger{getTotalPassengers() !== 1 && "s"}</span>
                          <span className="t-class-badge">{searchParams.cabinType}</span>
                      </div>
                  </div>
                </div>
                {activeDropdown === "passengers" && (
                  <div className="sb-dropdown wide-dropdown modern-popup">
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                       {[{label: "Adults", sub: "12+ yrs", key: "adults"}, {label: "Children", sub: "2-11 yrs", key: "children"}, {label: "Infants", sub: "< 2 yrs", key: "infants"}].map((type) => (
                         <div className="p-row-modern" key={type.key}>
                            <div className="p-info"><span className="p-type-modern">{type.label}</span><span className="p-sub-modern">{type.sub}</span></div>
                            <div className="p-ctrl-modern">
                              <button type="button" className={`ctrl-btn ${parseInt(searchParams[type.key]) === 0 ? 'disabled' : ''}`} onClick={() => setSearchParams({ ...searchParams, [type.key]: Math.max(type.key === 'adults' ? 1 : 0, parseInt(searchParams[type.key]) - 1).toString() })}> − </button>
                              <span className="ctrl-val">{searchParams[type.key]}</span>
                              <button type="button" className="ctrl-btn" onClick={() => setSearchParams({ ...searchParams, [type.key]: (parseInt(searchParams[type.key]) + 1).toString() })}> + </button>
                            </div>
                         </div>
                       ))}
                       <div className="popup-divider"></div>
                       <div className="cabin-label">Cabin Class</div>
                       <div className="cabin-grid-modern">
                         {["Economy", "Premium Economy", "Business", "First"].map((c) => (
                           <button key={c} type="button" className={`cabin-btn-modern ${searchParams.cabinType === c ? 'active' : ''}`} onClick={() => setSearchParams({ ...searchParams, cabinType: c })}>{c}</button>
                         ))}
                       </div>
                       <div className="popup-action-full"><button type="button" className="done-btn-modern" onClick={() => setActiveDropdown(null)}>Done</button></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* MAIN SEARCH BUTTON */}
              <div className="search-btn-wrapper">
                <button type="submit" disabled={loading} className="main-search-btn">
                  SEARCH
                </button>
              </div>

            </div>
          )}

          {/* Multi-City UI - COMMENTED OUT TEMPORARILY */}
          {searchParams.journeyType === "multi-city" && (
            <div className="multi-city-container" ref={multiCityContainerRef}>
               {multiCityLegs.map((leg, index) => (
                 <div key={index} className="mc-row">
                    <div className="mc-flight-number">
                       Flight {index + 1}
                    </div>
                    
                    <div className="mc-fields-wrapper">
                        <div className="mc-input-group">
                            <label className="mc-label">From</label>
                            <div className="mc-field-box relative">
                                <input 
                                    type="text" 
                                    className="mc-input-field" 
                                    value={multiCitySearchTerms[index]?.origin || ""} 
                                    placeholder="Origin" 
                                    onChange={(e) => handleMultiCityAirportInputChange(index, "origin", e.target.value)} 
                                    onFocus={() => handleMultiCityAirportFocus(index, "origin")}
                                />
                                {activeMultiCityField && activeMultiCityField.legIndex === index && activeMultiCityField.field === "origin" && (
                                    <div className="sb-dropdown" style={{ top: '100%', left: 0, width: '100%', zIndex: 100 }}>
                                        <div className="dropdown-list custom-scrollbar">
                                            {airportSearchLoading ? <div className="dd-msg">Searching...</div> : 
                                            multiCitySuggestions.length > 0 ? multiCitySuggestions.map((airport, idx) => (
                                                <div key={idx} className="dd-item" onClick={() => selectMultiCityAirport(airport, index, "origin")}>
                                                    {airport.countryCode && <img src={getFlagUrl(airport.countryCode)} alt="flag" className="dd-flag-rect" />}
                                                    <div className="dd-info">
                                                        <div className="dd-city">{airport.city}, {airport.country}</div>
                                                        <div className="dd-name">{airport.name}</div>
                                                    </div>
                                                    <div className="dd-code">{airport.iataCode}</div>
                                                </div>
                                            )) : <div className="dd-msg">No results found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mc-connector">➝</div>

                        <div className="mc-input-group">
                            <label className="mc-label">To</label>
                            <div className="mc-field-box relative">
                                <input 
                                    type="text" 
                                    className="mc-input-field" 
                                    value={multiCitySearchTerms[index]?.destination || ""} 
                                    placeholder="Destination" 
                                    onChange={(e) => handleMultiCityAirportInputChange(index, "destination", e.target.value)}
                                    onFocus={() => handleMultiCityAirportFocus(index, "destination")} 
                                />
                                {activeMultiCityField && activeMultiCityField.legIndex === index && activeMultiCityField.field === "destination" && (
                                    <div className="sb-dropdown" style={{ top: '100%', left: 0, width: '100%', zIndex: 100 }}>
                                        <div className="dropdown-list custom-scrollbar">
                                            {airportSearchLoading ? <div className="dd-msg">Searching...</div> : 
                                            multiCitySuggestions.length > 0 ? multiCitySuggestions.map((airport, idx) => (
                                                <div key={idx} className="dd-item" onClick={() => selectMultiCityAirport(airport, index, "destination")}>
                                                    {airport.countryCode && <img src={getFlagUrl(airport.countryCode)} alt="flag" className="dd-flag-rect" />}
                                                    <div className="dd-info">
                                                        <div className="dd-city">{airport.city}, {airport.country}</div>
                                                        <div className="dd-name">{airport.name}</div>
                                                    </div>
                                                    <div className="dd-code">{airport.iataCode}</div>
                                                </div>
                                            )) : <div className="dd-msg">No results found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mc-input-group date-group">
                            <label className="mc-label">Date</label>
                            <div className="mc-field-box">
                                <DatePicker 
                                    selected={parseDate(leg.departureDate)} 
                                    onChange={(date) => handleMultiCityChange(index, "departureDate", formatDate(date))} 
                                    minDate={new Date()} 
                                    placeholderText="Select Date" 
                                    className="mc-date-input" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mc-action-cell">
                        {index >= 2 && (
                            <button type="button" className="mc-remove-btn" onClick={() => removeMultiCityLeg(index)} title="Remove Flight">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        )}
                    </div>
                 </div>
               ))}
               
               <div className="mc-footer-actions">
                    <button type="button" className="mc-add-btn" onClick={addMultiCityLeg}>
                        <span className="plus-icon">+</span> Add Flight
                    </button>

                    <button type="submit" className="main-search-btn fit-width">
                        SEARCH FLIGHTS
                    </button>
               </div>
            </div>
          )}
        </form>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="modal-overlay" onClick={() => setShowSignInModal(false)}>
          <div className="sign-in-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignInModal(false)}>×</button>
            <h2 className="modal-title">See your recent searches on any device.</h2>
            <p className="modal-subtitle">Sign in to keep track of your searches and get right back to them in one click.</p>
            <button className="sign-in-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightSearchForm;