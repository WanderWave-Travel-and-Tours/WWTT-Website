import React, { useState } from "react";
import { X, CheckCircle, Ship, MapPin } from "lucide-react";
import "./FerryModals.css";

export const FerryApplicationModal = ({ isOpen, onClose, onAddBooking }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    vessel: "",
    origin: "",
    destination: "",
    class: "Tourist",
    date: ""
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.givenName || !formData.vessel) return alert("Please fill required fields");
    
    // Create new booking object
    const newBooking = {
        id: `FRY-${Math.floor(Math.random() * 10000)}`,
        client: `${formData.givenName} ${formData.lastName}`,
        vessel: formData.vessel,
        route: `${formData.origin.toUpperCase()} - ${formData.destination.toUpperCase()}`,
        class: formData.class,
        date: formData.date || new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
        status: 'Pending',
        price: 1500 // Mock price
    };

    onAddBooking(newBooking);
    setStep(2);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ givenName: "", lastName: "", vessel: "", origin: "", destination: "", class: "Tourist", date: "" });
    onClose();
  };

  return (
    <div className="fry-overlay" onClick={(e) => e.target.className === "fry-overlay" && onClose()}>
      <div className={`fry-modal ${step === 1 ? "fry-modal-lg" : "fry-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="fry-header">
              <div className="fry-title-group">
                <h2 className="fry-title">Book Ferry Ticket</h2>
                <span className="fry-subtitle">Walk-in passenger registration</span>
              </div>
              <button className="fry-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="fry-body">
              <div className="fry-form-section">
                <h3 className="fry-section-title">Passenger Details</h3>
                <div className="fry-form-row">
                  <div className="fry-form-group">
                    <label className="fry-form-label">Given Name</label>
                    <input type="text" name="givenName" className="fry-input" value={formData.givenName} onChange={handleInputChange} />
                  </div>
                  <div className="fry-form-group">
                    <label className="fry-form-label">Last Name</label>
                    <input type="text" name="lastName" className="fry-input" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="fry-form-section">
                <h3 className="fry-section-title">Travel Details</h3>
                <div className="fry-form-group">
                  <label className="fry-form-label">Vessel / Shipping Line</label>
                  <select name="vessel" className="fry-input" value={formData.vessel} onChange={handleInputChange}>
                    <option value="">Select Vessel...</option>
                    <option value="2GO Travel">2GO Travel</option>
                    <option value="OceanJet">OceanJet</option>
                    <option value="FastCat">FastCat</option>
                    <option value="SuperFerry">SuperFerry</option>
                    <option value="Montenegro">Montenegro</option>
                  </select>
                </div>
                <div className="fry-form-row">
                    <div className="fry-form-group">
                        <label className="fry-form-label">Origin (Code)</label>
                        <input type="text" name="origin" className="fry-input" placeholder="e.g. MNL" value={formData.origin} onChange={handleInputChange} />
                    </div>
                    <div className="fry-form-group">
                        <label className="fry-form-label">Destination (Code)</label>
                        <input type="text" name="destination" className="fry-input" placeholder="e.g. CEB" value={formData.destination} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="fry-form-row">
                    <div className="fry-form-group">
                        <label className="fry-form-label">Date</label>
                        <input type="date" name="date" className="fry-input" value={formData.date} onChange={handleInputChange} />
                    </div>
                    <div className="fry-form-group">
                         <label className="fry-form-label">Class</label>
                         <select name="class" className="fry-input" value={formData.class} onChange={handleInputChange}>
                            <option value="Economy">Economy</option>
                            <option value="Tourist">Tourist</option>
                            <option value="Business">Business</option>
                            <option value="Open Air">Open Air</option>
                         </select>
                    </div>
                </div>
              </div>
            </div>

            <div className="fry-footer">
              <button className="fry-btn fry-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="fry-btn fry-btn-primary" onClick={handleSubmit}>
                <Ship size={18} style={{marginRight: '8px'}}/> Confirm Booking
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="fry-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="fry-title">Success!</h2>
             <p className="fry-subtitle">Ticket booking for {formData.givenName} has been recorded.</p>
             <button className="fry-btn fry-btn-primary fry-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};