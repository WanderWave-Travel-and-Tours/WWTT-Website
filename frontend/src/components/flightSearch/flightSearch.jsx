import { useState } from 'react';
import axios from 'axios';
import './FlightSearch.css';

function FlightSearch() {
  const [searchParams, setSearchParams] = useState({
    journeyType: 'one-way',
    adults: '1',
    children: '0',
    infants: '0',
    cabinType: 'Economy',
    preferredAirline: ''
  });

  const [oneWayData, setOneWayData] = useState({
    origin: 'MNL',
    destination: '',
    departureDate: getTomorrowDate()
  });

  const [roundTripData, setRoundTripData] = useState({
    origin: 'MNL',
    destination: '',
    departureDate: getTomorrowDate(),
    returnDate: getNextWeekDate()
  });

  const [multiCityLegs, setMultiCityLegs] = useState([
    { origin: 'MNL', destination: '', departureDate: getTomorrowDate() },
    { origin: '', destination: 'MNL', departureDate: getNextWeekDate() }
  ]);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);
  const [showPassengers, setShowPassengers] = useState(false);
  const [showCabin, setShowCabin] = useState(false);

  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  function getNextWeekDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearchInfo(null);

    let searchData = {};
    if (searchParams.journeyType === 'one-way') {
      if (!oneWayData.origin || !oneWayData.destination) {
        setError('Please enter origin and destination');
        setLoading(false);
        return;
      }
      searchData = {
        origin: oneWayData.origin,
        destination: oneWayData.destination,
        departureDate: oneWayData.departureDate
      };
    } else if (searchParams.journeyType === 'round-trip') {
      if (!roundTripData.origin || !roundTripData.destination) {
        setError('Please enter origin and destination');
        setLoading(false);
        return;
      }
      if (!roundTripData.returnDate) {
        setError('Please select return date');
        setLoading(false);
        return;
      }
      searchData = {
        origin: roundTripData.origin,
        destination: roundTripData.destination,
        departureDate: roundTripData.departureDate,
        returnDate: roundTripData.returnDate
      };
    } else if (searchParams.journeyType === 'multi-city') {
      for (let leg of multiCityLegs) {
        if (!leg.origin || !leg.destination) {
          setError('Please complete all flight legs');
          setLoading(false);
          return;
        }
      }
      searchData = { legs: multiCityLegs };
    }

    try {
      const response = await axios.get('http://localhost:5000/api/flights/search-prices-amadeus-only', {
        params: {
          ...searchData,
          adults: searchParams.adults
        }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setFlights(response.data.data);
        setSearchInfo({
          count: response.data.count,
          source: response.data.source,
          disclaimer: response.data.priceDisclaimer,
          routeInfo: response.data.routeInfo,
          pricingInfo: response.data.pricingInfo
        });
        
        if (response.data.data.length === 0) {
          setError(response.data.message || 'No flights found');
        }
      } else {
        setError(response.data.message || 'Search failed');
        if (response.data.suggestions) {
          console.log('Suggestions:', response.data.suggestions);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to search flights. Please try again.';
      setError(errorMessage);
      console.error('Search error:', err);
      
      if (err.response?.data?.fallback) {
        console.log('Fallback options:', err.response.data.fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handleOneWayChange = (e) => {
    const { name, value } = e.target;
    const newValue = (name === 'origin' || name === 'destination') ? value.toUpperCase() : value;
    setOneWayData({ ...oneWayData, [name]: newValue });
  };

  const handleRoundTripChange = (e) => {
    const { name, value } = e.target;
    const newValue = (name === 'origin' || name === 'destination') ? value.toUpperCase() : value;
    setRoundTripData({ ...roundTripData, [name]: newValue });
  };

  const handleMultiCityChange = (index, field, value) => {
    const newLegs = [...multiCityLegs];
    const newValue = (field === 'origin' || field === 'destination') ? value.toUpperCase() : value;
    newLegs[index][field] = newValue;
    setMultiCityLegs(newLegs);
  };

  const addMultiCityLeg = () => {
    setMultiCityLegs([...multiCityLegs, { origin: '', destination: '', departureDate: getTomorrowDate() }]);
  };

  const removeMultiCityLeg = (index) => {
    if (multiCityLegs.length > 2) {
      const newLegs = multiCityLegs.filter((_, i) => i !== index);
      setMultiCityLegs(newLegs);
    }
  };

  const swapCities = () => {
    if (searchParams.journeyType === 'one-way') {
      setOneWayData({
        ...oneWayData,
        origin: oneWayData.destination,
        destination: oneWayData.origin
      });
    } else if (searchParams.journeyType === 'round-trip') {
      setRoundTripData({
        ...roundTripData,
        origin: roundTripData.destination,
        destination: roundTripData.origin
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTotalPassengers = () => {
    return parseInt(searchParams.adults) + parseInt(searchParams.children) + parseInt(searchParams.infants);
  };

  return (
    <div className="flight-search-container">
      <div className="search-wrapper">
        <div className="search-card">
          <div className="journey-type-row">
            <div className="button-group">
              <button
                type="button"
                className={`journey-btn ${searchParams.journeyType === 'one-way' ? 'active' : ''}`}
                onClick={() => setSearchParams({ ...searchParams, journeyType: 'one-way' })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                One way
              </button>
              <button
                type="button"
                className={`journey-btn ${searchParams.journeyType === 'round-trip' ? 'active' : ''}`}
                onClick={() => setSearchParams({ ...searchParams, journeyType: 'round-trip' })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h18M3 17h18M7 3l-4 4 4 4M17 13l4 4-4 4"/>
                </svg>
                Round trip
              </button>
              <button
                type="button"
                className={`journey-btn ${searchParams.journeyType === 'multi-city' ? 'active' : ''}`}
                onClick={() => setSearchParams({ ...searchParams, journeyType: 'multi-city' })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m6.36 6.36l4.24 4.24"/>
                </svg>
                Multi-city
              </button>
            </div>

            <div className="options-row">
              <div className="dropdown-wrapper">
                <button
                  type="button"
                  className="dropdown-btn"
                  onClick={() => setShowPassengers(!showPassengers)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {getTotalPassengers()}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {showPassengers && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item">
                      <div>
                        <div className="dropdown-label">Adults</div>
                        <div className="dropdown-sublabel">Aged 12+</div>
                      </div>
                      <div className="counter">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            adults: Math.max(1, parseInt(searchParams.adults) - 1).toString() 
                          })}
                          disabled={parseInt(searchParams.adults) <= 1}
                        >
                          −
                        </button>
                        <span className="counter-value">{searchParams.adults}</span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            adults: Math.min(9, parseInt(searchParams.adults) + 1).toString() 
                          })}
                          disabled={parseInt(searchParams.adults) >= 9}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="dropdown-item">
                      <div>
                        <div className="dropdown-label">Children</div>
                        <div className="dropdown-sublabel">Aged 2-11</div>
                      </div>
                      <div className="counter">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            children: Math.max(0, parseInt(searchParams.children) - 1).toString() 
                          })}
                          disabled={parseInt(searchParams.children) <= 0}
                        >
                          −
                        </button>
                        <span className="counter-value">{searchParams.children}</span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            children: (parseInt(searchParams.children) + 1).toString() 
                          })}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="dropdown-item">
                      <div>
                        <div className="dropdown-label">Infants</div>
                        <div className="dropdown-sublabel">In seat</div>
                      </div>
                      <div className="counter">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            infants: Math.max(0, parseInt(searchParams.infants) - 1).toString() 
                          })}
                          disabled={parseInt(searchParams.infants) <= 0}
                        >
                          −
                        </button>
                        <span className="counter-value">{searchParams.infants}</span>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSearchParams({ 
                            ...searchParams, 
                            infants: (parseInt(searchParams.infants) + 1).toString() 
                          })}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="dropdown-footer">
                      <button
                        type="button"
                        className="dropdown-cancel"
                        onClick={() => setShowPassengers(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="dropdown-done"
                        onClick={() => setShowPassengers(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="dropdown-wrapper">
                <button
                  type="button"
                  className="dropdown-btn"
                  onClick={() => setShowCabin(!showCabin)}
                >
                  {searchParams.cabinType}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {showCabin && (
                  <div className="dropdown-menu cabin-menu">
                    <button
                      type="button"
                      className={`cabin-option ${searchParams.cabinType === 'Economy' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchParams({ ...searchParams, cabinType: 'Economy' });
                        setShowCabin(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      Economy
                    </button>
                    <button
                      type="button"
                      className={`cabin-option ${searchParams.cabinType === 'Premium economy' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchParams({ ...searchParams, cabinType: 'Premium economy' });
                        setShowCabin(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      Premium economy
                    </button>
                    <button
                      type="button"
                      className={`cabin-option ${searchParams.cabinType === 'Business' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchParams({ ...searchParams, cabinType: 'Business' });
                        setShowCabin(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      Business
                    </button>
                    <button
                      type="button"
                      className={`cabin-option ${searchParams.cabinType === 'First' ? 'active' : ''}`}
                      onClick={() => {
                        setSearchParams({ ...searchParams, cabinType: 'First' });
                        setShowCabin(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      First
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            {/* One-way Search */}
            {searchParams.journeyType === 'one-way' && (
              <div className="search-fields">
                <div className="field-row">
                  <div className="input-group origin-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="origin"
                      value={oneWayData.origin}
                      onChange={handleOneWayChange}
                      placeholder="Where from?"
                      className="location-input"
                      maxLength="3"
                    />
                  </div>

                  <button type="button" className="swap-btn" onClick={swapCities}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>

                  <div className="input-group destination-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="destination"
                      value={oneWayData.destination}
                      onChange={handleOneWayChange}
                      placeholder="Where to?"
                      className="location-input"
                      maxLength="3"
                    />
                  </div>

                  <div className="input-group date-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <input
                      type="date"
                      name="departureDate"
                      value={oneWayData.departureDate}
                      onChange={handleOneWayChange}
                      className="date-input"
                    />
                  </div>
                </div>

                <div className="search-btn-container">
                  <button type="submit" disabled={loading} className="search-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Explore
                  </button>
                </div>
              </div>
            )}

            {/* Round-trip Search */}
            {searchParams.journeyType === 'round-trip' && (
              <div className="search-fields">
                <div className="field-row">
                  <div className="input-group origin-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="origin"
                      value={roundTripData.origin}
                      onChange={handleRoundTripChange}
                      placeholder="Where from?"
                      className="location-input"
                      maxLength="3"
                    />
                  </div>

                  <button type="button" className="swap-btn" onClick={swapCities}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>

                  <div className="input-group destination-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="destination"
                      value={roundTripData.destination}
                      onChange={handleRoundTripChange}
                      placeholder="Where to?"
                      className="location-input"
                      maxLength="3"
                    />
                  </div>

                  <div className="input-group date-group">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <input
                      type="date"
                      name="departureDate"
                      value={roundTripData.departureDate}
                      onChange={handleRoundTripChange}
                      className="date-input"
                    />
                    <div className="date-nav">
                      <button type="button" className="date-nav-btn">‹</button>
                      <button type="button" className="date-nav-btn">›</button>
                    </div>
                  </div>

                  <div className="input-group date-group return-date">
                    <span className="return-label">Return</span>
                    <input
                      type="date"
                      name="returnDate"
                      value={roundTripData.returnDate}
                      onChange={handleRoundTripChange}
                      className="date-input"
                    />
                    <div className="date-nav">
                      <button type="button" className="date-nav-btn">‹</button>
                      <button type="button" className="date-nav-btn">›</button>
                    </div>
                  </div>
                </div>

                <div className="search-btn-container">
                  <button type="submit" disabled={loading} className="search-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Explore
                  </button>
                </div>
              </div>
            )}

            {/* Multi-city Search */}
            {searchParams.journeyType === 'multi-city' && (
              <div className="search-fields multi-city-fields">
                {multiCityLegs.map((leg, index) => (
                  <div key={index} className="multi-city-leg">
                    <div className="field-row">
                      <div className="input-group origin-group">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <input
                          type="text"
                          value={leg.origin}
                          onChange={(e) => handleMultiCityChange(index, 'origin', e.target.value)}
                          placeholder="Where from?"
                          className="location-input"
                          maxLength="3"
                        />
                      </div>

                      <button type="button" className="swap-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="17 1 21 5 17 9"/>
                          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                          <polyline points="7 23 3 19 7 15"/>
                          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </svg>
                      </button>

                      <div className="input-group destination-group">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <input
                          type="text"
                          value={leg.destination}
                          onChange={(e) => handleMultiCityChange(index, 'destination', e.target.value)}
                          placeholder="Where to?"
                          className="location-input"
                          maxLength="3"
                        />
                      </div>

                      <div className="input-group date-group">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input
                          type="date"
                          value={leg.departureDate}
                          onChange={(e) => handleMultiCityChange(index, 'departureDate', e.target.value)}
                          className="date-input"
                        />
                        <div className="date-nav">
                          <button type="button" className="date-nav-btn">‹</button>
                          <button type="button" className="date-nav-btn">›</button>
                        </div>
                      </div>

                      {index >= 2 && (
                        <button
                          type="button"
                          onClick={() => removeMultiCityLeg(index)}
                          className="remove-leg-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMultiCityLeg}
                  className="add-flight-btn"
                >
                  Add flight
                </button>

                <div className="search-btn-container">
                  <button type="submit" disabled={loading} className="search-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Explore
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Search Results */}
        <div className="results-container">
          {searchInfo && flights.length > 0 && (
            <div className="search-success-banner">
              <div className="success-icon">✓</div>
              <div className="success-content">
                <strong>{searchInfo.disclaimer}</strong>
                <div className="success-details">
                  Found {searchInfo.count} real-time {searchInfo.count === 1 ? 'flight' : 'flights'} • 
                  {searchInfo.routeInfo?.origin} → {searchInfo.routeInfo?.destination} • 
                  From ₱{searchInfo.pricingInfo?.pricePerAdult?.toLocaleString()} per adult
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <div className="error-icon">✕</div>
              <strong>{error}</strong>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Fetching real-time prices from airlines...</p>
            </div>
          )}

          <div className="flight-results">
            {flights.map((flight, index) => (
              <div key={flight.id || index} className="flight-card">
                <div className="flight-main">
                  <div className="airline-section">
                    {flight.airline?.logo ? (
                      <img 
                        src={flight.airline.logo} 
                        alt={flight.airline.name}
                        className="airline-logo-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="airline-logo-placeholder">
                        {flight.airline?.code || '✈'}
                      </div>
                    )}
                    <div className="airline-name">
                      {flight.airline?.name || 'Unknown Airline'}
                    </div>
                  </div>

                  <div className="flight-details">
                    <div className="flight-time-info">
                      <div className="time-large">{flight.departure?.displayTime}</div>
                      <div className="airport-code">{flight.departure?.iataCode}</div>
                    </div>

                    <div className="flight-duration-info">
                      <div className="duration-text">{flight.duration}</div>
                      <div className="flight-line">
                        <div className="line-bar"></div>
                      </div>
                      <div className={`stops-text ${flight.stops === 0 ? 'nonstop' : ''}`}>
                        {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </div>
                    </div>

                    <div className="flight-time-info">
                      <div className="time-large">{flight.arrival?.displayTime}</div>
                      <div className="airport-code">{flight.arrival?.iataCode}</div>
                    </div>
                  </div>

                  <div className="flight-pricing">
                    <div className="price-amount">{flight.price.formatted}</div>
                    <div className="price-label">{searchParams.cabinType}</div>
                  </div>
                </div>

                {flight.quality && (
                  <div className="flight-footer">
                    <div className="quality-badge">
                      ⭐ Quality Score: {flight.quality}/10
                    </div>
                    <button
                      className="book-btn"
                      onClick={() => window.open(flight.bookingUrl, '_blank')}
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!loading && flights.length === 0 && !error && (
              <div className="no-flights">
                <div className="no-flights-icon">✈</div>
                <h3>Start searching for flights</h3>
                <p>Popular routes: MNL → CEB • MNL → DVO • MNL → SIN</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearch;