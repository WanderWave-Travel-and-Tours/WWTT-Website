import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, User, Mail, FileText, Upload, DollarSign } from "lucide-react";
import "./CenomarModals.css"; // Reuse your existing modal styles

export const CenomarApplicationModal = ({ isOpen, onClose, refreshData, cenomarDocs = [] }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "", 
    contactNumber: "",
    cenomarType: "", 
    message: "Walk-in Application",
    files: {} 
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        files: { ...prev.files, [fieldName]: file }
      }));
    }
  };

  const submitApplication = async () => {
    if (!formData.email || !formData.givenName || !formData.cenomarType) {
      alert("Please fill in Name, Email, and Service Type.");
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      
      // Mapped to Inquiry Model requirements
      data.append('serviceName', formData.cenomarType);
      data.append('inquiryType', 'CENOMAR'); 
      data.append('fullName', `${formData.givenName} ${formData.lastName}`);
      data.append('email', formData.email); 
      data.append('contactNumber', formData.contactNumber);
      data.append('message', formData.message);
      
      // Get price from the selected CENOMAR configuration
      const selectedDoc = cenomarDocs.find(p => p.documentType === formData.cenomarType);
      data.append('estimatedPrice', selectedDoc ? selectedDoc.price : 0);
      data.append('cenomarDocument', formData.cenomarType);

      // Append Walk-in attachments
      Object.keys(formData.files).forEach(key => {
        data.append(key, formData.files[key]);
      });

      const response = await axios.post('https://wanderwaveph-backend.onrender.com0/api/inquiries/upload-application', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStep(2); 
        if (refreshData) refreshData(); 
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Failed to add walk-in applicant");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ givenName: "", lastName: "", email: "", contactNumber: "", cenomarType: "", message: "Walk-in Application", files: {} });
    onClose();
  };

  return (
    <div className="cnm-overlay" onClick={(e) => e.target.className === "cnm-overlay" && onClose()}>
      <div className={`cnm-modal ${step === 1 ? "cnm-modal-lg" : "cnm-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="cnm-header">
              <div className="cnm-title-group">
                <h2 className="cnm-title">Add Walk-in Applicant</h2>
                <span className="cnm-subtitle">Register a new CENOMAR request manually</span>
              </div>
              <button className="cnm-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="cnm-body">
              <div className="cnm-form-section">
                <h3 className="cnm-section-title">Client Information</h3>
                <div className="cnm-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="cnm-form-group">
                    <label className="cnm-form-label">Given Name <span className="cnm-label-req">*</span></label>
                    <input type="text" name="givenName" className="cnm-input" value={formData.givenName} onChange={handleInputChange} />
                  </div>
                  <div className="cnm-form-group">
                    <label className="cnm-form-label">Last Name <span className="cnm-label-req">*</span></label>
                    <input type="text" name="lastName" className="cnm-input" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="cnm-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                  <div className="cnm-form-group">
                    <label className="cnm-form-label">Email <span className="cnm-label-req">*</span></label>
                    <input type="email" name="email" className="cnm-input" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="cnm-form-group">
                    <label className="cnm-form-label">Contact No.</label>
                    <input type="text" name="contactNumber" className="cnm-input" value={formData.contactNumber} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="cnm-form-section" style={{marginTop: '25px'}}>
                <h3 className="cnm-section-title">Service Details</h3>
                <div className="cnm-form-group">
                  <label className="cnm-form-label">CENOMAR Service <span className="cnm-label-req">*</span></label>
                  <select name="cenomarType" className="cnm-input" value={formData.cenomarType} onChange={handleInputChange}>
                    <option value="">Select CENOMAR Configuration...</option>
                    {cenomarDocs.map((doc) => (
                      <option key={doc._id} value={doc.documentType}>{doc.documentType} - ₱{doc.price}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cnm-form-section" style={{marginTop: '25px'}}>
                <h3 className="cnm-section-title">Attachments</h3>
                <div className="cnm-form-group">
                  <label className="cnm-form-label">Requirement Document (ID/Form)</label>
                  <div className="cnm-file-wrapper">
                    <input type="file" className="cnm-hidden-input" id="walkin-file" onChange={(e) => handleFileChange(e, 'walkInDoc')} />
                    <label htmlFor="walkin-file" className="cnm-file-btn"><Upload size={18}/><span>{formData.files.walkInDoc ? formData.files.walkInDoc.name : "Choose file"}</span></label>
                  </div>
                </div>
              </div>
            </div>

            <div className="cnm-footer">
              <button className="cnm-btn cnm-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="cnm-btn cnm-btn-primary" onClick={submitApplication} disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Request"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="cnm-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="cnm-title">Success!</h2>
             <p className="cnm-subtitle">Walk-in request for {formData.givenName} has been recorded.</p>
             <button className="cnm-btn cnm-btn-primary cnm-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};