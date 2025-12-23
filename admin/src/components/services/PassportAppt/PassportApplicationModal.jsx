import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, User, Mail, FileText, Upload, Globe, Zap } from "lucide-react";

const PassportApplicationModal = ({ isOpen, onClose, refreshData, passportData }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "", 
    contactNumber: "",
    applicationType: "NEW", // NEW, RENEWAL, etc.
    processingType: "REGULAR", // REGULAR, EXPEDITE
    message: "Walk-in Passport Appointment",
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
    if (!formData.email || !formData.givenName || !formData.lastName) {
      alert("Please fill in the required client information.");
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      
      // Mapped to Inquiry Model
      data.append('serviceName', 'Passport Appointment');
      data.append('inquiryType', 'PASSPORT'); 
      data.append('fullName', `${formData.givenName} ${formData.lastName}`);
      data.append('email', formData.email); 
      data.append('contactNumber', formData.contactNumber);
      
      // Determine Price based on Processing Type
      const selectedType = passportData?.processingTypes?.find(t => t.type === formData.processingType);
      data.append('estimatedPrice', selectedType ? selectedType.price : 1500);

      const detailedMessage = `${formData.message} | Type: ${formData.applicationType} | Processing: ${formData.processingType}`;
      data.append('message', detailedMessage);

      // Append Files
      Object.keys(formData.files).forEach(key => {
        data.append(key, formData.files[key]);
      });

      const response = await axios.post('https://wanderwaveph-backend.onrender.com/api/inquiries/upload-application', data, {
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
    setFormData({ givenName: "", lastName: "", email: "", contactNumber: "", applicationType: "NEW", processingType: "REGULAR", message: "Walk-in Passport Appointment", files: {} });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
      <div className={`modal-content ${step === 1 ? "modal-content-large" : ""}`} style={{maxWidth: step === 1 ? '800px' : '450px'}}>
        
        {step === 1 && (
          <>
            <div className="modal-header">
              <div>
                <h3 style={{margin:0, color:'#0f172a'}}>Add Walk-in Appointment</h3>
                <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Register a new manual passport applicant</p>
              </div>
              <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{padding:'24px'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}>Given Name *</label>
                  <input type="text" name="givenName" className="visa-input" value={formData.givenName} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}>Last Name *</label>
                  <input type="text" name="lastName" className="visa-input" value={formData.lastName} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}>Email Address *</label>
                  <input type="email" name="email" className="visa-input" value={formData.email} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                </div>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}>Contact Number</label>
                  <input type="text" name="contactNumber" className="visa-input" value={formData.contactNumber} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}><Globe size={14}/> Application Type</label>
                  <select name="applicationType" className="visa-input" value={formData.applicationType} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                    <option value="NEW">New Application</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="LOST">Lost Passport</option>
                    <option value="DAMAGED">Damaged Passport</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}><Zap size={14}/> Processing Type</label>
                  <select name="processingType" className="visa-input" value={formData.processingType} onChange={handleInputChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                    <option value="REGULAR">Regular (₱1,500)</option>
                    <option value="EXPEDITE">Expedite (₱2,500)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}><Upload size={14}/> Attachment (PSA Birth / ID)</label>
                <input type="file" onChange={(e) => handleFileChange(e, 'walkInDoc')} style={{display:'block', marginTop:'5px'}} />
              </div>
            </div>

            <div className="modal-footer" style={{padding:'16px 24px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'12px'}}>
              <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
              <button className="modal-save-btn" onClick={submitApplication} disabled={isLoading} style={{backgroundColor:'#0f172a', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontWeight:'600'}}>
                {isLoading ? "Saving..." : "Create Appointment"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="modal-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h3 style={{color:'#0f172a'}}>Appointment Created!</h3>
             <p style={{color:'#64748b'}}>Manual record for {formData.givenName} is now in the system.</p>
             <button className="modal-save-btn" style={{marginTop: '20px', width:'100%'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportApplicationModal;