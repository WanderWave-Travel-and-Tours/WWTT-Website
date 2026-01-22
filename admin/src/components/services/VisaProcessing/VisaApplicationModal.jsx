import React, { useState } from "react";
import axios from "axios";
import { 
  X, ChevronLeft, CheckCircle, ClipboardList, FileText, User, 
  DollarSign, Briefcase, Building2, GraduationCap, Users, 
  Calendar, Globe, UserCircle, Baby, ChevronRight, HelpCircle 
} from "lucide-react";
import { useToast } from "../../toast/ToastManager"; // In-import ang useToast
import "./VisaApplicationModal.css";

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA 🔥🔥🔥
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

// --- CUSTOM CONFIRMATION MODAL (Reference from EditVisa.jsx) ---
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

const VisaApplicationModal = ({ isOpen, onClose, refreshData, visaForms = [] }) => {
  const toast = useToast(); // Initialize toast system
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Form, 3: Confirmation
  const [applicantType, setApplicantType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  const [formData, setFormData] = useState({
    travelDate: "",
    lengthOfStay: "",
    visaType: "", 
    givenName: "",
    lastName: "",
    otherNames: "",
    email: "", 
    contactNumber: "",
    files: {} 
  });

  if (!isOpen) return null;

  // Helper para sa confirmation modal logic
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

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const handleApplicantTypeSelect = (type) => {
    setApplicantType(type);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "lengthOfStay") {
        if (value === '') {
             setFormData({ ...formData, [name]: value });
             return;
        }
        if (!/^\d+$/.test(value)) {
            toast.warning("Invalid input for Length of Stay. Only non-negative whole numbers (days) are allowed.");
            return;
        }
        if (value.length > 2) {
             toast.warning("Length of Stay cannot exceed 2 digits (99 days max).");
             return;
        }
    }

    if (name === "travelDate") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0); 

        if (selectedDate < tomorrow) {
            toast.error("Travel Date must be tomorrow or later.");
            setFormData({ ...formData, [name]: "" }); 
            e.target.value = "";
            return;
        }
    }

    if (name === "givenName" || name === "lastName" || name === "otherNames") {
        if (/\d/.test(value)) {
            toast.warning(`Numbers are not allowed in ${name}.`);
            return;
        }
    }

    if (name === "contactNumber") {
        if (value.length > 15) {
            toast.warning("Contact Number cannot exceed 15 characters.");
            return; 
        }
        const validPattern = /^\+?[0-9]*$/;
        if (!validPattern.test(value)) {
            toast.warning("Only numbers and a leading '+' are allowed in Contact Number.");
            return;
        }
    }
    
    if (name === "email") {
        if (/\s/.test(value)) {
            toast.warning("Email cannot contain spaces.");
            return; 
        }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    const documentExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    const photoExtensions = ['.jpg', '.jpeg', '.webp', '.png'];

    let allowedExtensions = documentExtensions;
    let extensionMessage = "PDF, DOCX, PNG, JPG, and JPEG";

    if (fieldName === 'photo') {
        allowedExtensions = photoExtensions;
        extensionMessage = "JPG, JPEG, WEBP, and PNG";
    }

    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        toast.error(`Invalid file type for ${fieldName}. Only ${extensionMessage} are allowed.`);
        e.target.value = ''; 
        return; 
      }

      setFormData(prev => ({
        ...prev,
        files: { ...prev.files, [fieldName]: file }
      }));
      toast.info(`Selected file: ${file.name}`);
    } else {
        setFormData(prev => {
            const newFiles = { ...prev.files };
            delete newFiles[fieldName];
            return { ...prev, files: newFiles }
        });
    }
  };

  const handleSaveConfirmation = () => {
    // Kinukuha lahat ng required validation checks bago mag confirm
    askConfirmation(
      "Submit Application",
      "Are you sure you want to add this applicant and upload all documents?",
      () => submitApplication()
    );
  };

  const handleDiscardPrompt = () => {
    // Check kung may input na bago mag tanong ng discard
    const hasInput = formData.givenName || formData.lastName || formData.email || Object.keys(formData.files).length > 0;
    
    if (hasInput) {
        askConfirmation(
            "Discard Changes",
            "Are you sure you want to close? All entered information will be lost.",
            () => resetAndClose(),
            "danger"
        );
    } else {
        resetAndClose();
    }
  };

  const submitApplication = async () => {
    const requiredTextFields = [
        { field: 'visaType', label: 'Visa Type' },
        { field: 'travelDate', label: 'Travel Date' },
        { field: 'lengthOfStay', label: 'Length of Stay (Days)' },
        { field: 'givenName', label: 'Given Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'email', label: 'Email Address' },
        { field: 'contactNumber', label: 'Contact Number' },
    ];

    const requiredFileFields = [
        { field: 'passport', label: 'Passport' },
        { field: 'photo', label: 'Photo' },
        { field: 'appForm', label: 'Accomplished Application Form' },
        { field: 'psaBirth', label: 'Original PSA Birth Certificate' },
        { field: 'psaMarriage', label: 'Original PSA Marriage Certificate (if Married)' }, 
        { field: 'schedule', label: 'Daily Schedule in Japan' },
        { field: 'baptismal', label: 'Baptismal Certificate/Form 137 (for Late Registration)' },
        { field: 'bankCert', label: 'Original Bank Certificate' },
        { field: 'itr', label: 'ITR (Income Tax Return)' },
        { field: 'noItrLetter', label: 'Letter (if there is no ITR)' },
        { field: 'bankStatement', label: 'Bank Statement (if there is no ITR)' },
    ];

    for (const req of requiredTextFields) {
        if (!formData[req.field]) {
            toast.error(`MANDATORY: ${req.label} is required.`);
            return;
        }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return;
    }

    for (const req of requiredFileFields) {
        if (!formData.files[req.field]) {
            toast.error(`MANDATORY FILE: ${req.label} is required.`);
            return;
        }
    }
    
    const lengthOfStayValue = parseInt(formData.lengthOfStay, 10);
    if (lengthOfStayValue <= 0 || lengthOfStayValue > 99) {
         toast.error("Length of Stay must be between 1-99 days.");
         return;
    }
    
    const cleanNumber = formData.contactNumber.replace(/[^0-9]/g, ''); 
    if (cleanNumber.length < 7) {
        toast.error("Contact Number must be at least 7 digits.");
        return;
    }

    setIsLoading(true);
    try {
        const { userEmail, adminId } = getAdminData();
        const data = new FormData();
        const serviceName = formData.visaType; 

        data.append('serviceName', serviceName);
        data.append('inquiryType', 'VISA');
        data.append('fullName', `${formData.givenName} ${formData.lastName}`);
        data.append('email', formData.email); 
        data.append('contactNumber', formData.contactNumber);
        
        const selectedVisa = visaForms.find(v => v.description === formData.visaType || v.desc === formData.visaType);
        const country = selectedVisa ? selectedVisa.country : 'Japan'; 
        const price = selectedVisa ? selectedVisa.price : 0;

        const message = `Application for ${formData.visaType}. Travel Date: ${formData.travelDate || 'N/A'}, Length of Stay: ${formData.lengthOfStay || 'N/A'} days.`;
        data.append('message', message);
        data.append('visaCountry', country); 
        data.append('estimatedPrice', price); 
        data.append('uploader', 'ADMIN_WALKIN');
        data.append('userEmail', userEmail);
        data.append('adminId', adminId);

        Object.keys(formData.files).forEach(key => {
            data.append(key, formData.files[key]);
        });

        // 3. Send Request
        const response = await axios.post('http://localhost:5000/api/inquiries/upload-application', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            toast.success("Applicant successfully added!");
            handleNextStep(); 
            if (refreshData) refreshData(); 
        }
    } catch (error) {
        console.error("Error submitting application:", error);
        toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
        setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setApplicantType("");
    setFormData({
        travelDate: "", lengthOfStay: "", visaType: "",
        givenName: "", lastName: "", otherNames: "",
        email: "", contactNumber: "", files: {}
    });
    onClose();
  };

  return (
    <>
      {/* --- STEP 1: SELECT APPLICANT TYPE --- */}
      {step === 1 && (
        <div className="select-applicant-overlay" onClick={(e) => e.target.className === "select-applicant-overlay" && onClose()}>
          <div className="select-applicant-modal">
            <div className="select-applicant-header">
                <h2>Select Applicant Type</h2>
                <p>Choose the appropriate category for your visa application</p>
              <button className="select-close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="select-applicant-body">
              <div className="applicant-type-cards">
                <div 
                  className={`applicant-type-card ${applicantType === "Adult" ? "selected" : ""}`}
                  onClick={() => handleApplicantTypeSelect("Adult")}
                >
                  <div className="card-icon-wrapper"><UserCircle size={40} /></div>
                  <h3 className="card-type-label">Adult</h3>
                  <p className="card-type-desc">For applicants 18 years old and above</p>
                  <span className="selection-indicator">Selected</span>
                </div>

                <div 
                  className={`applicant-type-card ${applicantType === "Child" ? "selected" : ""}`}
                  onClick={() => handleApplicantTypeSelect("Child")}
                >
                  <div className="card-icon-wrapper"><Baby size={40} /></div>
                  <h3 className="card-type-label">Child</h3>
                  <p className="card-type-desc">For applicants below 18 years old</p>
                  <span className="selection-indicator">Selected</span>
                </div>
              </div>

              <div className="select-applicant-footer">
                <button className="select-cancel-btn" onClick={onClose}>Cancel</button>
                <button 
                  className="select-continue-btn" 
                  onClick={handleNextStep}
                  disabled={!applicantType}
                >
                  <span>Continue</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 2: APPLICATION FORM --- */}
      {step === 2 && (
        <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && handleDiscardPrompt()}>
          <div className="modal-content modal-content-xl">
            <div className="modal-header">
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <button className="back-icon-btn" onClick={handlePrevStep}><ChevronLeft size={20}/></button>
                <div>
                    <h3>Add Applicant</h3>
                    <p className="modal-header-subtitle">Applicant Type: <strong>{applicantType}</strong></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleDiscardPrompt}><X size={24} /></button>
            </div>
            
            <div className="form-scroll-body">
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Calendar size={20} color="#f97316" /></div>
                  <h4 className="section-title">Application Details</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Travel Date <span className="req">*</span></label>
                        <input type="date" name="travelDate" value={formData.travelDate} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Length of Stay (Days) <span className="req">*</span></label>
                        <input type="number" name="lengthOfStay" value={formData.lengthOfStay} onChange={handleInputChange} min="1" max="99" />
                    </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Globe size={20} color="#f97316" /></div>
                  <h4 className="section-title">Visa Request</h4>
                </div>
                <div className="form-group">
                    <label>Visa Type <span className="req">*</span></label>
                    <select name="visaType" value={formData.visaType} onChange={handleInputChange}>
                        <option value="">Select Visa Configuration...</option>
                        {visaForms && visaForms.length > 0 ? (
                            visaForms.map((visa) => (
                                <option key={visa.id} value={visa.desc || visa.description}>{visa.desc || visa.description}</option>
                            ))
                        ) : (
                            <option value="" disabled>No Visa settings found.</option>
                        )}
                    </select>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><User size={20} color="#f97316" /></div>
                  <h4 className="section-title">Basic Information</h4>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Given Name <span className="req">*</span></label>
                        <input type="text" name="givenName" value={formData.givenName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name <span className="req">*</span></label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Email Address <span className="req">*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Required" />
                    </div>
                    <div className="form-group">
                        <label>Contact Number <span className="req">*</span></label>
                        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="e.g., +639xxxxxxxxx" />
                    </div>
                    <div className="form-group form-full">
                        <label>Other Names (Optional)</label>
                        <input type="text" name="otherNames" value={formData.otherNames} onChange={handleInputChange} />
                    </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><FileText size={20} color="#f97316" /></div>
                  <h4 className="section-title">Primary Requirements</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Passport *" fieldName="passport" currentFile={formData.files['passport']} onChange={handleFileChange} />
                    <FileUploadField label="Photo *" fieldName="photo" currentFile={formData.files['photo']} onChange={handleFileChange} /> 
                    <FileUploadField label="Accomplished Application Form *" fieldName="appForm" currentFile={formData.files['appForm']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Birth Certificate *" fieldName="psaBirth" currentFile={formData.files['psaBirth']} onChange={handleFileChange} />
                    <FileUploadField label="Original PSA Marriage Certificate (if Married) *" fieldName="psaMarriage" currentFile={formData.files['psaMarriage']} onChange={handleFileChange} />
                    <FileUploadField label="Daily Schedule in Japan *" fieldName="schedule" currentFile={formData.files['schedule']} onChange={handleFileChange} />
                    <FileUploadField label="Baptismal Certificate/Form 137 (for Late Registration) *" fieldName="baptismal" currentFile={formData.files['baptismal']} onChange={handleFileChange} />
                </div>
              </div>

               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><DollarSign size={20} color="#f97316" /></div>
                  <h4 className="section-title">Financial Requirements</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Original Bank Certificate *" fieldName="bankCert" currentFile={formData.files['bankCert']} onChange={handleFileChange} />
                    <FileUploadField label="ITR (Income Tax Return) *" fieldName="itr" currentFile={formData.files['itr']} onChange={handleFileChange} />
                    <FileUploadField label="Letter (if there is no ITR) *" fieldName="noItrLetter" currentFile={formData.files['noItrLetter']} onChange={handleFileChange} />
                    <FileUploadField label="Bank Statement (if there is no ITR) *" fieldName="bankStatement" currentFile={formData.files['bankStatement']} onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Briefcase size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Employed</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Original Signed Certificate of Employment" fieldName="coe" currentFile={formData.files['coe']} onChange={handleFileChange} />
                    <FileUploadField label="Company ID" fieldName="companyId" currentFile={formData.files['companyId']} onChange={handleFileChange} />
                    <FileUploadField label="PRC or IBP Card – for Professionals" fieldName="prcId" currentFile={formData.files['prcId']} onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Building2 size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Business Owner</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="DTI or SEC Permit" fieldName="dtiSec" currentFile={formData.files['dtiSec']} onChange={handleFileChange} />
                    <FileUploadField label="Business Permit" fieldName="businessPermit" currentFile={formData.files['businessPermit']} onChange={handleFileChange} />
                    <FileUploadField label="BIR company registration" fieldName="birReg" currentFile={formData.files['birReg']} onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><GraduationCap size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Student</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="School Certificate" fieldName="schoolCert" currentFile={formData.files['schoolCert']} onChange={handleFileChange} />
                    <FileUploadField label="School ID" fieldName="schoolId" currentFile={formData.files['schoolId']} onChange={handleFileChange} />
                </div>
              </div>

               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Users size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Senior Citizen</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Senior Citizen ID" fieldName="seniorId" currentFile={formData.files['seniorId']} onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><Users size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Sponsored</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Proof of Relationship - APPLICANT and GUARANTOR" fieldName="proofRel" currentFile={formData.files['proofRel']} onChange={handleFileChange} />
                    <FileUploadField label="Guarantee Letter" fieldName="guaranteeLetter" currentFile={formData.files['guaranteeLetter']} onChange={handleFileChange} />
                </div>
              </div>

               <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><ClipboardList size={20} color="#f97316" /></div>
                  <h4 className="section-title">If Requesting for Multiple Entry</h4>
                </div>
                <div className="form-grid">
                    <FileUploadField label="Multiple Entry Request Form" fieldName="multipleEntry" currentFile={formData.files['multipleEntry']} onChange={handleFileChange} />
                </div>
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon"><FileText size={20} color="#f97316" /></div>
                  <h4 className="section-title">Additional Documents</h4>
                </div>
                 <p className="upload-note">Upload all other documents related to this applicant</p>
                 <FileUploadField label="" fieldName="generalUpload" currentFile={formData.files['generalUpload']} onChange={handleFileChange} />
              </div>

            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={handleDiscardPrompt} disabled={isLoading}>Cancel</button>
              <button className="modal-save-btn" onClick={handleSaveConfirmation} disabled={isLoading}>
                {isLoading ? "Saving..." : "Add Applicant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: SUCCESS CONFIRMATION --- */}
      {step === 3 && (
        <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && resetAndClose()}>
          <div className="modal-content modal-content-md">
            <div className="modal-header">
              <div><h3>Applicant Added</h3></div>
              <button className="modal-close-btn" onClick={resetAndClose}><X size={24} /></button>
            </div>
            <div className="confirmation-step">
                <div className="success-icon"><CheckCircle size={64} color="#10b981" strokeWidth={2} /></div>
                <h3>Success!</h3>
                <p>Applicant <strong>{formData.givenName} {formData.lastName}</strong> has been added.</p>
                <div className="confirmation-actions">
                    <button className="submit-inquiry-btn" onClick={resetAndClose}>Close</button>
                </div>
            </div>
          </div>
        </div>
      )}

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

const FileUploadField = ({ label, fieldName, currentFile, onChange }) => (
    <div className="form-group">
        {label && <label>{label}</label>}
        <div className="file-input-wrapper">
            <label className="choose-file-btn" style={{color: 'white', cursor: 'pointer'}}>
                CHOOSE FILE
                <input type="file" style={{display:'none'}} onChange={(e) => onChange(e, fieldName)} />
            </label>
            <span className="file-name">
                {currentFile ? currentFile.name : "No file chosen"}
            </span>
        </div>
    </div>
);

export default VisaApplicationModal;