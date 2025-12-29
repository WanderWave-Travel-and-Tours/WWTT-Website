import React, { useState } from "react";
import { X, CheckCircle, User, Mail, MapPin, Calendar, Users, Phone } from "lucide-react";
import "./TourModals.css";

export const TourApplicationModal = ({ isOpen, onClose, refreshData }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    packageName: "",
    destination: "",
    travelDate: "",
    returnDate: "",
    adults: "",
    children: "",
    specialRequests: ""
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const submitTour = async () => {
    if (!formData.clientName || !formData.email || !formData.packageName) {
      alert("Please fill in Client Name, Email, and Package Name.");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setStep(2);
      setIsLoading(false);
      if (refreshData) refreshData();
    }, 1500);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      clientName: "",
      email: "",
      phone: "",
      packageName: "",
      destination: "",
      travelDate: "",
      returnDate: "",
      adults: "",
      children: "",
      specialRequests: ""
    });
    onClose();
  };

  return (
    <div className="tur-overlay" onClick={(e) => e.target.className === "tur-overlay" && onClose()}>
      <div className={`tur-modal ${step === 1 ? "tur-modal-lg" : "tur-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="tur-header">
              <div className="tur-title-group">
                <h2 className="tur-title">Add Walk-in Tour Package</h2>
                <span className="tur-subtitle">Register a new tour booking manually</span>
              </div>
              <button className="tur-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="tur-body">
              <div className="tur-form-section">
                <h3 className="tur-section-title">Lead Guest Information</h3>
                <div className="tur-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Client Name <span className="tur-label-req">*</span></label>
                    <input type="text" name="clientName" className="tur-input" value={formData.clientName} onChange={handleInputChange} placeholder="e.g., Juan Dela Cruz" />
                  </div>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Email <span className="tur-label-req">*</span></label>
                    <input type="email" name="email" className="tur-input" value={formData.email} onChange={handleInputChange} placeholder="client@email.com" />
                  </div>
                </div>
                <div className="tur-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Contact Number</label>
                    <input type="text" name="phone" className="tur-input" value={formData.phone} onChange={handleInputChange} placeholder="+63 912 345 6789" />
                  </div>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Number of Adults</label>
                    <input type="number" name="adults" className="tur-input" value={formData.adults} onChange={handleInputChange} placeholder="2" />
                  </div>
                </div>
                <div className="tur-form-group">
                  <label className="tur-form-label">Number of Children</label>
                  <input type="number" name="children" className="tur-input" value={formData.children} onChange={handleInputChange} placeholder="0" />
                </div>
              </div>

              <div className="tur-form-section" style={{marginTop: '25px'}}>
                <h3 className="tur-section-title">Package Details</h3>
                <div className="tur-form-group">
                  <label className="tur-form-label">Package Name <span className="tur-label-req">*</span></label>
                  <input type="text" name="packageName" className="tur-input" value={formData.packageName} onChange={handleInputChange} placeholder="e.g., El Nido Island Hopping" />
                </div>
                <div className="tur-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Destination</label>
                    <input type="text" name="destination" className="tur-input" value={formData.destination} onChange={handleInputChange} placeholder="e.g., El Nido, Palawan" />
                  </div>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Duration</label>
                    <select name="duration" className="tur-input" defaultValue="">
                      <option value="">Select Duration...</option>
                      <option value="1D">1 Day</option>
                      <option value="2D1N">2 Days, 1 Night</option>
                      <option value="3D2N">3 Days, 2 Nights</option>
                      <option value="4D3N">4 Days, 3 Nights</option>
                      <option value="5D4N">5 Days, 4 Nights</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="tur-form-section" style={{marginTop: '25px'}}>
                <h3 className="tur-section-title">Travel Dates</h3>
                <div className="tur-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Departure Date</label>
                    <input type="date" name="travelDate" className="tur-input" value={formData.travelDate} onChange={handleInputChange} />
                  </div>
                  <div className="tur-form-group">
                    <label className="tur-form-label">Return Date</label>
                    <input type="date" name="returnDate" className="tur-input" value={formData.returnDate} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="tur-form-section" style={{marginTop: '25px'}}>
                <h3 className="tur-section-title">Special Requests (Optional)</h3>
                <div className="tur-form-group">
                  <textarea 
                    name="specialRequests" 
                    className="tur-input" 
                    value={formData.specialRequests} 
                    onChange={handleInputChange}
                    placeholder="Any special requests or dietary restrictions..."
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="tur-footer">
              <button className="tur-btn tur-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="tur-btn tur-btn-primary" onClick={submitTour} disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Tour Package"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="tur-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="tur-title">Success!</h2>
             <p className="tur-subtitle">Walk-in tour package for {formData.clientName} has been recorded.</p>
             <button className="tur-btn tur-btn-primary tur-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};