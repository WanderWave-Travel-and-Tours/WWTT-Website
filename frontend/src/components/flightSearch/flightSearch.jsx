import { useState, useEffect, useRef } from 'react';
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
    origin: '',
    destination: '',
    departureDate: getTomorrowDate()
  });

  const [roundTripData, setRoundTripData] = useState({
    origin: '',
    destination: '',
    departureDate: getTomorrowDate(),
    returnDate: getNextWeekDate()
  });

  const [multiCityLegs, setMultiCityLegs] = useState([
    { origin: '', destination: '', departureDate: getTomorrowDate() },
    { origin: '', destination: '', departureDate: getNextWeekDate() }
  ]);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState(null);
  const [showPassengers, setShowPassengers] = useState(false);
  const [showCabin, setShowCabin] = useState(false);

  // Airport search states
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [airportSearchLoading, setAirportSearchLoading] = useState(false);
  const [originSearchTerm, setOriginSearchTerm] = useState('');
  const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
  
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimerRef = useRef(null);

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

  const searchAirportsFromAPI = async (searchTerm, field) => {
    if (!searchTerm || searchTerm.length < 1) {
      searchTerm = '';
    }

    setAirportSearchLoading(true);
    
    try {
      const response = await axios.get('http://localhost:5000/api/flights/airports', {
        params: { search: searchTerm }
      });

      if (response.data.success && response.data.data) {
        const airports = response.data.data
          .filter(airport => airport.iata_code) 
          .map(airport => ({
            iataCode: airport.iata_code,
            name: airport.airport_name,
            city: airport.city_name,
            country: airport.country_name,
            countryCode: airport.country_iso2
          }))
          .slice(0, 50);

        if (field === 'origin') {
          setOriginSuggestions(airports);
        } else {
          setDestinationSuggestions(airports);
        }
      }
    } catch (error) {
      console.error('Airport search error:', error);
      if (field === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    } finally {
      setAirportSearchLoading(false);
    }
  };

  const debouncedSearch = (searchTerm, field) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      searchAirportsFromAPI(searchTerm, field);
    }, 500);
  };

  const handleAirportFocus = async (field) => {
    const currentValue = field === 'origin' ? originSearchTerm : destinationSearchTerm;
    
    if (field === 'origin') {
      setShowOriginSuggestions(true);
      setShowDestinationSuggestions(false);
      
      if (originSuggestions.length === 0) {
        await searchAirportsFromAPI(currentValue, 'origin');
      }
    } else {
      setShowDestinationSuggestions(true);
      setShowOriginSuggestions(false);
      
      if (destinationSuggestions.length === 0) {
        await searchAirportsFromAPI(currentValue, 'destination');
      }
    }
  };

  const handleAirportInputChange = (field, value) => {
    if (field === 'origin') {
      setOriginSearchTerm(value);
      setShowOriginSuggestions(true);
      setShowDestinationSuggestions(false);
    } else {
      setDestinationSearchTerm(value);
      setShowDestinationSuggestions(true);
      setShowOriginSuggestions(false);
    }

    if (searchParams.journeyType === 'one-way') {
      setOneWayData({ ...oneWayData, [field]: value.toUpperCase() });
    } else if (searchParams.journeyType === 'round-trip') {
      setRoundTripData({ ...roundTripData, [field]: value.toUpperCase() });
    }

    debouncedSearch(value, field);
  };

  const selectAirport = (airport, field) => {
    const iataCode = airport.iataCode;

    if (searchParams.journeyType === 'one-way') {
      setOneWayData({ ...oneWayData, [field]: iataCode });
    } else if (searchParams.journeyType === 'round-trip') {
      setRoundTripData({ ...roundTripData, [field]: iataCode });
    }

    if (field === 'origin') {
      setOriginSearchTerm(iataCode);
    } else {
      setDestinationSearchTerm(iataCode);
    }

    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        originRef.current && !originRef.current.contains(event.target) && 
        destinationRef.current && !destinationRef.current.contains(event.target)
      ) {
        setShowOriginSuggestions(false);
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

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
    }

    try {
      console.log('🚀 Starting Dual Search (Amadeus + Kiwi)...');
      
      const amadeusRequest = axios.get('http://localhost:5000/api/flights/search-prices-amadeus-only', {
        params: { ...searchData, adults: searchParams.adults }
      });

      const kiwiRequest = axios.get('http://localhost:5000/api/flights/search-prices-kiwi', {
        params: { ...searchData }
      });

      const [amadeusRes, kiwiRes] = await Promise.allSettled([amadeusRequest, kiwiRequest]);

      let allFlights = [];
      let combinedInfo = {};

      if (amadeusRes.status === 'fulfilled' && amadeusRes.value.data.success) {
        console.log('✅ Amadeus Data Received:', amadeusRes.value.data.count);
        allFlights = [...allFlights, ...amadeusRes.value.data.data];
        
        combinedInfo = {
            count: amadeusRes.value.data.count,
            source: 'Mixed (Amadeus + Kiwi)',
            routeInfo: amadeusRes.value.data.routeInfo,
            pricingInfo: amadeusRes.value.data.pricingInfo
        };
      }

      if (kiwiRes.status === 'fulfilled' && kiwiRes.value.data.success) {
        console.log('✅ Kiwi Data Received:', kiwiRes.value.data.count);
        allFlights = [...allFlights, ...kiwiRes.value.data.data];
      } else {
        console.warn('⚠️ Kiwi Search Failed or Empty:', kiwiRes.reason);
      }

      allFlights.sort((a, b) => {
        const priceA = a.price?.amount || 0;
        const priceB = b.price?.amount || 0;
        return priceA - priceB;
      });

      if (allFlights.length > 0) {
        setFlights(allFlights);
        setSearchInfo({
          ...combinedInfo,
          count: allFlights.length,
          disclaimer: '✅ Showing combined results from GDS (Amadeus) and Low-Cost Carriers (Kiwi).'
        });
      } else {
        setError('No flights found from any provider.');
      }

    } catch (err) {
      console.error('Major Search Error:', err);
      setError('Failed to search flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
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
      const tempOrigin = oneWayData.origin;
      const tempOriginTerm = originSearchTerm;
      
      setOneWayData({
        ...oneWayData,
        origin: oneWayData.destination,
        destination: tempOrigin
      });
      
      setOriginSearchTerm(destinationSearchTerm);
      setDestinationSearchTerm(tempOriginTerm);
    } else if (searchParams.journeyType === 'round-trip') {
      const tempOrigin = roundTripData.origin;
      const tempOriginTerm = originSearchTerm;
      
      setRoundTripData({
        ...roundTripData,
        origin: roundTripData.destination,
        destination: tempOrigin
      });
      
      setOriginSearchTerm(destinationSearchTerm);
      setDestinationSearchTerm(tempOriginTerm);
    }
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
                One-way
              </button>
              <button
                type="button"
                className={`journey-btn ${searchParams.journeyType === 'round-trip' ? 'active' : ''}`}
                onClick={() => setSearchParams({ ...searchParams, journeyType: 'round-trip' })}
              >
                Round trip
              </button>
              <button
                type="button"
                className={`journey-btn ${searchParams.journeyType === 'multi-city' ? 'active' : ''}`}
                onClick={() => setSearchParams({ ...searchParams, journeyType: 'multi-city' })}
              >
                Multi-city
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            {(searchParams.journeyType === 'one-way' || searchParams.journeyType === 'round-trip') && (
              <div className="form-section">
                <div className="field-row">
                  <div className="input-group origin-group" ref={originRef} style={{ position: 'relative' }}>
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="origin"
                      value={originSearchTerm}
                      onChange={(e) => handleAirportInputChange('origin', e.target.value)}
                      onFocus={() => handleAirportFocus('origin')}
                      placeholder="Where from?"
                      className="location-input"
                      autoComplete="off"
                    />
                    
                    {showOriginSuggestions && (
                      <div className="airport-suggestions" ref={suggestionsRef}>
                        {airportSearchLoading ? (
                          <div className="airport-search-loading">
                            Searching airports...
                          </div>
                        ) : originSuggestions.length > 0 ? (
                          originSuggestions.map((airport, idx) => (
                            <div
                              key={idx}
                              className="airport-suggestion-item"
                              onClick={() => selectAirport(airport, 'origin')}
                            >
                              <div className="airport-code">{airport.iataCode}</div>
                              <div className="airport-details">
                                <div className="airport-name">{airport.name}</div>
                                <div className="airport-location">
                                  {airport.city}, {airport.country}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-airports-message">
                            {originSearchTerm ? 'No airports found. Try a different search.' : 'Start typing to search airports worldwide...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={swapCities} className="swap-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>

                  <div className="input-group destination-group" ref={destinationRef} style={{ position: 'relative' }}>
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <input
                      type="text"
                      name="destination"
                      value={destinationSearchTerm}
                      onChange={(e) => handleAirportInputChange('destination', e.target.value)}
                      onFocus={() => handleAirportFocus('destination')}
                      placeholder="Where to?"
                      className="location-input"
                      autoComplete="off"
                    />

                    {showDestinationSuggestions && (
                      <div className="airport-suggestions" ref={suggestionsRef}>
                        {airportSearchLoading ? (
                          <div className="airport-search-loading">
                            Searching airports...
                          </div>
                        ) : destinationSuggestions.length > 0 ? (
                          destinationSuggestions.map((airport, idx) => (
                            <div
                              key={idx}
                              className="airport-suggestion-item"
                              onClick={() => selectAirport(airport, 'destination')}
                            >
                              <div className="airport-code">{airport.iataCode}</div>
                              <div className="airport-details">
                                <div className="airport-name">{airport.name}</div>
                                <div className="airport-location">
                                  {airport.city}, {airport.country}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-airports-message">
                            {destinationSearchTerm ? 'No airports found. Try a different search.' : 'Start typing to search airports worldwide...'}
                          </div>
                        )}
                      </div>
                    )}
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
                      value={searchParams.journeyType === 'one-way' ? oneWayData.departureDate : roundTripData.departureDate}
                      onChange={(e) => {
                        if (searchParams.journeyType === 'one-way') {
                          setOneWayData({ ...oneWayData, departureDate: e.target.value });
                        } else {
                          setRoundTripData({ ...roundTripData, departureDate: e.target.value });
                        }
                      }}
                      className="date-input"
                      min={getTomorrowDate()}
                    />
                  </div>

                  {searchParams.journeyType === 'round-trip' && (
                    <div className="input-group date-group">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <input
                        type="date"
                        name="returnDate"
                        value={roundTripData.returnDate}
                        onChange={(e) => setRoundTripData({ ...roundTripData, returnDate: e.target.value })}
                        className="date-input"
                        min={roundTripData.departureDate}
                      />
                    </div>
                  )}
                </div>

                <div className="field-row">
                  <div className="input-group passengers-group" onClick={() => setShowPassengers(!showPassengers)}>
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div className="passengers-display">
                      {getTotalPassengers()} passenger{getTotalPassengers() > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="input-group cabin-group" onClick={() => setShowCabin(!showCabin)}>
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                    <div className="cabin-display">{searchParams.cabinType}</div>
                  </div>
                </div>

                {showPassengers && (
                  <div className="passengers-dropdown">
                    <div className="passenger-row">
                      <div className="passenger-label">
                        <strong>Adults</strong>
                        <span>12+ years</span>
                      </div>
                      <div className="passenger-controls">
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, adults: Math.max(1, parseInt(searchParams.adults) - 1).toString() })}>−</button>
                        <span>{searchParams.adults}</span>
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, adults: (parseInt(searchParams.adults) + 1).toString() })}>+</button>
                      </div>
                    </div>
                    <div className="passenger-row">
                      <div className="passenger-label">
                        <strong>Children</strong>
                        <span>2-11 years</span>
                      </div>
                      <div className="passenger-controls">
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, children: Math.max(0, parseInt(searchParams.children) - 1).toString() })}>−</button>
                        <span>{searchParams.children}</span>
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, children: (parseInt(searchParams.children) + 1).toString() })}>+</button>
                      </div>
                    </div>
                    <div className="passenger-row">
                      <div className="passenger-label">
                        <strong>Infants</strong>
                        <span>Under 2 years</span>
                      </div>
                      <div className="passenger-controls">
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, infants: Math.max(0, parseInt(searchParams.infants) - 1).toString() })}>−</button>
                        <span>{searchParams.infants}</span>
                        <button type="button" onClick={() => setSearchParams({ ...searchParams, infants: (parseInt(searchParams.infants) + 1).toString() })}>+</button>
                      </div>
                    </div>
                  </div>
                )}

                {showCabin && (
                  <div className="cabin-dropdown">
                    {['Economy', 'Premium Economy', 'Business', 'First'].map(cabin => (
                      <div
                        key={cabin}
                        className={`cabin-option ${searchParams.cabinType === cabin ? 'selected' : ''}`}
                        onClick={() => {
                          setSearchParams({ ...searchParams, cabinType: cabin });
                          setShowCabin(false);
                        }}
                      >
                        {cabin}
                      </div>
                    ))}
                  </div>
                )}

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

            {searchParams.journeyType === 'multi-city' && (
              <div className="form-section">
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

        <div className="results-container">
          {searchInfo && flights.length > 0 && (
            <div className="search-success-banner">
              <div className="success-icon">✓</div>
              <div className="success-content">
                <strong>{searchInfo.disclaimer}</strong>
                <div className="success-details">
                  Found {searchInfo.count} real-time {searchInfo.count === 1 ? 'flight' : 'flights'} • 
                  {searchInfo.routeInfo?.origin?.iataCode || searchInfo.routeInfo?.origin} → {searchInfo.routeInfo?.destination?.iataCode || searchInfo.routeInfo?.destination} • 
                  From ₱{searchInfo.pricingInfo?.pricePerAdult?.toLocaleString() || '0'} per adult
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
                <p>Search airports worldwide - Philippines, USA, Europe, Asia, and more!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearch;