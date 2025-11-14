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

  // One-way fields
  const [oneWayData, setOneWayData] = useState({
    origin: 'MNL',
    destination: '',
    departureDate: '2025-11-17'
  });

  // Round-trip fields
  const [roundTripData, setRoundTripData] = useState({
    origin: 'MNL',
    destination: '',
    departureDate: '2025-11-17',
    returnDate: '2025-11-24'
  });

  // Multi-city fields
  const [multiCityLegs, setMultiCityLegs] = useState([
    { origin: 'MNL', destination: '', departureDate: '2025-11-17' },
    { origin: '', destination: 'MNL', departureDate: '2025-11-20' }
  ]);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const response = await axios.get('http://localhost:5000/api/flights/search', {
        params: {
          ...searchData,
          adults: searchParams.adults
        }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setFlights(response.data.data);
        if (response.data.data.length === 0) {
          setError('No flights found for this route. Try MNL → NRT or MNL → SIN');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to search flights. Please try again.';
      setError(errorMessage);
      console.error('Search error:', err);
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
    setMultiCityLegs([...multiCityLegs, { origin: '', destination: '', departureDate: '2025-11-17' }]);
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

  return (
    <div className="flight-search-container">
      <div className="header">
        <h1>✈️ Search for flights here:</h1>
      </div>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row form-row-5">
            <div className="form-group">
              <label>Journey Type</label>
              <select name="journeyType" value={searchParams.journeyType} onChange={handleInputChange}>
                <option value="one-way">One-way</option>
                <option value="round-trip">Round trip</option>
                <option value="multi-city">Multi-city</option>
              </select>
            </div>

            <div className="form-group">
              <label>Adults (12+ yo)</label>
              <input type="number" name="adults" value={searchParams.adults} onChange={handleInputChange} min="1" />
            </div>

            <div className="form-group">
              <label>Children (2-11 yo)</label>
              <input type="number" name="children" value={searchParams.children} onChange={handleInputChange} min="0" />
            </div>

            <div className="form-group">
              <label>Infants (below 2 yo)</label>
              <input type="number" name="infants" value={searchParams.infants} onChange={handleInputChange} min="0" />
            </div>

            <div className="form-group">
              <label>Cabin Type</label>
              <select name="cabinType" value={searchParams.cabinType} onChange={handleInputChange}>
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>
          </div>

          {searchParams.journeyType === 'one-way' && (
            <div className="form-row form-row-7">
              <div className="form-group">
                <label>Origin City</label>
                <input
                  type="text"
                  name="origin"
                  value={oneWayData.origin}
                  onChange={handleOneWayChange}
                  placeholder="Manila (MNL)"
                  maxLength="3"
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>3-letter code</small>
              </div>

              <button type="button" onClick={swapCities} className="swap-button">⇄</button>

              <div className="form-group">
                <label>Destination City</label>
                <input
                  type="text"
                  name="destination"
                  value={oneWayData.destination}
                  onChange={handleOneWayChange}
                  placeholder="Tokyo (TYO)"
                  maxLength="3"
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>3-letter code</small>
              </div>

              <div className="form-group">
                <label>Departure</label>
                <input type="date" name="departureDate" value={oneWayData.departureDate} onChange={handleOneWayChange} />
              </div>
            </div>
          )}

          {searchParams.journeyType === 'round-trip' && (
            <div className="form-row form-row-7" style={{ gridTemplateColumns: '2fr 0.5fr 2fr 1.5fr 1.5fr' }}>
              <div className="form-group">
                <label>Origin City</label>
                <input
                  type="text"
                  name="origin"
                  value={roundTripData.origin}
                  onChange={handleRoundTripChange}
                  placeholder="Manila (MNL)"
                  maxLength="3"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>3-letter code</small>
              </div>

              <button type="button" onClick={swapCities} className="swap-button">⇄</button>

              <div className="form-group">
                <label>Destination City</label>
                <input
                  type="text"
                  name="destination"
                  value={roundTripData.destination}
                  onChange={handleRoundTripChange}
                  placeholder="Tokyo (TYO)"
                  maxLength="3"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>3-letter code</small>
              </div>

              <div className="form-group">
                <label>Departure</label>
                <input type="date" name="departureDate" value={roundTripData.departureDate} onChange={handleRoundTripChange} />
              </div>

              <div className="form-group">
                <label>Return</label>
                <input type="date" name="returnDate" value={roundTripData.returnDate} onChange={handleRoundTripChange} />
              </div>
            </div>
          )}

          {/* MULTI-CITY FORM */}
          {searchParams.journeyType === 'multi-city' && (
            <div style={{ marginBottom: '20px' }}>
              {multiCityLegs.map((leg, index) => (
                <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 60px', gap: '16px', alignItems: 'end' }}>
                    <div className="form-group">
                      <label>Origin City</label>
                      <input
                        type="text"
                        value={leg.origin}
                        onChange={(e) => handleMultiCityChange(index, 'origin', e.target.value)}
                        placeholder="MNL"
                        maxLength="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Destination City</label>
                      <input
                        type="text"
                        value={leg.destination}
                        onChange={(e) => handleMultiCityChange(index, 'destination', e.target.value)}
                        placeholder="TYO"
                        maxLength="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Onward</label>
                      <input
                        type="date"
                        value={leg.departureDate}
                        onChange={(e) => handleMultiCityChange(index, 'departureDate', e.target.value)}
                      />
                    </div>

                    {index >= 2 && (
                      <button
                        type="button"
                        onClick={() => removeMultiCityLeg(index)}
                        style={{
                          padding: '12px',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          color: '#dc2626',
                          fontSize: '20px',
                          width: '45px',
                          height: '45px'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMultiCityLeg}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  border: '2px dashed #1e1b4b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#1e1b4b',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: '100%',
                  marginTop: '12px'
                }}
              >
                + Add Trip
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group form-full-width">
              <label>Select Preferred Airlines</label>
              <input
                type="text"
                name="preferredAirline"
                value={searchParams.preferredAirline}
                onChange={handleInputChange}
                placeholder="Type Airline name or code"
              />
            </div>
          </div>

          <div className="search-button-container">
            <button type="submit" disabled={loading} className="search-button">
              🔍 {loading ? 'SEARCHING...' : 'SEARCH FLIGHTS'}
            </button>
          </div>
        </form>

        {/* Filters */}
        {flights.length > 0 && (
          <div className="filter-container">
            <div className="filter-buttons">
              <button className="filter-button">🔧 All filters</button>
              <button className="filter-button">Stops</button>
              <button className="filter-button">Airlines</button>
              <button className="filter-button">Bags</button>
              <button className="filter-button">Price</button>
              <button className="filter-button">Duration</button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Results */}
        <div className="flight-results">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Searching for flights...</p>
            </div>
          )}

          {/* Flight Cards */}
          {flights.map((flight, index) => (
            <div key={index} className="flight-card">
              <div className="flight-content">
                <div className="flight-info">
                  <div className="airline-info">
                    <div className="airline-logo">{flight.airline?.code || 'N/A'}</div>
                    <div className="airline-details">
                      <h3>{flight.airline?.name || 'Unknown Airline'}</h3>
                      <p>Flight {flight.airline?.flightNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flight-route">
                    <div className="flight-time">
                      <div className="time">
                        {new Date(flight.departure?.scheduledTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      <div className="code">{flight.departure?.iataCode}</div>
                    </div>

                    <div className="flight-path">
                      <div className="duration">{flight.duration}</div>
                      <div className="line"></div>
                      <div className="stops">
                        <span style={{
                          color: flight.status === 'active' ? 'green' :
                                flight.status === 'landed' ? 'blue' :
                                flight.status === 'cancelled' ? 'red' : 'orange',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          {flight.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flight-time">
                      <div className="time">
                        {new Date(flight.arrival?.scheduledTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      <div className="code">{flight.arrival?.iataCode}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                    <div><strong>Aircraft:</strong> {flight.aircraft}</div>
                    {flight.departure?.delay && (
                      <div style={{ color: 'red', marginTop: '4px' }}>
                        <strong>⚠️ Delay:</strong> {flight.departure.delay} minutes
                      </div>
                    )}
                  </div>
                </div>

                <div className="flight-price">
                  <div className="class">Class: {searchParams.cabinType}</div>
                  <div className="amount" style={{ fontSize: '18px', color: '#1e1b4b' }}>
                    Real-Time Tracking
                  </div>
                  <div className="currency" style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                    Contact airline for pricing
                  </div>
                  <button
                    style={{
                      marginTop: '16px',
                      padding: '8px 20px',
                      background: '#1e1b4b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                    onClick={() => window.open(`https://www.google.com/flights?q=${flight.departure?.iataCode}+to+${flight.arrival?.iataCode}`, '_blank')}
                  >
                    Check Prices
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* No Results */}
          {!loading && flights.length === 0 && searchParams.journeyType && (
            <div className="no-results">
              <div className="no-results-icon">✈️</div>
              <p className="no-results-text">
                No flights found. Try these routes:<br />
                <strong>MNL → NRT</strong> (Tokyo) | <strong>MNL → SIN</strong> (Singapore) | <strong>MNL → HKG</strong> (Hong Kong)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightSearch;