import React, { useState } from "react";
import "./FlightSearchResults.css";
import FlightBookingModal from "./flightBookingModal"; 

function FlightSearchResults({ searchInfo, flights, error, loading, searchParams }) {

  const [selectedFlight, setSelectedFlight] = useState(null);

  const handleBookClick = (flight) => {
    setSelectedFlight(flight);
  };

  return (
    <div className="results-section">
      <div className="results-content">
        
        {/* SUCCESS BANNER */}
        {searchInfo && flights.length > 0 && (
          <div className="search-success-banner">
            <div className="banner-left">
                <div className="route-header">
                    <div className="plane-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                             <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2 className="route-text">
                        {searchInfo.routeInfo?.origin?.iataCode || "Origin"} 
                        <span className="arrow">→</span> 
                        {searchInfo.routeInfo?.destination?.iataCode || "Destination"}
                    </h2>
                </div>
                <div className="route-subtext">
                    <span className="check-icon">✓</span>
                    Found {searchInfo.count} {searchInfo.count === 1 ? "flight" : "flights"} • {searchParams.cabinType} • 1 Passenger
                </div>
            </div>

            <div className="banner-right">
                <div className="stat-box">
                    <span className="stat-label">TOTAL FLIGHTS</span>
                    <span className="stat-value">{searchInfo.count}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-box">
                    <span className="stat-label">BEST PRICE</span>
                    <span className="stat-value highlight-price">₱{searchInfo.pricingInfo?.totalPrice?.toLocaleString() || "0"}</span>
                </div>
            </div>
          </div>
        )}

        {/* ERROR BANNER */}
        {error && (
          <div className="error-banner">
            <div className="error-icon">✕</div>
            <strong>{error}</strong>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Fetching real-time prices from airlines...</p>
          </div>
        )}

        {/* FLIGHT CARDS */}
        <div className="flight-results">
          {flights.map((flight, index) => (
            <div key={flight.id || index} className="flight-card">
              <div className="flight-main">
                
                {/* AIRLINE SECTION */}
                <div className="airline-section">
                  {flight.airline?.logo ? (
                    <div className="airline-logo-wrapper">
                        <img
                        src={flight.airline.logo}
                        alt={flight.airline.name}
                        className="airline-logo-img"
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                        />
                    </div>
                  ) : (
                    <div className="airline-logo-placeholder">
                      {flight.airline?.code || "✈"}
                    </div>
                  )}
                  <div className="airline-name">
                    {flight.airline?.name || "Unknown Airline"}
                  </div>
                </div>

                {/* FLIGHT DETAILS (Time & Path) */}
                <div className="flight-details">
                  <div className="flight-time-info">
                    <div className="time-large">{flight.departure?.displayTime}</div>
                    <div className="airport-code">{flight.departure?.iataCode}</div>
                  </div>

                  <div className="flight-duration-info">
                    <div className="duration-text">{flight.duration}</div>
                    <div className="flight-line">
                      <div className="line-bar"></div>
                      <div className="plane-icon-center">✈</div>
                      <div className="dot-start"></div>
                      <div className="dot-end"></div>
                    </div>
                    <div className={`stops-text ${flight.stops === 0 ? "nonstop" : ""}`}>
                      {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                    </div>
                  </div>

                  <div className="flight-time-info">
                    <div className="time-large">{flight.arrival?.displayTime}</div>
                    <div className="airport-code">{flight.arrival?.iataCode}</div>
                  </div>
                </div>

                <div className="flight-pricing">
                  <div className="price-amount">{flight.price.formatted}</div>
                  <div className="price-label">
                    {flight.price.totalPassengers} {flight.price.totalPassengers > 1 ? "passengers" : "passenger"} • {searchParams.cabinType}
                  </div>
                </div>
              </div>

              {/* ✅ FIXED: BUTTON IS NOW ALWAYS VISIBLE */}
              <div className="flight-footer">
                {/* Only show quality badge IF quality exists (optional) */}
                {flight.quality !== undefined ? (
                  <div className="quality-badge">
                    <span className="star">★</span> Quality Score: <strong>{flight.quality}/10</strong>
                  </div>
                ) : (
                  // Spacer para mapunta sa kanan ang button kung walang quality badge
                  <div></div> 
                )}
                
                <button className="book-btn" onClick={() => handleBookClick(flight)}>
                  Book Now
                </button>
              </div>

            </div>
          ))}

          {!loading && flights.length === 0 && !error && (
            <div className="no-flights">
              <div className="no-flights-icon">🌏</div>
              <h3>Start searching for flights</h3>
              <p>Search airports worldwide - Philippines, USA, Europe, Asia, and more!</p>
            </div>
          )}
          
          {/* RENDER MODAL IF FLIGHT IS SELECTED */}
          {selectedFlight && (
            <FlightBookingModal 
              flight={selectedFlight} 
              searchParams={searchParams} 
              onClose={() => setSelectedFlight(null)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightSearchResults;