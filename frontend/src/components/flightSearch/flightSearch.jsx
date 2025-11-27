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
      const response = await axios.get('http://localhost:5000/api/flights/search-prices', {
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

  return (
    <div className="flight-search-container">
      <div className="header">
        <h1>✈️ Search Real-Time Flight Prices</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          Powered by Amadeus GDS - Get accurate, bookable prices for future flights
        </p>
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
              <input type="number" name="adults" value={searchParams.adults} onChange={handleInputChange} min="1" max="9" />
            </div>

            <div className="form-group">
              <label>Children (2-11 yo)</label>
              <input type="number" name="children" value={searchParams.children} onChange={handleInputChange} min="0" max="9" />
            </div>

            <div className="form-group">
              <label>Infants (below 2 yo)</label>
              <input type="number" name="infants" value={searchParams.infants} onChange={handleInputChange} min="0" max="9" />
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
                  placeholder="MNL"
                  maxLength="3"
                  required
                />
              </div>

              <button type="button" onClick={swapCities} className="swap-button">
                ⇄
              </button>

              <div className="form-group">
                <label>Destination City</label>
                <input
                  type="text"
                  name="destination"
                  value={oneWayData.destination}
                  onChange={handleOneWayChange}
                  placeholder="CEB"
                  maxLength="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Departure Date</label>
                <input
                  type="date"
                  name="departureDate"
                  value={oneWayData.departureDate}
                  onChange={handleOneWayChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          )}

          {searchParams.journeyType === 'round-trip' && (
            <div className="form-row form-row-7">
              <div className="form-group">
                <label>Origin City</label>
                <input
                  type="text"
                  name="origin"
                  value={roundTripData.origin}
                  onChange={handleRoundTripChange}
                  placeholder="MNL"
                  maxLength="3"
                  required
                />
              </div>

              <button type="button" onClick={swapCities} className="swap-button">
                ⇄
              </button>

              <div className="form-group">
                <label>Destination City</label>
                <input
                  type="text"
                  name="destination"
                  value={roundTripData.destination}
                  onChange={handleRoundTripChange}
                  placeholder="CEB"
                  maxLength="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Departure Date</label>
                <input
                  type="date"
                  name="departureDate"
                  value={roundTripData.departureDate}
                  onChange={handleRoundTripChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Return Date</label>
                <input
                  type="date"
                  name="returnDate"
                  value={roundTripData.returnDate}
                  onChange={handleRoundTripChange}
                  min={roundTripData.departureDate}
                  required
                />
              </div>
            </div>
          )}

          {searchParams.journeyType === 'multi-city' && (
            <div>
              {multiCityLegs.map((leg, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#1e1b4b' }}>Flight {index + 1}</h4>
                  <div className="form-row form-row-7" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group">
                      <label>Origin</label>
                      <input
                        type="text"
                        value={leg.origin}
                        onChange={(e) => handleMultiCityChange(index, 'origin', e.target.value)}
                        placeholder="MNL"
                        maxLength="3"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Destination</label>
                      <input
                        type="text"
                        value={leg.destination}
                        onChange={(e) => handleMultiCityChange(index, 'destination', e.target.value)}
                        placeholder="CEB"
                        maxLength="3"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={leg.departureDate}
                        onChange={(e) => handleMultiCityChange(index, 'departureDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
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
                + Add Flight
              </button>
            </div>
          )}

          <div className="search-button-container">
            <button type="submit" disabled={loading} className="search-button">
              🔍 {loading ? 'SEARCHING REAL-TIME PRICES...' : 'SEARCH FLIGHTS'}
            </button>
          </div>
        </form>

        {searchInfo && flights.length > 0 && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #16a34a',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <strong style={{ color: '#15803d' }}>{searchInfo.disclaimer}</strong>
            </div>
            <div style={{ fontSize: '13px', color: '#166534', marginTop: '8px' }}>
              <div>📊 Found {searchInfo.count} real-time {searchInfo.count === 1 ? 'flight' : 'flights'}</div>
              <div>🛫 Route: {searchInfo.routeInfo?.origin} → {searchInfo.routeInfo?.destination} ({searchInfo.routeInfo?.type})</div>
              {searchInfo.pricingInfo && (
                <div>💰 Starting from ₱{searchInfo.pricingInfo.pricePerAdult?.toLocaleString()} per adult</div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px',
            color: '#991b1b'
          }}>
            <strong>❌ {error}</strong>
          </div>
        )}

        <div className="flight-results">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Fetching real-time prices from airlines...</p>
            </div>
          )}

          {flights.map((flight, index) => (
            <div key={flight.id || index} className="flight-card">
              <div className="flight-content">
                <div className="flight-info">
                  <div className="airline-info">
                    {flight.airline?.logo ? (
                      <img 
                        src={flight.airline.logo} 
                        alt={flight.airline.name}
                        style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="airline-logo">{flight.airline?.code || '✈️'}</div>
                    )}
                    <div className="airline-details">
                      <h3>{flight.airline?.name || 'Unknown Airline'}</h3>
                      <p>Flight {flight.airline?.flightNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flight-route">
                    <div className="flight-time">
                      <div className="time">{flight.departure?.displayTime}</div>
                      <div className="code">{flight.departure?.iataCode}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {flight.departure?.displayDate}
                      </div>
                    </div>

                    <div className="flight-path">
                      <div className="duration">{flight.duration}</div>
                      <div className="line"></div>
                      <div className="stops">
                        <span style={{
                          color: flight.stops === 0 ? '#16a34a' : '#ea580c',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          {flight.stops === 0 ? '✓ NON-STOP' : `${flight.stops} STOP${flight.stops > 1 ? 'S' : ''}`}
                        </span>
                      </div>
                    </div>

                    <div className="flight-time">
                      <div className="time">{flight.arrival?.displayTime}</div>
                      <div className="code">{flight.arrival?.iataCode}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {flight.arrival?.displayDate}
                      </div>
                    </div>
                  </div>

                  {flight.quality && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                      ⭐ Quality Score: <strong>{flight.quality}/10</strong>
                    </div>
                  )}
                </div>

                <div className="flight-price">
                  <div className="class" style={{ fontSize: '12px', color: '#666' }}>
                    {searchParams.cabinType} Class
                  </div>
                  <div className="amount" style={{ 
                    fontSize: '32px', 
                    color: '#1e1b4b', 
                    fontWeight: 'bold', 
                    marginTop: '8px' 
                  }}>
                    {flight.price.formatted}
                  </div>
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', marginTop: '4px' }}>
                    ✅ Real-time price
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    per adult • Total: ₱{Math.round(flight.price.amount).toLocaleString()}
                  </div>
                  <button
                    style={{
                      marginTop: '16px',
                      padding: '12px 24px',
                      background: '#1e1b4b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      width: '100%',
                      transition: 'background 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#312e81'}
                    onMouseOut={(e) => e.target.style.background = '#1e1b4b'}
                    onClick={() => window.open(flight.bookingUrl, '_blank')}
                  >
                    Book Now →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && flights.length === 0 && !error && (
            <div className="no-results">
              <div className="no-results-icon">✈️</div>
              <p className="no-results-text">
                Start searching for real-time flight prices!<br />
                <strong>Popular routes:</strong> MNL → CEB | MNL → DVO | MNL → SIN
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightSearch;