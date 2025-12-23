import React from 'react';
import { X, Plane } from 'lucide-react';
import FlightSearch from '../flightSearch/flightSearch'; 
import './BookingRightForm.css';

const FlightSearchModal = ({ 
  isOpen, 
  onClose, 
  pkg, 
  monthNames, 
  currentMonth, 
  selectedDate, 
  quantities, 
  handleFlightSelected 
}) => {
  if (!isOpen) return null;

  return (
    <div className="brf-flight-overlay" onClick={onClose}>
      <div className="brf-flight-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          className="brf-flight-close-btn" 
          onClick={onClose}
          aria-label="Close Flight Search"
        >
          <X size={24} strokeWidth={2.5} />
        </button>
        
        {/* Header */}
        <div className="brf-flight-header">
          <div className="brf-flight-title-group">
             <div className="brf-flight-icon-box">
                <Plane size={24} color="#fff" />
             </div>
             <div>
                <h2>Search Flights</h2>
                <p className="brf-flight-subtitle">
                  For <strong>{pkg.name}</strong>
                </p>
             </div>
          </div>
          
          {selectedDate && (
            <div className="brf-flight-date-badge">
              Travel Date: <strong>{monthNames[currentMonth.getMonth()]} {selectedDate}, {currentMonth.getFullYear()}</strong>
            </div>
          )}
        </div>

        {/* Search Content */}
        <div className="brf-flight-wrapper">
          <FlightSearch 
            onFlightSelect={handleFlightSelected}
            prefilledDepartureDate={selectedDate ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}` : null}
            prefilledDestination={pkg.location}
            prefilledPassengers={{
              adults: quantities.adult || 1,
              children: 0,
              infants: 0
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FlightSearchModal;