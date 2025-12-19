import React, { useState } from "react";
import axios from "axios";
import { X, ChevronLeft, CheckCircle, User, Mail, Phone, FileText, Upload, DollarSign } from "lucide-react";
import "./PSAApplicationModal.css";

const PSAApplicationModal = ({ isOpen, onClose, refreshData, psaDocs = [] }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Confirmation
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "", 
    contactNumber: "",
    psaDocumentType: "", // Ito ang magiging serviceName
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
    if (!formData.email || !formData.givenName || !formData.psaDocumentType) {
      alert("Please fill in Name, Email, and Document Type.");
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      
      // Mapped to Inquiry Model
      data.append('serviceName', formData.psaDocumentType);
      data.append('inquiryType', 'PSA'); // Important for filtering
      data.append('fullName', `${formData.givenName} ${formData.lastName}`);
      data.append('email', formData.email); 
      data.append('contactNumber', formData.contactNumber);
      data.append('message', formData.message);
      
      // Find price from existing PSA configurations
      const selectedPSA = psaDocs.find(p => p.documentType === formData.psaDocumentType);
      data.append('estimatedPrice', selectedPSA ? selectedPSA.price : 0);
      data.append('psaDocument', formData.psaDocumentType);

      // Append Files (IDs or scanned forms)
      Object.keys(formData.files).forEach(key => {
        data.append(key, formData.files[key]);
      });

      const response = await axios.post('http://localhost:5000/api/inquiries/upload-application', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStep(2); 
        if (refreshData) refreshData(); 
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Failed to add walk-in record");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ givenName: "", lastName: "", email: "", contactNumber: "", psaDocumentType: "", message: "Walk-in Application", files: {} });
    onClose();
  };

  return (
    <div className="psam-overlay" onClick={(e) => e.target.className === "psam-overlay" && onClose()}>
      <div className={`psam-modal ${step === 1 ? "psam-modal-lg" : "psam-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="psam-header">
              <div className="psam-title-group">
                <h2 className="psam-title">Add Walk-in Requester</h2>
                <span className="psam-subtitle">Create a new PSA request record manually</span>
              </div>
              <button className="psam-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="psam-body">
              <div className="psam-form-section">
                <h3 className="psam-section-title"><User size={18}/> Client Information</h3>
                <div className="psam-form-row" style={{gridTemplateColumns: '1fr 1fr'}}>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Given Name <span className="psam-label-req">*</span></label>
                    <input type="text" name="givenName" className="psam-input" value={formData.givenName} onChange={handleInputChange} />
                  </div>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Last Name <span className="psam-label-req">*</span></label>
                    <input type="text" name="lastName" className="psam-input" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="psam-form-row" style={{gridTemplateColumns: '1fr 1fr'}}>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Email Address <span className="psam-label-req">*</span></label>
                    <input type="email" name="email" className="psam-input" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Contact Number</label>
                    <input type="text" name="contactNumber" className="psam-input" value={formData.contactNumber} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="psam-form-section">
                <h3 className="psam-section-title"><FileText size={18}/> Service Details</h3>
                <div className="psam-form-group">
                  <label className="psam-form-label">Document Type <span className="psam-label-req">*</span></label>
                  <select name="psaDocumentType" className="psam-input" value={formData.psaDocumentType} onChange={handleInputChange}>
                    <option value="">Select PSA Service...</option>
                    {psaDocs.map((psa) => (
                      <option key={psa.id} value={psa.documentType}>{psa.documentType} - ₱{psa.price}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="psam-form-section">
                <h3 className="psam-section-title"><Upload size={18}/> Attachments (IDs/Forms)</h3>
                <div className="psam-grid">
                   <div className="psam-form-group">
                      <label className="psam-form-label">ID or Scanned Form</label>
                      <input type="file" onChange={(e) => handleFileChange(e, 'walkInDoc')} />
                   </div>
                </div>
              </div>
            </div>

            <div className="psam-footer">
              <button className="psam-btn psam-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="psam-btn psam-btn-primary" onClick={submitApplication} disabled={isLoading}>
                {isLoading ? "Saving..." : "Add Record"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="psam-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="psam-title">Request Added!</h2>
             <p className="psam-subtitle">Walk-in record for {formData.givenName} has been created.</p>
             <button className="psam-btn psam-btn-primary psam-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PSAApplicationModal;