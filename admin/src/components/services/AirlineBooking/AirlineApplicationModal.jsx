
import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, Plane, Users, Trash2, User, Mail } from "lucide-react";

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
    passengers: [{ 
      firstName: "", 
      lastName: "", 
      type: "Adult", 
      age: "" 
    }]
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFlightChange = (e) => {
    setFormData({
      ...formData,
      flightDetails: { ...formData.flightDetails, [e.target.name]: e.target.value }
    });
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...formData.passengers];
    updated[index][field] = value;
    setFormData({ ...formData, passengers: updated });
  };

  const addPassenger = () => {
    setFormData({
      ...formData,
      passengers: [...formData.passengers, { firstName: "", lastName: "", type: "Adult", age: "" }]
    });
  };

  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      setFormData({
        ...formData,
        passengers: formData.passengers.filter((_, i) => i !== index)
      });
    }
  };

  const submitBooking = async () => {
    if (!formData.email || !formData.fullName || !formData.flightDetails.destination) {
      alert("Please fill in Client Name, Email, and Destination.");
      return;
    }

    setIsLoading(true);

    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const payload = {
      ...formData,
      serviceName: "Airline Booking",
      inquiryType: "FLIGHT_BOOKING",
      message: `Walk-in Booking: ${formData.flightDetails.origin} → ${formData.flightDetails.destination}`,
      userEmail: adminData.email || 'Unknown Admin',
      adminId: adminData._id || null
    };

    try {
      const res = await axios.post('/api/inquiries', payload);
      if (res.data.success) {
        setStep(2);
        if (refreshData) refreshData();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save booking.");
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
    <div className="air-overlay" onClick={onClose}>
      {/* INTERNAL CSS STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* OVERLAY & MODAL */
        .air-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);
            display: flex; justify-content: center; align-items: center; z-index: 9999;
            padding: 20px; animation: airFadeIn 0.2s ease;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .air-modal {
            background: white; width: 100%; border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex; flex-direction: column; overflow: hidden;
            position: relative; max-height: 90vh;
            animation: airSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .air-modal-lg { max-width: 900px; }
        
        @keyframes airFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes airSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* HEADER */
        .air-header {
            padding: 24px 32px; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
            background: #fff; position: sticky; top: 0; z-index: 10;
        }
        .air-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
        .air-subtitle { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 4px; }
        .air-close {
            background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: 0.2s;
        }
        .air-close:hover { background: #fee2e2; color: #ef4444; }

        /* BODY */
        .air-body { padding: 32px; overflow-y: auto; background: #ffffff; flex: 1; }

        /* FORM SECTIONS */
        .air-form-section { margin-bottom: 28px; }
        .air-form-title { 
            font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 16px; 
            display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .air-grid-2 { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; 
        }

        .air-input { 
            width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px; 
            font-size: 14px; background: white; color: #0f172a; transition: 0.2s; font-family: inherit;
        }
        .air-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }
        .air-input::placeholder { color: #94a3b8; }

        /* PASSENGER ROW */
        .air-pax-row { 
            display: grid; grid-template-columns: 1fr 1fr 0.8fr 0.6fr 40px; gap: 10px; 
            align-items: center; margin-bottom: 10px; 
        }

        /* FOOTER */
        .air-footer { 
            padding: 24px 32px; border-top: 1px solid #e2e8f0; 
            display: flex; justify-content: flex-end; gap: 12px; background: #fafbfc; 
        }
        .air-btn { 
            padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; 
            cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .air-btn-cancel { background: white; border: 1px solid #e2e8f0; color: #64748b; }
        .air-btn-cancel:hover { background: #f1f5f9; color: #0f172a; }
        
        .air-btn-primary { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
        .air-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
        .air-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .air-grid-2 { grid-template-columns: 1fr; }
            .air-pax-row { grid-template-columns: 1fr; gap: 8px; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; }
        }
      `}</style>

      <div className="air-modal air-modal-lg" onClick={e => e.stopPropagation()}>
        
        {step === 1 && (
          <>
            <div className="air-header">
              <div className="air-header-left">
                <h2 className="air-title">Add Walk-in Booking</h2>
                <div className="air-subtitle">Manually register a flight reservation</div>
              </div>
              <button className="air-close" onClick={onClose}><X size={20}/></button>
            </div>

            <div className="air-body">
              {/* Client Info */}
              <div className="air-form-section">
                <div className="air-form-title"><User size={16}/> Client / Contact Person</div>
                <div className="air-grid-2">
                   <input type="text" placeholder="Full Name *" name="fullName" value={formData.fullName} onChange={handleInputChange} className="air-input" />
                   <input type="email" placeholder="Email Address *" name="email" value={formData.email} onChange={handleInputChange} className="air-input" />
                </div>
                <input type="text" placeholder="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="air-input" style={{marginTop:'0px'}} />
              </div>

              {/* Flight Info */}
              <div className="air-form-section">
                <div className="air-form-title"><Plane size={16}/> Flight Itinerary</div>
                <div className="air-grid-2" style={{marginBottom:'16px', gridTemplateColumns:'1fr 1fr 1fr'}}>
                   <input type="text" placeholder="Origin" name="origin" value={formData.flightDetails.origin} onChange={handleFlightChange} className="air-input" />
                   <input type="text" placeholder="Destination *" name="destination" value={formData.flightDetails.destination} onChange={handleFlightChange} className="air-input" />
                   <input type="date" name="departureDate" value={formData.flightDetails.departureDate} onChange={handleFlightChange} className="air-input" />
                </div>
                <div className="air-grid-2">
                   <input type="text" placeholder="Airline" name="airline" value={formData.flightDetails.airline} onChange={handleFlightChange} className="air-input" />
                   <input type="number" placeholder="Total Price (PHP)" name="estimatedPrice" value={formData.estimatedPrice} onChange={handleInputChange} className="air-input" />
                </div>
              </div>

              {/* Passengers */}
              <div className="air-form-section">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                    <div className="air-form-title" style={{margin:0}}><Users size={16}/> Passenger Manifest</div>
                    <button onClick={addPassenger} style={{background:'#eff6ff', color:'#2563eb', border:'none', padding:'6px 12px', borderRadius:'6px', fontWeight:'700', fontSize:'12px', cursor:'pointer'}}>+ Add Pax</button>
                </div>
                {formData.passengers.map((p, i) => (
                  <div key={i} className="air-pax-row">
                    <input type="text" placeholder="First Name" value={p.firstName} onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)} className="air-input" />
                    <input type="text" placeholder="Last Name" value={p.lastName} onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)} className="air-input" />
                    <select value={p.type} onChange={(e) => handlePassengerChange(i, 'type', e.target.value)} className="air-input">
                      <option value="Adult">Adult</option><option value="Child">Child</option><option value="Infant">Infant</option>
                    </select>
                    <input type="number" placeholder="Age" value={p.age} onChange={(e) => handlePassengerChange(i, 'age', e.target.value)} className="air-input" />
                    <button onClick={() => removePassenger(i)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', display:'flex', justifyContent:'center'}}><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="air-footer">
               <button onClick={onClose} className="air-btn air-btn-cancel">Cancel</button>
               <button onClick={submitBooking} disabled={isLoading} className="air-btn air-btn-primary">
                  {isLoading ? "Saving..." : "Save Booking"}
               </button>
            </div>
          </>
        )}

        {step === 2 && (
           <div className="air-body" style={{textAlign:'center', padding:'60px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent: 'center'}}>
              <CheckCircle size={80} color="#16a34a" style={{marginBottom:'24px'}}/>
              <h2 className="air-title" style={{fontSize:'24px', marginBottom: '8px'}}>Booking Recorded!</h2>
              <p className="air-subtitle" style={{justifyContent:'center', fontSize: '15px'}}>Request has been saved successfully to the database.</p>
              <button onClick={resetAndClose} className="air-btn air-btn-primary" style={{marginTop:'32px', width:'200px', justifyContent:'center'}}>Close</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default AirlineApplicationModal;