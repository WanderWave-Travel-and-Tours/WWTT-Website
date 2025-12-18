import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, Plane, Users, Plus, Trash2, Calendar, MapPin } from "lucide-react";

const AirlineApplicationModal = ({ isOpen, onClose, refreshData }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    estimatedPrice: "",
    flightDetails: {
      origin: "",
      destination: "",
      departureDate: "",
      airline: "",
      flightNumber: ""
    },
    passengers: [
      { firstName: "", lastName: "", type: "Adult", age: "" }
    ]
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFlightChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      flightDetails: { ...prev.flightDetails, [name]: value }
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[index][field] = value;
    setFormData(prev => ({ ...prev, passengers: updatedPassengers }));
  };

  const addPassenger = () => {
    setFormData(prev => ({
      ...prev,
      passengers: [...prev.passengers, { firstName: "", lastName: "", type: "Adult", age: "" }]
    }));
  };

  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      const updated = formData.passengers.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, passengers: updated }));
    }
  };

  const submitBooking = async () => {
    if (!formData.email || !formData.fullName || !formData.flightDetails.destination) {
      alert("Please fill in Client Name, Email, and Destination.");
      return;
    }

    setIsLoading(true);
    try {
      // Gagamit tayo ng normal na JSON object dahil ito ang inaasahan ng createInquiry sa controller mo
      const payload = {
        ...formData,
        serviceName: "Airline Booking",
        inquiryType: "FLIGHT_BOOKING",
        // Ang message ay auto-generated sa backend kung wala ito, pero maganda nang magpasa tayo
        message: `Walk-in Booking: ${formData.flightDetails.origin} to ${formData.flightDetails.destination}`
      };

      const response = await axios.post('https://wanderwaveph-backend.onrender.com/api/inquiries', payload);

      if (response.data.success) {
        setStep(2);
        if (refreshData) refreshData();
      }
    } catch (error) {
      console.error("Booking Error:", error);
      alert(error.response?.data?.message || "Failed to save booking");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      fullName: "", email: "", contactNumber: "", estimatedPrice: "",
      flightDetails: { origin: "", destination: "", departureDate: "", airline: "", flightNumber: "" },
      passengers: [{ firstName: "", lastName: "", type: "Adult", age: "" }]
    });
    onClose();
  };

  return (
    <div className="airline-modal-overlay" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, padding:'20px'}}>
      <div className="airline-modal-content" style={{background:'white', width:'100%', maxWidth:'800px', borderRadius:'12px', maxHeight:'90vh', overflowY:'auto'}}>
        
        {step === 1 && (
          <>
            <div style={{padding:'20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
              <h2 style={{margin:0, fontSize:'20px'}}>Add Walk-in Airline Booking</h2>
              <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X/></button>
            </div>

            <div style={{padding:'20px'}}>
              {/* SECTION 1: CLIENT INFO */}
              <div style={{marginBottom:'25px'}}>
                <h3 style={{fontSize:'14px', color:'#3b82f6', marginBottom:'15px'}}><Users size={16}/> Client / Contact Person</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                  <input type="text" placeholder="Full Name *" name="fullName" value={formData.fullName} onChange={handleInputChange} className="vim-input" />
                  <input type="email" placeholder="Email Address *" name="email" value={formData.email} onChange={handleInputChange} className="vim-input" />
                  <input type="text" placeholder="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="vim-input" />
                </div>
              </div>

              {/* SECTION 2: FLIGHT DETAILS */}
              <div style={{marginBottom:'25px'}}>
                <h3 style={{fontSize:'14px', color:'#3b82f6', marginBottom:'15px'}}><Plane size={16}/> Flight Itinerary</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                  <input type="text" placeholder="Origin" name="origin" value={formData.flightDetails.origin} onChange={handleFlightChange} className="vim-input" />
                  <input type="text" placeholder="Destination *" name="destination" value={formData.flightDetails.destination} onChange={handleFlightChange} className="vim-input" />
                  <input type="date" name="departureDate" value={formData.flightDetails.departureDate} onChange={handleFlightChange} className="vim-input" />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                  <input type="text" placeholder="Airline (e.g. PAL)" name="airline" value={formData.flightDetails.airline} onChange={handleFlightChange} className="vim-input" />
                  <input type="text" placeholder="Flight Number" name="flightNumber" value={formData.flightDetails.flightNumber} onChange={handleFlightChange} className="vim-input" />
                  <input type="number" placeholder="Total Price (PHP)" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="vim-input" />
                </div>
              </div>

              {/* SECTION 3: PASSENGER LIST */}
              <div style={{marginBottom:'10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{fontSize:'14px', color:'#3b82f6', margin:0}}>Passenger Details</h3>
                  <button onClick={addPassenger} style={{padding:'5px 10px', fontSize:'12px', background:'#f0f9ff', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:'4px', cursor:'pointer'}}>+ Add Pax</button>
                </div>
                {formData.passengers.map((p, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 100px 100px 40px', gap:'10px', marginBottom:'10px', alignItems:'center'}}>
                    <input type="text" placeholder="First Name" value={p.firstName} onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)} className="vim-input" />
                    <input type="text" placeholder="Last Name" value={p.lastName} onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)} className="vim-input" />
                    <select value={p.type} onChange={(e) => handlePassengerChange(i, 'type', e.target.value)} className="vim-input">
                      <option value="Adult">Adult</option>
                      <option value="Child">Child</option>
                      <option value="Infant">Infant</option>
                    </select>
                    <input type="number" placeholder="Age" value={p.age} onChange={(e) => handlePassengerChange(i, 'age', e.target.value)} className="vim-input" />
                    <button onClick={() => removePassenger(i)} style={{border:'none', background:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
              <button onClick={onClose} style={{padding:'10px 20px', borderRadius:'6px', border:'1px solid #ddd', background:'white', cursor:'pointer'}}>Cancel</button>
              <button onClick={submitBooking} disabled={isLoading} style={{padding:'10px 20px', borderRadius:'6px', border:'none', background:'#0f172a', color:'white', cursor:'pointer', fontWeight:'600'}}>
                {isLoading ? "Saving..." : "Save Booking"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{padding:'40px', textAlign:'center'}}>
            <CheckCircle size={60} color="#16a34a" style={{margin:'0 auto 20px'}} />
            <h2 style={{fontSize:'22px', marginBottom:'10px'}}>Booking Recorded!</h2>
            <p style={{color:'#64748b'}}>Walk-in flight booking for {formData.fullName} has been successfully added.</p>
            <button onClick={resetAndClose} style={{marginTop:'25px', padding:'10px 30px', borderRadius:'8px', background:'#0f172a', color:'white', border:'none', cursor:'pointer', width:'100%'}}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirlineApplicationModal;