import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast'; // Import Toaster and toast
import './flightBookingModal.css';

const FlightBookingModal = ({ flight, searchParams, onClose }) => {
  const MAX_AGE = 120;
  const MIN_AGE = 1;
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
  
  // Custom Toaster Error Function (Unchanged)
  const showToastError = (message) => {
    toast.error(message, {
      style: { border: '1px solid #ef4444', color: '#ef4444' },
      iconTheme: { primary: '#ef4444', secondary: '#fff' },
    });
  };

  // Custom Validation Function for Names (no numbers) (Unchanged)
  const isNameValid = (name) => {
    return !/\d/.test(name); // Returns true if no digits are found
  };
  
  // Handlers with Age Capping Logic

  const handleContactChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'age') {
        // 1. Clean input: only numbers, max 3 digits (for input field restriction)
        value = value.replace(/[^0-9]/g, '').slice(0, 3);

        let ageNum = parseInt(value, 10);

        // 2. Auto-cap maximum age at MAX_AGE
        if (!isNaN(ageNum) && ageNum > MAX_AGE) {
            value = String(MAX_AGE);
            toast('Maximum age is 120. Value was automatically capped.', { icon: 'ℹ️' });
        }
    }
    
    setContactInfo({ ...contactInfo, [name]: value });
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...additionalPassengers];
    
    if (field === 'age') {
        // 1. Clean input: only numbers, max 3 digits
        value = value.replace(/[^0-9]/g, '').slice(0, 3);

        let ageNum = parseInt(value, 10);
        
        // 2. Auto-cap maximum age at MAX_AGE
        if (!isNaN(ageNum) && ageNum > MAX_AGE) {
            value = String(MAX_AGE);
            toast('Maximum age is 120. Value was automatically capped for Passenger ' + (index + 2) + '.', { icon: 'ℹ️' });
        }
    }
    
    updated[index][field] = value;
    setAdditionalPassengers(updated);
  };
  
  // Validation function for Step 1
  const validateStep1 = () => {
      const { fullName, age, phone } = contactInfo;
      const ageNum = parseInt(age, 10);

      if (!isNameValid(fullName)) {
          showToastError("Full Name must not contain numbers.");
          return false;
      }
      // Check minimum age only, as max age is handled by capping
      if (isNaN(ageNum) || ageNum < MIN_AGE) {
          showToastError(`Age must be at least ${MIN_AGE}.`);
          return false;
      }
      if (!/^[0-9+]{8,20}$/.test(phone)) {
          showToastError("Phone number must be 8-20 characters long and only contain numbers and the '+' sign.");
          return false;
      }
      return true;
  };

  // Validation function for Step 2
  const validateStep2 = () => {
      for (let i = 0; i < additionalPassengers.length; i++) {
          const p = additionalPassengers[i];
          const ageNum = parseInt(p.age, 10);
          
          if (!isNameValid(p.firstName) || !isNameValid(p.lastName)) {
              showToastError(`Passenger ${i + 2}'s name must not contain numbers.`);
              return false;
          }
          // Check minimum age only, as max age is handled by capping
          if (isNaN(ageNum) || ageNum < MIN_AGE) {
              showToastError(`Passenger ${i + 2}'s age must be at least ${MIN_AGE}.`);
              return false;
          }
          if (p.contactNumber && !/^[0-9+]{8,20}$/.test(p.contactNumber)) {
              showToastError(`Passenger ${i + 2}'s phone number is invalid (8-20 chars, numbers and '+').`);
              return false;
          }
      }
      return true;
  };

  const handleNextOrSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
        if (!validateStep1()) return;
        
        if (hasAdditionalPassengers) {
            setStep(2);
        } else {
            handleSubmit();
        }
    } else if (step === 2) {
        if (!validateStep2()) return;
        handleSubmit();
    }
  };


  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);
    
    // Final check for step 2 submission path
    if (hasAdditionalPassengers && step === 2 && !validateStep2()) {
      setLoading(false);
      return;
    }
    
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

    let priceAmount = flight.price.amount;
    if (typeof priceAmount === 'string') {
      priceAmount = parseFloat(priceAmount.replace(/[^0-9.]/g, ''));
    }
    priceAmount = parseFloat(priceAmount) || 0;

    // Prepare Booking Data (omitted for brevity)
    const bookingData = { /* ... */ };

    try {
      // Simulate API call
      // const res = await axios.post('http://localhost:5000/api/inquiries', bookingData, { /* ... */ });
      // Using a mock response for demonstration
      const res = { data: { success: true } }; 
      
      if (res.data.success) {
        // Removed ✅ emoji from success toast
        toast.success('Booking Request Sent Successfully! Please check your email.', { duration: 5000 });
        setTimeout(onClose, 2000); // Close after successful toast
      } else {
        showToastError('❌ Booking submission failed. ' + (res.data.message || ''));
      }

    } catch (error) {
      console.error("❌ Booking Error:", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      showToastError('❌ Booking failed. Please try again. (' + msg + ')');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      {/* Toaster component with top-center position */}
      <Toaster position="top-center" reverseOrder={false} />

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
                <input 
                  required 
                  type="text" 
                  name="fullName" 
                  value={contactInfo.fullName} 
                  onChange={handleContactChange} 
                  placeholder="e.g. Juan Dela Cruz" 
                />
              </div>
              
              <div className="row" style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Nationality</label>
                    <input required type="text" name="nationality" value={contactInfo.nationality} onChange={handleContactChange} placeholder="Filipino" />
                </div>
                <div className="form-group" style={{ width: '100px' }}>
                    <label>Age</label>
                    <input 
                      required 
                      type="number" 
                      name="age" 
                      value={contactInfo.age} 
                      onChange={handleContactChange} 
                      placeholder="Age" 
                      min={MIN_AGE}
                      max={MAX_AGE}
                      pattern="\d{1,3}"
                      title={`Age must be a number between ${MIN_AGE} and ${MAX_AGE}.`}
                      // Note: onInput logic is removed here and moved to handleContactChange for state control
                    />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" name="email" value={contactInfo.email} onChange={handleContactChange} placeholder="juan@example.com" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  required 
                  type="tel" 
                  name="phone" 
                  value={contactInfo.phone} 
                  onChange={handleContactChange} 
                  placeholder="e.g. +639171234567" 
                  pattern="[0-9+]{8,20}"
                  title="Phone Number must be 8 to 20 digits long, only allowing numbers and the '+' sign."
                />
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
                      <input 
                        required 
                        placeholder="First Name" 
                        value={p.firstName} 
                        onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)} 
                      />
                      <input 
                        required 
                        placeholder="Last Name" 
                        value={p.lastName} 
                        onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)} 
                      />
                    </div>

                    <div className="row">
                      <input required placeholder="Nationality" value={p.nationality} onChange={(e) => handlePassengerChange(i, 'nationality', e.target.value)} />
                      <input 
                        required 
                        type="number" 
                        placeholder="Age" 
                        value={p.age} 
                        onChange={(e) => handlePassengerChange(i, 'age', e.target.value)} 
                        style={{width: '80px'}} 
                        min={MIN_AGE}
                        max={MAX_AGE}
                        pattern="\d{1,3}"
                        title={`Age must be a number between ${MIN_AGE} and ${MAX_AGE}.`}
                        // Note: onInput logic is removed here and moved to handlePassengerChange for state control
                      />
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
                        pattern="[0-9+]{8,20}"
                        title="Phone Number must be 8 to 20 digits long, only allowing numbers and the '+' sign."
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