import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './flightBookingModal.css';

const FlightBookingModal = ({ flight, searchParams, onClose }) => {
  const totalPax = parseInt(searchParams.adults) + parseInt(searchParams.children) + parseInt(searchParams.infants);
  const hasAdditionalPassengers = totalPax > 1;
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 

  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    nationality: 'Filipino',
    age: ''
  });

  const getAdditionalPassengerTypes = () => {
    let types = [];
    for (let i = 0; i < parseInt(searchParams.adults); i++) types.push('Adult');
    for (let i = 0; i < parseInt(searchParams.children); i++) types.push('Child');
    for (let i = 0; i < parseInt(searchParams.infants); i++) types.push('Infant');
    
    // Remove one adult (the primary booker)
    const bookerIndex = types.indexOf('Adult');
    if (bookerIndex > -1) {
        types.splice(bookerIndex, 1);
    }
    return types;
  };

  const [additionalPassengers, setAdditionalPassengers] = useState(
    getAdditionalPassengerTypes().map((type) => ({
      firstName: '',
      lastName: '',
      nationality: 'Filipino',
      age: '',
      email: '',        
      contactNumber: '', 
      type: type
    }))
  );

  const handleContactChange = (e) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...additionalPassengers];
    updated[index][field] = value;
    setAdditionalPassengers(updated);
  };

  const handleNextOrSubmit = (e) => {
    e.preventDefault();
    if (step === 1 && hasAdditionalPassengers) {
      setStep(2);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);

    // Prepare Primary Passenger
    const nameParts = contactInfo.fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.pop() : '.';
    const firstName = nameParts.join(' ');

    const primaryPassenger = {
        firstName: firstName || contactInfo.fullName,
        lastName: lastName,
        nationality: contactInfo.nationality,
        age: parseInt(contactInfo.age) || 0, 
        email: contactInfo.email,      
        contactNumber: contactInfo.phone,
        type: 'Adult (Primary)'
    };

    // Combine All Passengers
    const allPassengers = [primaryPassenger, ...additionalPassengers];

    // ✅ FIX: Ensure estimatedPrice is a proper number
    let priceAmount = flight.price.amount;
    if (typeof priceAmount === 'string') {
      priceAmount = parseFloat(priceAmount.replace(/[^0-9.]/g, ''));
    }
    priceAmount = parseFloat(priceAmount) || 0;

    // Prepare Booking Data
    const bookingData = {
      serviceName: 'Airline Booking',
      inquiryType: 'FLIGHT_BOOKING',
      fullName: contactInfo.fullName,
      email: contactInfo.email,
      contactNumber: contactInfo.phone,
      address: contactInfo.address,
      message: `Flight Booking Request: ${flight.departure.iataCode} ➝ ${flight.arrival.iataCode} on ${flight.departure.time}`,
      
      estimatedPrice: priceAmount, // ✅ Now guaranteed to be a number
      
      flightDetails: {
        origin: flight.departure.iataCode,
        destination: flight.arrival.iataCode,
        departureDate: flight.departure.time,
        arrivalDate: flight.arrival.time,
        airline: flight.airline.name,
        flightNumber: flight.airline.flightNumber || 'N/A',
        cabinClass: searchParams.cabinType,
        duration: flight.duration,
        stops: flight.stops
      },
      
      passengers: allPassengers // ✅ Already an array, will be sent as JSON
    };

    console.log("📤 Submitting Booking Data:", JSON.stringify(bookingData, null, 2));

    try {
      const res = await axios.post('https://wanderwaveph-backend.onrender.com/api/inquiries', bookingData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data.success) {
        alert('✅ Booking Request Sent Successfully! Please check your email.');
        onClose();
      } else {
        alert('❌ Booking submission failed. ' + (res.data.message || ''));
      }

    } catch (error) {
      console.error("❌ Booking Error:", error);
      console.error("❌ Error Response:", error.response?.data);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      alert('❌ Booking failed. Please try again. (' + msg + ')');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="booking-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Complete Your Booking</h2>
          <div className="flight-summary">
            {flight.airline.name} • {flight.departure.iataCode} ➝ {flight.arrival.iataCode} • {totalPax} Pax
          </div>
        </div>

        <form onSubmit={handleNextOrSubmit}>
          {step === 1 && (
            <div className="form-step">
              <h3>Step 1: Primary Passenger (You)</h3>
              
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" name="fullName" value={contactInfo.fullName} onChange={handleContactChange} placeholder="e.g. Juan Dela Cruz" />
              </div>
              
              <div className="row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Nationality</label>
                    <input required type="text" name="nationality" value={contactInfo.nationality} onChange={handleContactChange} placeholder="Filipino" />
                </div>
                <div className="form-group" style={{ width: '100px' }}>
                    <label>Age</label>
                    <input required type="number" name="age" value={contactInfo.age} onChange={handleContactChange} placeholder="Age" />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" name="email" value={contactInfo.email} onChange={handleContactChange} placeholder="juan@example.com" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input required type="tel" name="phone" value={contactInfo.phone} onChange={handleContactChange} placeholder="0917 123 4567" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input required type="text" name="address" value={contactInfo.address} onChange={handleContactChange} placeholder="City, Province" />
              </div>

              <button type="submit" className="next-btn" disabled={loading}>
                {loading ? 'Processing...' : (hasAdditionalPassengers ? 'Next: Add Companions' : `Submit Booking (₱${flight.price.formatted || flight.price.amount})`)}
              </button>
            </div>
          )}

          {step === 2 && hasAdditionalPassengers && (
            <div className="form-step">
              <h3>Step 2: Companion Details</h3>
              <p style={{fontSize: '0.9em', color: '#666', marginBottom: '15px'}}>Please enter details for the remaining {additionalPassengers.length} passenger(s).</p>
              
              <div className="passengers-scroll">
                {additionalPassengers.map((p, i) => (
                  <div key={i} className="passenger-card">
                    <h4>Passenger {i + 2} ({p.type})</h4>
                    
                    <div className="row">
                      <input required placeholder="First Name" value={p.firstName} onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)} />
                      <input required placeholder="Last Name" value={p.lastName} onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)} />
                    </div>

                    <div className="row">
                      <input required placeholder="Nationality" value={p.nationality} onChange={(e) => handlePassengerChange(i, 'nationality', e.target.value)} />
                      <input required type="number" placeholder="Age" value={p.age} onChange={(e) => handlePassengerChange(i, 'age', e.target.value)} style={{width: '80px'}} />
                    </div>

                    <div className="row">
                      <input 
                        type="email" 
                        placeholder="Email Address (Optional)" 
                        value={p.email} 
                        onChange={(e) => handlePassengerChange(i, 'email', e.target.value)} 
                        style={{ flex: 1.5 }} 
                      />
                      <input 
                        type="tel" 
                        placeholder="Phone No. (Optional)" 
                        value={p.contactNumber} 
                        onChange={(e) => handlePassengerChange(i, 'contactNumber', e.target.value)} 
                        style={{ flex: 1 }}
                      />
                    </div>

                  </div>
                ))}
              </div>
              
              <div className="btn-group">
                <button type="button" className="back-btn" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : `Submit Booking (${flight.price.formatted || flight.price.amount})`}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};

export default FlightBookingModal;