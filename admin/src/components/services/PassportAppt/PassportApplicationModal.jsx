import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, User, Mail, FileText, Upload, DollarSign } from "lucide-react";
import "./PassportModals.css"; 

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (Added for Activity Logs) 🔥🔥🔥
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        console.log('📊 Admin Data from localStorage:', adminData);
        
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return {
            userEmail: 'Unknown Admin',
            adminId: null
        };
    }
};

const PassportApplicationModal = ({ isOpen, onClose, refreshData, passportServices = [] }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "", 
    contactNumber: "",
    applicationType: "NEW", // NEW, RENEWAL
    processingType: "", 
    serviceId: "", 
    message: "Walk-in Application",
    files: {} 
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleServiceChange = (e) => {
      const selectedId = e.target.value;
      const selectedService = passportServices.find(s => s._id === selectedId);
      
      setFormData(prev => ({
          ...prev,
          serviceId: selectedId,
          processingType: selectedService ? selectedService.documentType : prev.processingType
      }));
  }

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
    if (!formData.email || !formData.givenName || !formData.lastName || !formData.serviceId) {
      alert("Please fill in Name, Email, and select a Service.");
      return;
    }

    setIsLoading(true);
    try {
      // 🔥 GET ADMIN DATA
      const { userEmail, adminId } = getAdminData();
      console.log('🔍 Submitting Passport Application with admin data:', { userEmail, adminId });

      const data = new FormData();
      
      const selectedService = passportServices.find(s => s._id === formData.serviceId);
      
      // Mapped to Inquiry Model requirements
      data.append('serviceName', selectedService ? selectedService.documentType : 'Passport Appointment');
      data.append('inquiryType', 'PASSPORT'); 
      data.append('fullName', `${formData.givenName} ${formData.lastName}`);
      data.append('email', formData.email); 
      data.append('contactNumber', formData.contactNumber);
      data.append('message', `${formData.message} | Type: ${formData.applicationType}`);
      
      // Get price from the selected Service
      data.append('estimatedPrice', selectedService ? selectedService.price : 0);
      
      // Passport Specific Details structure
      const passportDetails = {
          applicationType: formData.applicationType,
          dfaLocation: 'Walk-in/TBD' 
      };
      data.append('passportDetails', JSON.stringify(passportDetails));

      // 🔥🔥🔥 ADD ADMIN DATA FOR LOGS 🔥🔥🔥
      data.append('uploader', 'ADMIN_WALKIN');
      data.append('userEmail', userEmail);
      data.append('adminId', adminId);

      // Append Walk-in attachments
      Object.keys(formData.files).forEach(key => {
        data.append(key, formData.files[key]);
      });

      const response = await axios.post('/api/inquiries/upload-application', data, {
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
    setFormData({ 
        givenName: "", lastName: "", email: "", contactNumber: "", 
        applicationType: "NEW", processingType: "", serviceId: "", 
        message: "Walk-in Application", files: {} 
    });
    onClose();
  };

  return (
    <div className="ppt-overlay" onClick={(e) => e.target.className === "ppt-overlay" && onClose()}>
      <div className={`ppt-modal ${step === 1 ? "ppt-modal-lg" : "ppt-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="ppt-header">
              <div className="ppt-title-group">
                <h2 className="ppt-title">Add Walk-in Applicant</h2>
                <span className="ppt-subtitle">Register a new Passport appointment manually</span>
              </div>
              <button className="ppt-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="ppt-body">
              <div className="ppt-form-section">
                <h3 className="ppt-section-title">Client Information</h3>
                <div className="ppt-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="ppt-form-group">
                    <label className="ppt-form-label">Given Name <span className="ppt-label-req">*</span></label>
                    <input type="text" name="givenName" className="ppt-input" value={formData.givenName} onChange={handleInputChange} />
                  </div>
                  <div className="ppt-form-group">
                    <label className="ppt-form-label">Last Name <span className="ppt-label-req">*</span></label>
                    <input type="text" name="lastName" className="ppt-input" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="ppt-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                  <div className="ppt-form-group">
                    <label className="ppt-form-label">Email <span className="ppt-label-req">*</span></label>
                    <input type="email" name="email" className="ppt-input" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="ppt-form-group">
                    <label className="ppt-form-label">Contact No.</label>
                    <input type="text" name="contactNumber" className="ppt-input" value={formData.contactNumber} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="ppt-form-section" style={{marginTop: '25px'}}>
                <h3 className="ppt-section-title">Service Details</h3>
                <div className="ppt-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    <div className="ppt-form-group">
                        <label className="ppt-form-label">Application Type</label>
                        <select name="applicationType" className="ppt-input" value={formData.applicationType} onChange={handleInputChange}>
                            <option value="NEW">New Application</option>
                            <option value="RENEWAL">Renewal</option>
                            <option value="LOST">Lost Passport</option>
                        </select>
                    </div>
                    <div className="ppt-form-group">
                        <label className="ppt-form-label">Service / Processing <span className="ppt-label-req">*</span></label>
                        <select name="serviceId" className="ppt-input" value={formData.serviceId} onChange={handleServiceChange}>
                            <option value="">Select Service (Price)...</option>
                            {passportServices.map((doc) => (
                            <option key={doc._id} value={doc._id}>{doc.documentType} - ₱{doc.price}</option>
                            ))}
                        </select>
                    </div>
                </div>
              </div>

              <div className="ppt-form-section" style={{marginTop: '25px'}}>
                <h3 className="ppt-section-title">Attachments</h3>
                <div className="ppt-form-group">
                  <label className="ppt-form-label">Requirement Document (PSA/ID)</label>
                  <div className="ppt-file-wrapper">
                    <input type="file" className="ppt-hidden-input" id="walkin-file" onChange={(e) => handleFileChange(e, 'walkInDoc')} />
                    <label htmlFor="walkin-file" className="ppt-file-btn"><Upload size={18}/><span>{formData.files.walkInDoc ? formData.files.walkInDoc.name : "Choose file"}</span></label>
                  </div>
                  <span className="ppt-hint" style={{marginTop: '8px', display: 'block', fontSize: '12px', color: '#64748b'}}>
                    This will appear in "Submitted Documents (Requirements)" section
                  </span>
                </div>
              </div>
            </div>

            <div className="ppt-footer">
              <button className="ppt-btn ppt-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="ppt-btn ppt-btn-primary" onClick={submitApplication} disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Appointment"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="ppt-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="ppt-title">Success!</h2>
             <p className="ppt-subtitle">Passport appointment for {formData.givenName} has been recorded.</p>
             <button className="ppt-btn ppt-btn-primary ppt-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportApplicationModal;