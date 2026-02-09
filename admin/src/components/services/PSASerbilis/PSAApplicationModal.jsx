import React, { useState } from "react";
import axios from "axios";
import { X, CheckCircle, User, Mail, FileText, Upload, DollarSign, HelpCircle } from "lucide-react";
import "./PSAModals.css"; 
// Inimport ang Toast Manager
import { useToast } from "../../toast/ToastManager"; 

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

// --- CUSTOM CONFIRMATION MODAL (Based on EditVisa.jsx pattern) ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="ev-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="ev-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export const PSAApplicationModal = ({ isOpen, onClose, refreshData, psaDocs = [] }) => {
  const toast = useToast(); // Initialize Toast
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // State para sa Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  // Dedicated state para sa presyo para sure na nahahawakan natin
  const [selectedPrice, setSelectedPrice] = useState(0);

  const [formData, setFormData] = useState({
    givenName: "",
    lastName: "",
    email: "", 
    contactNumber: "",
    psaDocumentType: "", // Service Name
    message: "Walk-in Application",
    files: {} 
  });

  if (!isOpen) return null;

  // Helper function para mag-trigger ng modal
  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-update price kapag namili ng PSA type
    if (name === 'psaDocumentType') {
        const selectedDoc = psaDocs.find(p => p.documentType === value);
        setSelectedPrice(selectedDoc ? selectedDoc.price : 0);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        files: { ...prev.files, [fieldName]: file }
      }));
      toast.info(`Selected file: ${file.name}`); // Gamit ang Toast
    }
  };

  // Function na mag-ti-trigger ng confirmation bago mag-submit
  const handleCreateConfirm = () => {
    if (!formData.email || !formData.givenName || !formData.psaDocumentType) {
      toast.warning("Please fill in Name, Email, and Document Type.");
      return;
    }

    askConfirmation(
      "Create Request",
      `Are you sure you want to create a walk-in request for ${formData.givenName} ${formData.lastName}?`,
      () => submitApplication(),
      "primary"
    );
  };

  const submitApplication = async () => {
    setIsLoading(true);
    try {
      // 🔥 GET ADMIN DATA
      const { userEmail, adminId } = getAdminData();
      console.log('🔍 Submitting PSA Application with admin data:', { userEmail, adminId });

      const data = new FormData();
      
      data.append('serviceName', formData.psaDocumentType);
      data.append('inquiryType', 'PSA'); 
      data.append('fullName', `${formData.givenName} ${formData.lastName}`);
      data.append('email', formData.email); 
      data.append('contactNumber', formData.contactNumber);
      data.append('message', formData.message);
      
      // CRITICAL: Ipasa ang nakuha nating price mula sa state
      data.append('estimatedPrice', selectedPrice);
      data.append('psaDocument', formData.psaDocumentType);

      data.append('documentCategory', 'REQUIREMENT');
      data.append('uploader', 'ADMIN_WALKIN');

      // 🔥🔥🔥 ADD ADMIN DATA FOR LOGS 🔥🔥🔥
      data.append('userEmail', userEmail);
      data.append('adminId', adminId);

      Object.keys(formData.files).forEach(key => {
        data.append(key, formData.files[key]);
      });

      const response = await axios.post('https://wanderwaveph.onrender.com/api/inquiries/upload-application', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success("Application created successfully!");
        setStep(2); 
        if (refreshData) refreshData(); 
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to add walk-in applicant");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ givenName: "", lastName: "", email: "", contactNumber: "", psaDocumentType: "", message: "Walk-in Application", files: {} });
    setSelectedPrice(0);
    onClose();
  };

  // Handle Close with confirmation if there is data
  const handleHeaderClose = () => {
    if (formData.givenName || formData.email) {
        askConfirmation(
            "Discard Changes",
            "You have unsaved changes. Are you sure you want to close?",
            () => resetAndClose(),
            "danger"
        );
    } else {
        resetAndClose();
    }
  };

  return (
    <>
    <div className="psam-overlay" onClick={(e) => e.target.className === "psam-overlay" && handleHeaderClose()}>
      <div className={`psam-modal ${step === 1 ? "psam-modal-lg" : "psam-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="psam-header">
              <div className="psam-title-group">
                <h2 className="psam-title">Add Walk-in Requester</h2>
                <span className="psam-subtitle">Register a new PSA request manually</span>
              </div>
              <button className="psam-close-btn" onClick={handleHeaderClose}><X size={20} /></button>
            </div>
            
            <div className="psam-body">
              <div className="psam-form-section">
                <h3 className="psam-section-title">Client Information</h3>
                <div className="psam-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Given Name <span className="psam-label-req">*</span></label>
                    <input type="text" name="givenName" className="psam-input" value={formData.givenName} onChange={handleInputChange} />
                  </div>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Last Name <span className="psam-label-req">*</span></label>
                    <input type="text" name="lastName" className="psam-input" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="psam-form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Email <span className="psam-label-req">*</span></label>
                    <input type="email" name="email" className="psam-input" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="psam-form-group">
                    <label className="psam-form-label">Contact No.</label>
                    <input type="text" name="contactNumber" className="psam-input" value={formData.contactNumber} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="psam-form-section" style={{marginTop: '25px'}}>
                <h3 className="psam-section-title">Service Details</h3>
                <div className="psam-form-group">
                  <label className="psam-form-label">PSA Document Type <span className="psam-label-req">*</span></label>
                  <select name="psaDocumentType" className="psam-input" value={formData.psaDocumentType} onChange={handleInputChange}>
                    <option value="">Select Document...</option>
                    {psaDocs.map((doc) => (
                      <option key={doc._id} value={doc.documentType}>{doc.documentType} - ₱{doc.price}</option>
                    ))}
                  </select>
                </div>
                {/* DISPLAY CONFIRMATION OF PRICE */}
                {selectedPrice > 0 && (
                      <div style={{marginTop: '10px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', fontWeight: '600'}}>
                         Current Price: ₱{selectedPrice}
                      </div>
                )}
              </div>

              <div className="psam-form-section" style={{marginTop: '25px'}}>
                <h3 className="psam-section-title">Attachments</h3>
                <div className="psam-form-group">
                  <label className="psam-form-label">Requirement Document (ID/Form)</label>
                  <div className="psam-file-wrapper">
                    <input type="file" className="psam-hidden-input" id="walkin-file" onChange={(e) => handleFileChange(e, 'walkInDoc')} />
                    <label htmlFor="walkin-file" className="psam-file-btn"><Upload size={18}/><span>{formData.files.walkInDoc ? formData.files.walkInDoc.name : "Choose file"}</span></label>
                  </div>
                  <span className="psam-hint" style={{marginTop: '8px', display: 'block', fontSize: '12px', color: '#64748b'}}>
                    This will appear in "Submitted Documents" section
                  </span>
                </div>
              </div>
            </div>

            <div className="psam-footer">
              <button className="psam-btn psam-btn-ghost" onClick={handleHeaderClose}>Cancel</button>
              <button className="psam-btn psam-btn-primary" onClick={handleCreateConfirm} disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Request"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="psam-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="psam-title">Success!</h2>
             <p className="psam-subtitle">Walk-in request for {formData.givenName} has been recorded.</p>
             <button className="psam-btn psam-btn-primary psam-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>

    {/* Render the Custom Confirmation Modal */}
    <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
};

export default PSAApplicationModal;