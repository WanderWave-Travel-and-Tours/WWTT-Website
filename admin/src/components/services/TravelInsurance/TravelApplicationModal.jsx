import React, { useState } from "react";
import { X, CheckCircle, Shield, Calendar, DollarSign, User } from "lucide-react";
import "./TravelModals.css";

export const TravelApplicationModal = ({ isOpen, onClose, onAddPolicy }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client: "",
    provider: "",
    coverage: "",
    days: "1 Day",
    amount: ""
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.client || !formData.provider) return alert("Please fill required fields");
    
    const newPolicy = {
        id: `INS-${Math.floor(Math.random() * 10000)}`,
        client: formData.client,
        provider: formData.provider,
        coverage: formData.coverage || 'Standard Coverage',
        days: formData.days,
        amount: parseFloat(formData.amount) || 0,
        status: 'Pending'
    };

    onAddPolicy(newPolicy);
    setStep(2);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ client: "", provider: "", coverage: "", days: "1 Day", amount: "" });
    onClose();
  };

  return (
    <div className="tim-overlay" onClick={(e) => e.target.className === "tim-overlay" && onClose()}>
      <div className={`tim-modal ${step === 1 ? "tim-modal-lg" : "tim-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="tim-header">
              <div className="tim-title-group">
                <h2 className="tim-title">New Policy</h2>
                <span className="tim-subtitle">Issue Travel Insurance Policy</span>
              </div>
              <button className="tim-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="tim-body">
              <div className="tim-form-section">
                <h3 className="tim-section-title">Client Details</h3>
                <div className="tim-form-group">
                  <label className="tim-form-label">Insured Name</label>
                  <input type="text" name="client" className="tim-input" placeholder="Full Name" value={formData.client} onChange={handleInputChange} />
                </div>
              </div>

              <div className="tim-form-section">
                <h3 className="tim-section-title">Policy Details</h3>
                <div className="tim-form-row">
                    <div className="tim-form-group">
                        <label className="tim-form-label">Provider</label>
                        <select name="provider" className="tim-input" value={formData.provider} onChange={handleInputChange}>
                            <option value="">Select Provider...</option>
                            <option value="Standard Insurance">Standard Insurance</option>
                            <option value="Pru Life UK">Pru Life UK</option>
                            <option value="AXA Philippines">AXA Philippines</option>
                            <option value="BDO Insure">BDO Insure</option>
                        </select>
                    </div>
                    <div className="tim-form-group">
                        <label className="tim-form-label">Coverage Plan</label>
                        <input type="text" name="coverage" className="tim-input" placeholder="e.g. International Gold" value={formData.coverage} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="tim-form-row">
                    <div className="tim-form-group">
                        <label className="tim-form-label">Duration</label>
                        <input type="text" name="days" className="tim-input" placeholder="e.g. 15 Days" value={formData.days} onChange={handleInputChange} />
                    </div>
                    <div className="tim-form-group">
                        <label className="tim-form-label">Premium Amount (₱)</label>
                        <input type="number" name="amount" className="tim-input" value={formData.amount} onChange={handleInputChange} />
                    </div>
                </div>
              </div>
            </div>

            <div className="tim-footer">
              <button className="tim-btn tim-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="tim-btn tim-btn-primary" onClick={handleSubmit}>
                <Shield size={18} style={{marginRight: '8px'}}/> Issue Policy
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="tim-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="tim-title">Success!</h2>
             <p className="tim-subtitle">Policy for {formData.client} has been created.</p>
             <button className="tim-btn tim-btn-primary tim-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};