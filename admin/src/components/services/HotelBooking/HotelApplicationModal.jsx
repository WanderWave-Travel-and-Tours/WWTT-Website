import React, { useState } from "react";
import { X, CheckCircle, Hotel, User, Mail, DollarSign, Calendar } from "lucide-react";
import "./HotelModals.css";

// IMPORTANT: Gamit ang 'export const' para match sa import { ... } ng kabilang file
export const HotelApplicationModal = ({ isOpen, onClose, onAddBooking }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    guestName: "",
    email: "",
    hotelName: "",
    roomType: "",
    checkIn: "",
    price: ""
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.guestName || !formData.hotelName || !formData.price) return alert("Please fill required fields");
    
    const newBooking = {
        id: `RES-${Math.floor(Math.random() * 10000)}`,
        guest: formData.guestName,
        hotel: formData.hotelName,
        room: formData.roomType || 'Standard',
        checkIn: formData.checkIn || new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
        status: 'Pending',
        price: parseFloat(formData.price) || 0
    };

    if (onAddBooking) onAddBooking(newBooking);
    setStep(2);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ guestName: "", email: "", hotelName: "", roomType: "", checkIn: "", price: "" });
    onClose();
  };

  return (
    <div className="hbm-overlay" onClick={(e) => e.target.className === "hbm-overlay" && onClose()}>
      <div className={`hbm-modal ${step === 1 ? "hbm-modal-lg" : "hbm-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="hbm-header">
              <div className="hbm-title-group">
                <h2 className="hbm-title">New Reservation</h2>
                <span className="hbm-subtitle">Create new hotel booking</span>
              </div>
              <button className="hbm-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="hbm-body">
              <div className="hbm-form-section">
                <h3 className="hbm-section-title">Guest Details</h3>
                <div className="hbm-form-row">
                  <div className="hbm-form-group">
                    <label className="hbm-label">Guest Name</label>
                    <input type="text" name="guestName" className="hbm-input" placeholder="Full Name" value={formData.guestName} onChange={handleInputChange} />
                  </div>
                  <div className="hbm-form-group">
                    <label className="hbm-label">Email Address</label>
                    <input type="email" name="email" className="hbm-input" placeholder="email@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="hbm-form-section">
                <h3 className="hbm-section-title">Stay Details</h3>
                <div className="hbm-form-row">
                    <div className="hbm-form-group">
                        <label className="hbm-label">Hotel</label>
                        <select name="hotelName" className="hbm-input" value={formData.hotelName} onChange={handleInputChange}>
                            <option value="">Select Hotel...</option>
                            <option value="Grand Hyatt Manila">Grand Hyatt Manila</option>
                            <option value="Shangri-La Boracay">Shangri-La Boracay</option>
                            <option value="Okada Manila">Okada Manila</option>
                            <option value="Crimson Resort">Crimson Resort</option>
                            <option value="The Peninsula">The Peninsula</option>
                        </select>
                    </div>
                    <div className="hbm-form-group">
                        <label className="hbm-label">Room Type</label>
                        <input type="text" name="roomType" className="hbm-input" placeholder="e.g. Deluxe" value={formData.roomType} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="hbm-form-row">
                    <div className="hbm-form-group">
                        <label className="hbm-label">Check-in Date</label>
                        <input type="date" name="checkIn" className="hbm-input" value={formData.checkIn} onChange={handleInputChange} />
                    </div>
                    <div className="hbm-form-group">
                        <label className="hbm-label">Price</label>
                        <input type="number" name="price" className="hbm-input" placeholder="0.00" value={formData.price} onChange={handleInputChange} />
                    </div>
                </div>
              </div>
            </div>

            <div className="hbm-footer">
              <button className="hbm-btn hbm-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="hbm-btn hbm-btn-primary" onClick={handleSubmit}>
                <Hotel size={18} /> Confirm Booking
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="hbm-body" style={{textAlign: 'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'300px'}}>
             <div style={{background:'#dcfce7', padding:'20px', borderRadius:'50%', marginBottom:'20px'}}>
                <CheckCircle size={48} color="#16a34a" />
             </div>
             <h2 className="hbm-title" style={{fontSize:'24px', marginBottom:'8px'}}>Booking Success!</h2>
             <p className="hbm-subtitle" style={{marginBottom:'30px'}}>Reservation for {formData.guestName} has been saved.</p>
             <button className="hbm-btn hbm-btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={resetAndClose}>Back to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
};