import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Plane, Hotel, Utensils, Bus, Camera, Briefcase, 
  ChevronLeft, ChevronRight, Minus, Plus, X, MessageCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import FlightSearch from '../flightSearch/flightSearch'; // FIXED: Correct path

const BookingRightForm = ({ pkg }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10));
  const durationDays = parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1);
  const [showModal, setShowModal] = useState(false);
  const [showFlightSearchModal, setShowFlightSearchModal] = useState(false);
  
  // AIRFARE INTEGRATION STATES
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingWithAirfare, setBookingWithAirfare] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  const packageTypes = [
    { id: 'adult', label: 'Standard Pax', description: '3+ years old', pricePerPax: pkg.price, discount: 'Best Value' }
  ];

  // PACKAGE TOTAL
  const packageTotal = Object.entries(quantities).reduce((sum, [type, qty]) => {
    const pType = packageTypes.find(p => p.id === type);
    return sum + (pType?.pricePerPax || 0) * qty;
  }, 0);

  // AIRFARE TOTAL (if selected)
  const airfareTotal = selectedFlight ? selectedFlight.price.amount : 0;

  // GRAND TOTAL (Package + Airfare)
  const totalAmount = packageTotal + airfareTotal;

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isInSelectedRange = (day) => {
    if (!selectedDate) return false;
    const endDate = selectedDate + durationDays - 1;
    return day >= selectedDate && day <= endDate;
  };

  const getEndDate = () => {
    if (!selectedDate) return null;
    return selectedDate + durationDays - 1;
  };

  const handleQuantity = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(1, Math.min(20, (prev[type] || 1) + delta))
    }));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
    setCurrentMonth(new Date(newDate));
  };

  // REGULAR BOOKING (Package Only)
  const handleBookClick = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setBookingWithAirfare(false);
    setShowModal(true);
  };

  // BOOK WITH AIRFARE - Opens Flight Search
  const handleBookWithAirfare = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setShowFlightSearchModal(true);
  };

  // CALLBACK: When user selects a flight from FlightSearchResults
  const handleFlightSelected = (flight) => {
    setSelectedFlight(flight);
    setShowFlightSearchModal(false);
    setBookingWithAirfare(true);
    
    toast.success(
      `✈️ Flight Added! ${flight.airline.name} - ${flight.price.formatted}`,
      { duration: 3000 }
    );
    
    // Auto-open booking modal after selecting flight
    setTimeout(() => {
      setShowModal(true);
    }, 500);
  };

  // REMOVE SELECTED FLIGHT
  const handleRemoveFlight = () => {
    setSelectedFlight(null);
    setBookingWithAirfare(false);
    toast.success("Flight removed from booking", { duration: 2000 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    const endDate = getEndDate();
    const bookingData = {
      packageName: pkg.name,
      startDate: `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`,
      endDate: `${monthNames[currentMonth.getMonth()]} ${endDate}, ${currentMonth.getFullYear()}`,
      duration: pkg.duration,
      pax: quantities,
      packageTotal: packageTotal,
      
      // AIRFARE DATA (if applicable)
      includesAirfare: bookingWithAirfare,
      flightDetails: selectedFlight ? {
        airline: selectedFlight.airline.name,
        flightNumber: selectedFlight.airline.flightNumber || 'N/A',
        route: `${selectedFlight.departure.iataCode} → ${selectedFlight.arrival.iataCode}`,
        departureTime: selectedFlight.departure.time,
        arrivalTime: selectedFlight.arrival.time,
        price: selectedFlight.price.amount,
        formatted: selectedFlight.price.formatted
      } : null,
      airfareTotal: airfareTotal,
      
      totalAmount: totalAmount,
      fullName: formData.fullName,
      email: formData.email,
      message: formData.message
    };

    setShowModal(false);
    toast.loading("Redirecting to payment...", { duration: 1500 });
    setTimeout(() => {
      navigate('/payment', { state: { bookingData } });
    }, 1500);
  };

  const handleContactSales = () => {
    toast.loading("Connecting to sales representative...", {
      duration: 3000,
      style: {
        background: '#333',
        color: '#fff',
      }
    });
  };

  return (
    <div className="booking-form-content">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="form-header">
        <h1 className="package-title">{pkg.name}</h1>
        <div className="price-row">
          <span className="price-amount">₱{pkg.price.toLocaleString()}</span>
          <span className="starts-at">/ pax</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', color: '#4b5563', fontSize: '0.9rem' }}>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <MapPin size={16} color="#fc9c1b"/> {pkg.location}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <Calendar size={16} color="#fc9c1b"/> {pkg.duration} / {pkg.nights}
          </div>
        </div>
      </div>

      <div className="service-icons">
        {[Plane, Hotel, Bus, Utensils, Camera, Briefcase].map((Icon, i) => (
          <Icon key={i} size={20} className="service-icon" />
        ))}
      </div>

      <div className="calendar-section">
        <label style={{display:'block', marginBottom:'12px', fontWeight:'600', color:'#374151'}}>
          Select Travel Date
        </label>
        {selectedDate && (
          <div style={{
            padding: '12px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '0.9rem',
            color: '#166534'
          }}>
            <strong>Selected Trip:</strong> {monthNames[currentMonth.getMonth()]} {selectedDate} - {getEndDate()}, {currentMonth.getFullYear()} ({durationDays} days)
          </div>
        )}
        <div className="calendar-wrapper">
          <div className="calendar-header">
            <button onClick={() => changeMonth(-1)} style={{background:'none', border:'none', cursor:'pointer'}}>
              <ChevronLeft size={20} color="#4b5563"/>
            </button>
            <span style={{fontWeight:'600'}}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => changeMonth(1)} style={{background:'none', border:'none', cursor:'pointer'}}>
              <ChevronRight size={20} color="#4b5563"/>
            </button>
          </div>
          
          <div className="calendar-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="calendar-day-label">{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isStartDate = selectedDate === day;
              const isInRange = isInSelectedRange(day);
              const isEndDate = selectedDate && day === getEndDate();
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`calendar-day ${isStartDate ? 'selected' : ''} ${isInRange && !isStartDate ? 'in-range' : ''} ${isEndDate ? 'end-date' : ''}`}
                  style={{
                    background: isStartDate ? '#fc9c1b' : isEndDate ? '#22c55e' : isInRange ? '#fef3c7' : 'white',
                    color: isStartDate || isEndDate ? 'white' : isInRange ? '#92400e' : '#374151',
                    fontWeight: isStartDate || isEndDate ? '600' : '400'
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="quantity-section">
        {packageTypes.map((type) => (
          <div key={type.id} className="quantity-item">
            <div>
              <div style={{display:'flex', alignItems:'center'}}>
                <span className="quantity-label">{type.label}</span>
                <span className="quantity-discount-badge">{type.discount}</span>
              </div>
              <div style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'4px'}}>{type.description}</div>
            </div>
            
            <div className="quantity-controls">
              <button onClick={() => handleQuantity(type.id, -1)} className="quantity-btn">
                <Minus size={16} />
              </button>
              <span className="quantity-value">{quantities[type.id]}</span>
              <button onClick={() => handleQuantity(type.id, 1)} className="quantity-btn">
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SELECTED FLIGHT DISPLAY */}
      {selectedFlight && (
        <div style={{
          background: '#fff7ed',
          border: '2px solid #fc9c1b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Plane size={20} color="#fc9c1b"/>
              <strong style={{color:'#1f2937', fontSize:'0.95rem'}}>Flight Added to Package</strong>
            </div>
            <button 
              onClick={handleRemoveFlight}
              style={{
                background:'none', 
                border:'none', 
                color:'#ef4444', 
                cursor:'pointer',
                fontSize:'0.85rem',
                textDecoration:'underline'
              }}
            >
              Remove
            </button>
          </div>
          
          <div style={{fontSize:'0.9rem', color:'#374151', lineHeight:'1.6'}}>
            <div><strong>{selectedFlight.airline.name}</strong> • {selectedFlight.airline.flightNumber || 'Flight'}</div>
            <div>{selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}</div>
            <div style={{color:'#6b7280', fontSize:'0.85rem'}}>{selectedFlight.departure.displayTime} - {selectedFlight.arrival.displayTime}</div>
            <div style={{marginTop:'8px', fontWeight:'700', color:'#fc9c1b', fontSize:'1rem'}}>
              +{selectedFlight.price.formatted}
            </div>
          </div>
        </div>
      )}

      <div className="booking-footer">
        <div className="total-row">
          <span className="total-label">
            {selectedFlight ? 'Package Total' : 'Total Amount'}
          </span>
          <span className="total-amount">₱{packageTotal.toLocaleString()}</span>
        </div>
        
        {/* Show Airfare + Grand Total if flight selected */}
        {selectedFlight && (
          <>
            <div className="total-row" style={{fontSize:'0.9rem', color:'#6b7280'}}>
              <span>+ Airfare</span>
              <span>₱{airfareTotal.toLocaleString()}</span>
            </div>
            <div className="total-row" style={{
              borderTop:'2px solid #fc9c1b', 
              paddingTop:'12px', 
              marginTop:'8px',
              fontSize:'1.1rem', 
              fontWeight:'800',
              color:'#1f2937'
            }}>
              <span>GRAND TOTAL</span>
              <span style={{color:'#fc9c1b'}}>₱{totalAmount.toLocaleString()}</span>
            </div>
          </>
        )}
        
        <button className="book-now-btn" onClick={handleBookClick}>
          {selectedFlight ? '🎫 Book Package + Flight' : 'Book This Trip'}
        </button>

        <button className="book-with-airfare-btn" onClick={handleBookWithAirfare}>
          <Plane size={20} />
          {selectedFlight ? 'Change Flight' : 'Add Airfare'}
        </button>

        <button className="contact-sales-footer-btn" onClick={handleContactSales}>
           <MessageCircle size={20} />
           Contact Sales
        </button>

        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            <button 
              className="modal-close-btn" 
              onClick={() => setShowModal(false)}
              aria-label="Close Modal"
            >
              <X size={44} strokeWidth={3} />
            </button>
            
            <div className="modal-header">
              <img 
                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
                alt="Wanderwave Logo" 
                className="modal-logo"
              />
              
              <h2 className="modal-title">Your Adventure Awaits!</h2>
              <p className="modal-subtitle">
                Please complete your details below. We'll secure your spot for <strong>{pkg.name}</strong> instantly.
              </p>
              
              <div className="modal-trip-summary">
                <div className="summary-item">
                    <span className="summary-label">Travel Dates</span>
                    <strong className="summary-value">
                      {monthNames[currentMonth.getMonth()]} {selectedDate} - {getEndDate()}, {currentMonth.getFullYear()}
                    </strong>
                    <span style={{fontSize:'0.85rem', color:'#6b7280'}}>({durationDays} days trip)</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label">Package Price</span>
                    <strong className="summary-value price">₱{packageTotal.toLocaleString()}</strong>
                </div>
                
                {/* SHOW AIRFARE IN MODAL */}
                {selectedFlight && (
                  <>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                      <span className="summary-label">
                        <Plane size={14} style={{display:'inline', marginRight:'4px'}}/>
                        Airfare ({selectedFlight.airline.name})
                      </span>
                      <strong className="summary-value" style={{color:'#fc9c1b'}}>
                        ₱{airfareTotal.toLocaleString()}
                      </strong>
                      <span style={{fontSize:'0.85rem', color:'#6b7280'}}>
                        {selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}
                      </span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item" style={{background:'#fff7ed', padding:'12px', borderRadius:'8px'}}>
                      <span className="summary-label">GRAND TOTAL</span>
                      <strong className="summary-value" style={{fontSize:'1.4rem', color:'#fc9c1b'}}>
                        ₱{totalAmount.toLocaleString()}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            <form className="modal-form" onSubmit={handleFinalSubmit}>
              <div className="form-group">
                <label>FULL NAME</label>
                <input 
                  type="text" 
                  name="fullName"
                  placeholder="e.g. Juan dela Cruz" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="name@email.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="form-group">
                <label>MESSAGE (OPTIONAL)</label>
                <textarea 
                  name="message"
                  placeholder="Any special requests or questions?"
                  rows="3"
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <button type="submit" className="modal-submit-btn">
                {bookingWithAirfare ? `Confirm Booking (₱${totalAmount.toLocaleString()})` : 'Confirm Booking'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* FLIGHT SEARCH MODAL */}
      {showFlightSearchModal && (
        <div className="flight-search-modal-overlay" onClick={() => setShowFlightSearchModal(false)}>
          <div className="flight-search-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flight-modal-close-btn" 
              onClick={() => setShowFlightSearchModal(false)}
              aria-label="Close Flight Search"
            >
              <X size={32} strokeWidth={3} />
            </button>
            
            <div className="flight-modal-header">
              <Plane size={28} color="#fc9c1b" />
              <h2>Search Flights for Your Trip</h2>
              <p>Package: <strong>{pkg.name}</strong></p>
              {selectedDate && (
                <p>Travel Date: <strong>{monthNames[currentMonth.getMonth()]} {selectedDate}, {currentMonth.getFullYear()}</strong></p>
              )}
            </div>

            <div className="flight-search-wrapper">
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
      )}

    </div>
  );
};

export default BookingRightForm;