import React, { useState } from "react";
import { X, CheckCircle, Heart, Calendar, Users, Copy } from "lucide-react";
import "./MarriageModals.css";

export const MarriageApplicationModal = ({ isOpen, onClose, onAddRequest }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    husband: "",
    wife: "",
    dateMarried: "",
    copies: 1
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.husband || !formData.wife) return alert("Please fill required fields");
    
    // Create mock request object
    const newReq = {
        id: `MC-${Math.floor(Math.random() * 10000)}`,
        husband: formData.husband,
        wife: formData.wife,
        dateMarried: formData.dateMarried || new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
        copies: formData.copies,
        status: 'Pending'
    };

    onAddRequest(newReq);
    setStep(2);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ husband: "", wife: "", dateMarried: "", copies: 1 });
    onClose();
  };

  return (
    <div className="mcm-overlay" onClick={(e) => e.target.className === "mcm-overlay" && onClose()}>
      <div className={`mcm-modal ${step === 1 ? "mcm-modal-lg" : "mcm-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="mcm-header">
              <div className="mcm-title-group">
                <h2 className="mcm-title">New Request</h2>
                <span className="mcm-subtitle">Add Marriage Certificate Application</span>
              </div>
              <button className="mcm-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="mcm-body">
              <div className="mcm-form-section">
                <h3 className="mcm-section-title">
                    <Users size={18} style={{marginRight: '8px', color: '#be185d'}}/> 
                    Couple Details
                </h3>
                <div className="mcm-form-row">
                  <div className="mcm-form-group">
                    <label className="mcm-form-label">Husband's Name</label>
                    <input 
                        type="text" 
                        name="husband" 
                        className="mcm-input" 
                        placeholder="First Name Last Name"
                        value={formData.husband} 
                        onChange={handleInputChange} 
                    />
                  </div>
                  <div className="mcm-form-group">
                    <label className="mcm-form-label">Wife's Maiden Name</label>
                    <input 
                        type="text" 
                        name="wife" 
                        className="mcm-input" 
                        placeholder="First Name Maiden Name"
                        value={formData.wife} 
                        onChange={handleInputChange} 
                    />
                  </div>
                </div>
                
                <div className="mcm-form-row">
                    <div className="mcm-form-group">
                        <label className="mcm-form-label">Date of Marriage</label>
                        <div style={{position: 'relative'}}>
                            <input 
                                type="date" 
                                name="dateMarried" 
                                className="mcm-input" 
                                value={formData.dateMarried} 
                                onChange={handleInputChange} 
                            />
                            <Calendar size={16} style={{position: 'absolute', right: '12px', top: '14px', color: '#64748b', pointerEvents: 'none'}}/>
                        </div>
                    </div>
                    <div className="mcm-form-group">
                        <label className="mcm-form-label">Number of Copies</label>
                        <div style={{position: 'relative'}}>
                            <input 
                                type="number" 
                                name="copies" 
                                className="mcm-input" 
                                min="1" 
                                value={formData.copies} 
                                onChange={handleInputChange} 
                            />
                            <Copy size={16} style={{position: 'absolute', right: '12px', top: '14px', color: '#64748b', pointerEvents: 'none'}}/>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="mcm-footer">
              <button className="mcm-btn mcm-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="mcm-btn mcm-btn-primary" onClick={handleSubmit}>
                <Heart size={18} style={{marginRight: '8px'}}/> Confirm Request
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="mcm-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="mcm-title">Success!</h2>
             <p className="mcm-subtitle">Request for <strong>{formData.husband} & {formData.wife}</strong> has been successfully added.</p>
             <button className="mcm-btn mcm-btn-primary mcm-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};